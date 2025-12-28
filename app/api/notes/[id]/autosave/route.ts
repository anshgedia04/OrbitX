import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import { verifyToken } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const { content } = body;

        if (content === undefined) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        await connectToDatabase();

        // Update content without creating a version
        const updatedNote = await Note.findOneAndUpdate(
            { _id: id, owner: decoded.userId },
            { content },
            { new: true }
        );

        if (!updatedNote) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Autosaved", updatedAt: updatedNote.updatedAt });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
