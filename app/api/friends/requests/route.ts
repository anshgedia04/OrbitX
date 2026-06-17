export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import FriendRequest from "@/models/FriendRequest";
import User from "@/models/User";

async function getDecoded(req: NextRequest) {
    let token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get("token")?.value;
    }
    if (!token) return null;
    return verifyToken(token);
}

// GET — fetch incoming pending friend requests for the current user
export async function GET(req: NextRequest) {
    try {
        const decoded = await getDecoded(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();

        const requests = await FriendRequest.find({
            receiver: decoded.userId,
            status: "pending"
        })
            .populate("sender", "name email username avatar")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(requests);
    } catch (error: any) {
        console.error("Fetch requests error:", error);
        return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }
}

// PUT — accept or reject a friend request
export async function PUT(req: NextRequest) {
    try {
        const decoded = await getDecoded(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();

        const body = await req.json();
        const { requestId, action } = body;

        if (!["accept", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const request = await FriendRequest.findOne({
            _id: requestId,
            receiver: decoded.userId,
            status: "pending"
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        request.status = action === "accept" ? "accepted" : "rejected";
        await request.save();

        if (action === "accept") {
            // $addToSet prevents duplicates in the friends array — O(1) in the DB
            await User.findByIdAndUpdate(decoded.userId, { $addToSet: { friends: request.sender } });
            await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: decoded.userId } });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Process request error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
