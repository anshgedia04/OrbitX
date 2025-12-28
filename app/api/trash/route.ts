import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import Folder from "@/models/Folder";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
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

        const notes = await Note.find({ owner: decoded.userId, isTrashed: true })
            .select("title content type updatedAt")
            .sort({ updatedAt: -1 });

        const folders = await Folder.find({ owner: decoded.userId, isTrashed: true })
            .select("name path updatedAt")
            .sort({ updatedAt: -1 });

        return NextResponse.json({ notes, folders });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
