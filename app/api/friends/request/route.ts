import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import FriendRequest from "@/models/FriendRequest";

export async function POST(req: NextRequest) {
    try {
        let token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get("token")?.value;
        }
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await connectToDatabase();

        const body = await req.json();
        const { receiverId } = body;

        if (!receiverId) {
            return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
        }
        if (receiverId === decoded.userId) {
            return NextResponse.json({ error: "You cannot send a friend request to yourself" }, { status: 400 });
        }

        // Check for an existing request in either direction
        const existing = await FriendRequest.findOne({
            $or: [
                { sender: decoded.userId, receiver: receiverId },
                { sender: receiverId, receiver: decoded.userId }
            ]
        });

        if (existing) {
            return NextResponse.json({ error: `Friend request already ${existing.status}` }, { status: 400 });
        }

        const request = await FriendRequest.create({
            sender: decoded.userId,
            receiver: receiverId,
            status: "pending"
        });

        return NextResponse.json(request);

    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: "Friend request already exists" }, { status: 400 });
        }
        console.error("Send friend request error:", error);
        return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
    }
}
