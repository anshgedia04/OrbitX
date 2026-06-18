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

// Get Hugging Face embeddings for multiple chunks in a single batch call
async function getBatchHFEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
    const response = await fetch(
        "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "x-wait-for-model": "true"
            },
            body: JSON.stringify({ inputs: texts }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        let errorMsg = `Hugging Face Embedding API error: ${errText}`;
        let status = response.status;
        try {
            const parsed = JSON.parse(errText);
            if (parsed.error?.includes("loading")) {
                errorMsg = "Hugging Face embedding model is warming up/loading. Please try again in 20 seconds.";
                status = 503;
            }
        } catch (_) {}

        const error = new Error(errorMsg);
        (error as any).status = status;
        throw error;
    }

    const data = await response.json();
    return data;
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

        const hfKey = process.env.HF_KEY;
        if (!hfKey) {
            return NextResponse.json({ error: "Hugging Face API key (HF_KEY) not configured" }, { status: 500 });
        }

        // 1. Chunk the text (increased chunk size and overlap for better context retention)
        const chunks = chunkText(note.content, 800, 200);

        // 2. Embed all chunks in a single batch using Hugging Face
        let allEmbeddings: number[][] = [];
        
        const BATCH_SIZE = 90;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + BATCH_SIZE);
            if (i > 0) await new Promise(r => setTimeout(r, 1000)); // Small pause between batches
            
            const batchEmbeddings = await getBatchHFEmbeddings(batchChunks, hfKey);
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
        const status = error.status || 500;
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status });
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
