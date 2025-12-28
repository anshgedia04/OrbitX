import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import { verifyToken } from "@/lib/auth";

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

        const body = await req.json();
        const { isShared, shareExpiresAt, sharePermissions } = body;

        await connectToDatabase();

        const note = await Note.findOne({ _id: id, owner: decoded.userId });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Update share settings
        note.isShared = isShared;
        if (isShared && !note.shareToken) {
            note.shareToken = uuidv4();
        }
        if (shareExpiresAt !== undefined) {
            note.shareExpiresAt = shareExpiresAt;
        }
        if (sharePermissions !== undefined) {
            note.sharePermissions = sharePermissions;
        }

        await note.save();

        return NextResponse.json({
            isShared: note.isShared,
            shareToken: note.shareToken,
            shareExpiresAt: note.shareExpiresAt,
            sharePermissions: note.sharePermissions
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

        const note = await Note.findOne({ _id: id, owner: decoded.userId });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Revoke sharing
        note.isShared = false;
        note.shareToken = undefined;
        note.shareExpiresAt = undefined;

        await note.save();

        return NextResponse.json({ message: "Sharing revoked" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
