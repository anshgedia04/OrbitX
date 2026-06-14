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

// POST /api/fcm/register — save a user's FCM token
export async function POST(req: NextRequest) {
    try {
        const decoded = await getDecoded(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { fcmToken } = await req.json();
        if (!fcmToken) return NextResponse.json({ error: "fcmToken is required" }, { status: 400 });

        await connectToDatabase();

        // Upsert: if this token already exists, update its userId. 
        // If it's new, insert it. This handles browser token refreshes correctly.
        await FCMToken.findOneAndUpdate(
            { token: fcmToken },
            { userId: decoded.userId, token: fcmToken },
            { upsert: true, new: true }
        );

        console.log(`[FCM] Token registered for user ${decoded.userId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[FCM] Register error:", error);
        return NextResponse.json({ error: "Failed to register token" }, { status: 500 });
    }
}

// DELETE /api/fcm/register — remove a token (on logout)
export async function DELETE(req: NextRequest) {
    try {
        const { fcmToken } = await req.json();
        if (!fcmToken) return NextResponse.json({ error: "fcmToken is required" }, { status: 400 });

        await connectToDatabase();
        await FCMToken.deleteOne({ token: fcmToken });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[FCM] Delete error:", error);
        return NextResponse.json({ error: "Failed to remove token" }, { status: 500 });
    }
}
