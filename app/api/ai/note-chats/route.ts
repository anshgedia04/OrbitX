import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/neon";

// Ensure the table exists (idempotent)
async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS note_chats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            note_id VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS idx_note_chats_note_user
        ON note_chats(note_id, user_id, created_at);
    `;
}

async function getUser(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || req.headers.get("authorization")?.split(" ")[1];
    if (!token) return null;
    return verifyToken(token);
}

// GET /api/ai/note-chats?noteId=xxx  → fetch chat history for a note
export async function GET(req: NextRequest) {
    try {
        const decoded = await getUser(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const noteId = req.nextUrl.searchParams.get("noteId");
        if (!noteId) return NextResponse.json({ error: "noteId is required" }, { status: 400 });

        await ensureTable();

        const rows = await sql`
            SELECT id, role, content, created_at
            FROM note_chats
            WHERE note_id = ${noteId}
              AND user_id = ${decoded.userId}
            ORDER BY created_at ASC
            LIMIT 200;
        `;

        return NextResponse.json({ chats: rows });
    } catch (error: any) {
        console.error("Note chats GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/ai/note-chats  → save a pair of messages (user + assistant)
export async function POST(req: NextRequest) {
    try {
        const decoded = await getUser(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { noteId, userMessage, assistantMessage } = body;

        if (!noteId || !userMessage || !assistantMessage) {
            return NextResponse.json({ error: "noteId, userMessage, assistantMessage are required" }, { status: 400 });
        }

        await ensureTable();

        // Insert user message
        await sql`
            INSERT INTO note_chats (note_id, user_id, role, content)
            VALUES (${noteId}, ${decoded.userId}, 'user', ${userMessage});
        `;

        // Insert assistant message
        await sql`
            INSERT INTO note_chats (note_id, user_id, role, content)
            VALUES (${noteId}, ${decoded.userId}, 'assistant', ${assistantMessage});
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Note chats POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/ai/note-chats?noteId=xxx  → clear chat history for a note
export async function DELETE(req: NextRequest) {
    try {
        const decoded = await getUser(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const noteId = req.nextUrl.searchParams.get("noteId");
        if (!noteId) return NextResponse.json({ error: "noteId is required" }, { status: 400 });

        await sql`
            DELETE FROM note_chats
            WHERE note_id = ${noteId}
              AND user_id = ${decoded.userId};
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Note chats DELETE error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
