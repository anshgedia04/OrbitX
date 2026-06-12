import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";

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

        const currentUser = await User.findById(decoded.userId).populate("friends", "_id name email username avatar").lean();
        
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Add relationStatus: 'friends' to each friend so the UI handles it correctly
        const friendsList = (currentUser.friends || []).map((friend: any) => ({
            ...friend,
            relationStatus: "friends"
        }));

        return NextResponse.json(friendsList);
    } catch (error: any) {
        console.error("Fetch friends list error:", error);
        return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
    }
}
