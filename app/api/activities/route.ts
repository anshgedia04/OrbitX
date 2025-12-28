import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Activity from "@/models/Activity";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        let token;
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else {
            token = req.cookies.get("token")?.value;
        }

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch recent activities
        const activities = await Activity.find({ user: decoded.userId })
            .sort({ createdAt: -1 })
            .limit(10);

        return NextResponse.json(activities);
    } catch (error: any) {
        console.error("Failed to fetch activities:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
