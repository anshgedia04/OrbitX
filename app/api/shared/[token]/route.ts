import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";

export async function GET(req: NextRequest, props: { params: Promise<{ token: string }> }) {
    const params = await props.params;
    try {
        const { token } = params;

        await connectToDatabase();

        const note = await Note.findOne({ shareToken: token, isShared: true });

        if (!note) {
            return NextResponse.json({ error: "Note not found or link expired" }, { status: 404 });
        }

        // Check expiration
        if (note.shareExpiresAt && new Date(note.shareExpiresAt) < new Date()) {
            return NextResponse.json({ error: "Share link expired" }, { status: 410 });
        }

        // Increment view count
        note.viewCount += 1;
        await note.save();

        // Return public data only
        return NextResponse.json({
            title: note.title,
            content: note.content,
            type: note.type,
            updatedAt: note.updatedAt,
            language: note.language,
            sharePermissions: note.sharePermissions
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
