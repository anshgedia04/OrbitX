export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import FCMToken from "@/models/FCMToken";

async function getDecoded(req: NextRequest) {
    let token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get("token")?.value;
    }
    if (!token) return null;
    return verifyToken(token);
}

// GET /api/fcm/debug — check your own stored FCM tokens
export async function GET(req: NextRequest) {
    try {
        const decoded = await getDecoded(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();

        const tokens = await FCMToken.find({ userId: decoded.userId }).lean();

        return NextResponse.json({
            userId: decoded.userId,
            tokenCount: tokens.length,
            tokens: tokens.map((t: any) => ({
                token: t.token.slice(0, 20) + "...", // partial for security
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            })),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
