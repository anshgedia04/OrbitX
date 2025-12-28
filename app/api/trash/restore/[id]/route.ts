import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import Folder from "@/models/Folder";
import { verifyToken } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;

        // Auth check
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

        await connectToDatabase();

        // Try to find in Notes first
        let note = await Note.findOne({ _id: id, owner: decoded.userId, isTrashed: true });
        if (note) {
            (note as any).isTrashed = false;
            await note.save();

            // Log activity
            await logActivity(decoded.userId, "restore", note._id, note.title, "note");

            return NextResponse.json({ message: "Note restored" });
        }

        // Try to find in Folders
        let folder = await Folder.findOne({ _id: id, owner: decoded.userId, isTrashed: true });
        if (folder) {
            (folder as any).isTrashed = false;
            await folder.save();

            // Restore contents?
            // Usually if we restore a folder, we might want to restore its contents too, 
            // or keep them trashed until explicitly restored.
            // Let's restore contents for better UX.
            await Note.updateMany({ folder: id, isTrashed: true }, { isTrashed: false });
            await Folder.updateMany({ parentFolder: id, isTrashed: true }, { isTrashed: false });

            // Log activity
            await logActivity(decoded.userId, "restore", folder._id, folder.name, "folder");

            return NextResponse.json({ message: "Folder restored" });
        }

        return NextResponse.json({ error: "Item not found in trash" }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
