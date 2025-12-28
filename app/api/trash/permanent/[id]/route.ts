import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import Folder from "@/models/Folder";
import { verifyToken } from "@/lib/auth";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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

        // Try to delete Note
        const noteResult = await Note.deleteOne({ _id: id, owner: decoded.userId, isTrashed: true });
        if (noteResult.deletedCount > 0) {
            return NextResponse.json({ message: "Note permanently deleted" });
        }

        // Try to delete Folder
        const folder = await Folder.findOne({ _id: id, owner: decoded.userId, isTrashed: true });
        if (folder) {
            // Delete contents recursively?
            // Yes, permanent delete of folder should delete contents.
            await Note.deleteMany({ folder: id });
            await Folder.deleteMany({ parentFolder: id });
            await Folder.deleteOne({ _id: id });
            return NextResponse.json({ message: "Folder permanently deleted" });
        }

        return NextResponse.json({ error: "Item not found in trash" }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
