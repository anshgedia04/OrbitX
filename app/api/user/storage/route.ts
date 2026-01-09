import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { calculateUserStorage, STORAGE_LIMIT, PRO_STORAGE_LIMIT } from "@/lib/storage";

export const dynamic = "force-dynamic";

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

        await dbConnect();
        const user = await User.findById(decoded.userId);
        const isPro = user?.subscriptionStatus === 'pro';
        const limit = isPro ? PRO_STORAGE_LIMIT : STORAGE_LIMIT;

        const used = await calculateUserStorage(decoded.userId);

        return NextResponse.json({
            used,
            limit,
            percentage: Math.min((used / limit) * 100, 100)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
