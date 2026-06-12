import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import FriendRequest from "@/models/FriendRequest";

async function getDecoded(req: NextRequest) {
    let token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get("token")?.value;
    }
    if (!token) return null;
    return verifyToken(token);
}

export async function POST(req: NextRequest) {
    try {
        const decoded = await getDecoded(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();

        const body = await req.json();
        const { friendId } = body;

        if (!friendId) {
            return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
        }

        // Remove friend from current user's friends list
        await User.findByIdAndUpdate(decoded.userId, { $pull: { friends: friendId } });
        
        // Remove current user from friend's friends list
        await User.findByIdAndUpdate(friendId, { $pull: { friends: decoded.userId } });

        // Optionally, remove any accepted friend requests to clean up DB
        await FriendRequest.deleteMany({
            $or: [
                { sender: decoded.userId, receiver: friendId },
                { sender: friendId, receiver: decoded.userId },
            ]
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Unfriend error:", error);
        return NextResponse.json({ error: "Failed to unfriend" }, { status: 500 });
    }
}
