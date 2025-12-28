import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, hashPassword, comparePassword } from "@/lib/auth";
import { z } from "zod";

const ChangePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
    try {
        // Auth check
        let token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get('token')?.value;
        }

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        await connectToDatabase();
        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "change_password") {
            const result = ChangePasswordSchema.safeParse(body);
            if (!result.success) {
                return NextResponse.json({ error: result.error.issues }, { status: 400 });
            }

            const isValid = await comparePassword(result.data.currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
            }

            user.passwordHash = await hashPassword(result.data.newPassword);
            // Invalidate other sessions
            user.tokenVersion += 1;
            await user.save();

            return NextResponse.json({ message: "Password updated successfully" });
        }

        if (action === "toggle_2fa") {
            user.twoFactorEnabled = !user.twoFactorEnabled;
            await user.save();
            return NextResponse.json({
                message: `Two-factor authentication ${user.twoFactorEnabled ? "enabled" : "disabled"}`,
                twoFactorEnabled: user.twoFactorEnabled
            });
        }

        if (action === "logout_all") {
            user.tokenVersion += 1;
            await user.save();
            return NextResponse.json({ message: "Logged out from all devices" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
