import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const PreferencesSchema = z.object({
    theme: z.string().optional(),
    autoSave: z.boolean().optional(),
    autoSaveInterval: z.number().min(5).max(300).optional(),
    defaultView: z.enum(['grid', 'list']).optional(),
    defaultFolder: z.string().nullable().optional(),
});

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
        const result = PreferencesSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Merge preferences
        const newPreferences = {
            ...user.preferences,
            ...result.data
        };

        user.preferences = newPreferences;
        await user.save();

        return NextResponse.json(user.preferences);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
