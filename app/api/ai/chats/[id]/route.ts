import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neon";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value || req.headers.get("authorization")?.split(" ")[1];

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        // Verify ownership
        const session = await sql`SELECT user_id FROM ai_chat_sessions WHERE id = ${id}`;
        if (session.length === 0 || session[0].user_id !== decoded.userId) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        const messages = await sql`
            SELECT id, role, content, created_at 
            FROM ai_chat_messages 
            WHERE session_id = ${id} 
            ORDER BY created_at ASC
        `;

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value || req.headers.get("authorization")?.split(" ")[1];

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const body = await req.json();
        const { name } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: "Chat name is required" }, { status: 400 });
        }

        const session = await sql`
            UPDATE ai_chat_sessions 
            SET name = ${name}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${id} AND user_id = ${decoded.userId}
            RETURNING id, name, created_at, updated_at
        `;

        if (session.length === 0) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json(session[0]);
    } catch (error) {
        console.error("Failed to rename chat:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value || req.headers.get("authorization")?.split(" ")[1];

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const session = await sql`
            DELETE FROM ai_chat_sessions 
            WHERE id = ${id} AND user_id = ${decoded.userId}
            RETURNING id
        `;

        if (session.length === 0) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete chat:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
