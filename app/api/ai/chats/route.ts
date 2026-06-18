import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neon";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
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

        const chats = await sql`
            SELECT id, name, created_at, updated_at 
            FROM ai_chat_sessions 
            WHERE user_id = ${decoded.userId} 
            ORDER BY updated_at DESC
        `;

        return NextResponse.json(chats);
    } catch (error) {
        console.error("Failed to fetch chats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
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
        const { name } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: "Chat name is required" }, { status: 400 });
        }

        const newChat = await sql`
            INSERT INTO ai_chat_sessions (user_id, name) 
            VALUES (${decoded.userId}, ${name}) 
            RETURNING id, name, created_at, updated_at
        `;

        return NextResponse.json(newChat[0]);
    } catch (error) {
        console.error("Failed to create chat:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
