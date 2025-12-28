import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { calculateUserStorage, STORAGE_LIMIT } from "@/lib/storage";

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

        const used = await calculateUserStorage(decoded.userId);

        return NextResponse.json({
            used,
            limit: STORAGE_LIMIT,
            percentage: Math.min((used / STORAGE_LIMIT) * 100, 100)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
