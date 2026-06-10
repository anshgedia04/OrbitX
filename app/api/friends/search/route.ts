import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import UserName from "@/models/UserName";
import User from "@/models/User";
import FriendRequest from "@/models/FriendRequest";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
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

        const url = new URL(req.url);
        const query = url.searchParams.get("q") || "";

        if (!query || query.length < 2) return NextResponse.json([]);

        let searchFilter: any = {};

        if (query.startsWith("@")) {
            const username = query.slice(1).toLowerCase();
            if (!username) return NextResponse.json([]);
            searchFilter = { username: { $regex: `^${username}`, $options: "i" } };
        } else if (query.startsWith("#")) {
            const email = query.slice(1).toLowerCase();
            if (!email) return NextResponse.json([]);
            searchFilter = { email: { $regex: `^${email}`, $options: "i" } };
        } else {
            return NextResponse.json([]);
        }

        // Find matching entries in the UserName collection
        const matches = await UserName.find(searchFilter).limit(10).lean();
        if (!matches.length) return NextResponse.json([]);

        const userIds = matches.map((m: any) => m.userId);

        // Fetch full user profiles
        const users = await User.find({ _id: { $in: userIds } })
            .select("_id name email username avatar friends")
            .lean();

        const currentUserId = new mongoose.Types.ObjectId(decoded.userId);

        // Enrich each user with their relation status to the current user
        // Possible values: 'self' | 'friends' | 'pending_sent' | 'pending_received' | 'none'
        const enrichedUsers = await Promise.all(
            users.map(async (user: any) => {
                const userId = user._id.toString();

                if (userId === decoded.userId) {
                    return { ...user, relationStatus: "self" };
                }

                // Check if already friends — O(1) using $in on indexed friends array
                const isFriend = user.friends?.some(
                    (fId: any) => fId.toString() === decoded.userId
                );
                if (isFriend) {
                    return { ...user, relationStatus: "friends" };
                }

                // Check for a pending request in either direction
                const existingRequest = await FriendRequest.findOne({
                    $or: [
                        { sender: decoded.userId, receiver: user._id, status: "pending" },
                        { sender: user._id, receiver: decoded.userId, status: "pending" },
                    ],
                }).lean();

                if (existingRequest) {
                    const req = existingRequest as any;
                    if (req.sender.toString() === decoded.userId) {
                        return { ...user, relationStatus: "pending_sent" };
                    } else {
                        return { ...user, relationStatus: "pending_received" };
                    }
                }

                return { ...user, relationStatus: "none" };
            })
        );

        return NextResponse.json(enrichedUsers);

    } catch (error: any) {
        console.error("Friend search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
