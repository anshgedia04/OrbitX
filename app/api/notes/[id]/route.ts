import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as Diff from "diff";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import { verifyToken } from "@/lib/auth";
import { NoteSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;
        let token;
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else {
            token = req.cookies.get("token")?.value;
        }

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await connectToDatabase();

        const note = await Note.findOne({ _id: id, owner: decoded.userId });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        return NextResponse.json(note);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;

        // Auth check (Header or Cookie)
        let token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get('token')?.value;
        }

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const result = NoteSchema.partial().safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        await connectToDatabase();

        const note = await Note.findOne({ _id: id, owner: decoded.userId });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Versioning logic
        if (result.data.content && result.data.content !== note.content) {
            const oldContent = note.content || "";
            const newContent = result.data.content;

            // Calculate change percentage
            const changes = Diff.diffChars(oldContent, newContent);
            let changedChars = 0;
            changes.forEach(part => {
                if (part.added || part.removed) {
                    changedChars += part.value.length;
                }
            });

            const totalLength = Math.max(oldContent.length, newContent.length);
            const changePercent = totalLength > 0 ? (changedChars / totalLength) : 1;

            // Save version if change > 20% or if it's the first version
            if (changePercent > 0.2 || note.versions.length === 0) {
                note.versions.push({
                    content: oldContent,
                    updatedAt: new Date(),
                    changeDescription: `Changed ${Math.round(changePercent * 100)}% of content`
                });

                // Limit versions to last 20
                if (note.versions.length > 20) {
                    note.versions.shift();
                }
            }
        }

        const updatedNote = await Note.findByIdAndUpdate(
            id,
            {
                ...result.data,
                versions: note.versions
            },
            { new: true }
        );

        if (!updatedNote) {
            throw new Error("Failed to update note");
        }

        // Log activity for title updates or significant content edits (optional logic)
        // For simplicity, let's log "edit" if title or content was in the body
        if (result.data.title || result.data.content) {
            await logActivity(decoded.userId, "edit", updatedNote._id, updatedNote.title, "note");
        }

        return NextResponse.json(updatedNote);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;
        let token;
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else {
            token = req.cookies.get("token")?.value;
        }

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await connectToDatabase();

        const note = await Note.findOne({ _id: id, owner: decoded.userId });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Soft delete
        (note as any).isTrashed = true;
        await note.save();

        // Log activity
        await logActivity(decoded.userId, "delete", note._id, note.title, "note");

        return NextResponse.json({ message: "Note moved to trash" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
