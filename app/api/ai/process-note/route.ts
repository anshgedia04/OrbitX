import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import NoteEmbedding from "@/models/NoteEmbedding";

/**
 * Overlapping sliding-window chunker.
 * - chunkSize: target character length of each chunk
 * - overlap:   how many characters to repeat between adjacent chunks
 *   so context is never cut off at a boundary.
 */
function chunkText(text: string, chunkSize = 600, overlap = 150): string[] {
    // Normalise whitespace: collapse 3+ blank lines to 2
    const normalised = text.replace(/\n{3,}/g, "\n\n").trim();
    if (normalised.length === 0) return [];

    // Split into sentences / paragraph boundaries first
    const sentences: string[] = [];
    // Split on sentence endings, keeping the delimiter attached
    for (const raw of normalised.split(/(?<=[.!?\n])\s+/)) {
        const s = raw.trim();
        if (s.length > 0) sentences.push(s);
    }

    const chunks: string[] = [];
    let current = "";
    let overlapBuffer = "";

    for (const sentence of sentences) {
        const candidate = current + (current ? " " : "") + sentence;

        if (candidate.length <= chunkSize) {
            current = candidate;
        } else {
            // Flush current chunk
            if (current.length > 0) {
                chunks.push(current.trim());
                // Keep the last `overlap` characters as the overlap prefix
                overlapBuffer = current.length > overlap
                    ? current.slice(-overlap)
                    : current;
            }
            // Start next chunk from overlap buffer
            current = overlapBuffer + (overlapBuffer ? " " : "") + sentence;
            overlapBuffer = "";
        }
    }
    if (current.trim().length > 0) chunks.push(current.trim());

    // Final safety-split for chunks that are still too long (e.g. code blocks)
    const result: string[] = [];
    for (const chunk of chunks) {
        if (chunk.length > chunkSize * 2) {
            for (let i = 0; i < chunk.length; i += chunkSize - overlap) {
                const slice = chunk.slice(i, i + chunkSize).trim();
                if (slice.length > 0) result.push(slice);
            }
        } else {
            result.push(chunk);
        }
    }

    // Deduplicate exact duplicates
    return [...new Set(result)].filter(c => c.length > 20);
}

// Get Gemini embeddings for multiple chunks in a single batch call to avoid rate limits
async function getBatchGeminiEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
    const requests = texts.map(text => ({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] }
    }));

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requests }),
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini Batch Embedding API error: ${err}`);
    }

    const data = await response.json();
    return data.embeddings.map((e: any) => e.values);
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value || req.headers.get("authorization")?.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const { noteId } = body;

        if (!noteId) {
            return NextResponse.json({ error: "noteId is required" }, { status: 400 });
        }

        await connectToDatabase();

        const note = await Note.findOne({ _id: noteId, owner: decoded.userId });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        if (note.isAiProcessed) {
            const count = await NoteEmbedding.countDocuments({ noteId });
            if (count > 0) {
                return NextResponse.json({ success: true, message: "Note is already processed" }, { status: 200 });
            }
        }

        if (!note.content || note.content.trim().length === 0) {
            return NextResponse.json({ error: "Note is empty" }, { status: 400 });
        }

        const geminiKey = process.env.GOOGLE_AI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: "Google AI API key not configured" }, { status: 500 });
        }

        // 1. Chunk the text
        const chunks = chunkText(note.content, 600, 150);

        // 2. Embed all chunks in a single batch using Gemini
        let allEmbeddings: number[][] = [];
        
        // Gemini batch API limits to 100 requests per batch call, so we still chunk the batches
        const BATCH_SIZE = 90;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + BATCH_SIZE);
            if (i > 0) await new Promise(r => setTimeout(r, 1000)); // Small pause between batches
            
            const batchEmbeddings = await getBatchGeminiEmbeddings(batchChunks, geminiKey);
            allEmbeddings = allEmbeddings.concat(batchEmbeddings);
        }

        // 3. Save to MongoDB
        const embeddingsToInsert = chunks.map((chunk, index) => ({
            noteId: note._id,
            userId: decoded.userId,
            text: chunk,
            embedding: allEmbeddings[index],
            chunkIndex: index,
        }));

        await NoteEmbedding.deleteMany({ noteId: note._id });
        await NoteEmbedding.insertMany(embeddingsToInsert);

        note.isAiProcessed = true;
        await note.save();

        return NextResponse.json({ success: true, chunksProcessed: chunks.length }, { status: 200 });

    } catch (error: any) {
        console.error("Process Note Error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}

// Clear processed note (delete embeddings, set isAiProcessed=false, clear neon chats)
export async function DELETE(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value || req.headers.get("authorization")?.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const noteId = req.nextUrl.searchParams.get("noteId");
        if (!noteId) {
            return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Reset isAiProcessed flag on the Note
        const note = await Note.findOne({ _id: noteId, owner: decoded.userId });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }
        note.isAiProcessed = false;
        await note.save();

        // 2. Delete embeddings from MongoDB
        await NoteEmbedding.deleteMany({ noteId: note._id, userId: decoded.userId });

        // 3. Delete chats from Neon
        try {
            const { sql } = require("@/lib/neon");
            await sql`
                DELETE FROM note_chats
                WHERE note_id = ${noteId} AND user_id = ${decoded.userId};
            `;
        } catch (neonErr) {
            console.error("Failed to delete neon chats during note deletion:", neonErr);
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("Delete Processed Note Error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
