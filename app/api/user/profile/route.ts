import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const ProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    avatar: z.string().optional(),
});

export async function GET(req: NextRequest) {
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

        await connectToDatabase();

        let user = await User.findById(decoded.userId).select("-passwordHash");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check for subscription expiry
        if (user.subscriptionStatus === 'pro' && user.subscriptionExpiry && new Date() > new Date(user.subscriptionExpiry)) {
            user.subscriptionStatus = 'free';
            user.subscriptionPlan = undefined;
            user.subscriptionExpiry = undefined;
            await user.save();
        }

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
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
        const result = ProfileSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        await connectToDatabase();

        // Check if email is taken by another user
        if (result.data.email) {
            const existingUser = await User.findOne({ email: result.data.email, _id: { $ne: decoded.userId } });
            if (existingUser) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            decoded.userId,
            {
                name: result.data.name,
                email: result.data.email,
                avatar: result.data.avatar
            },
            { new: true }
        ).select("-passwordHash");

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
