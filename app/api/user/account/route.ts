import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Note from "@/models/Note";
import Folder from "@/models/Folder";
import { verifyToken } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
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

        // Delete all user data
        await Note.deleteMany({ owner: decoded.userId });
        await Folder.deleteMany({ owner: decoded.userId });
        await User.findByIdAndDelete(decoded.userId);

        // Clear cookie
        const cookieStore = await cookies();
        cookieStore.delete('token');

        return NextResponse.json({ message: "Account deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

        const user = await User.findById(decoded.userId).select("-passwordHash");
        const notes = await Note.find({ owner: decoded.userId });
        const folders = await Folder.find({ owner: decoded.userId });

        const exportData = {
            user,
            notes,
            folders,
            exportDate: new Date()
        };

        return NextResponse.json(exportData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
