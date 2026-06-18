import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value || req.headers.get("authorization")?.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const planId = body.planId || 'pro'; // Default to pro if not provided

        // Amount in paise (e.g. ₹9 = 900 paise, ₹49 = 4900 paise)
        const amount = planId === 'plus' ? 4900 : 900;
        const currency = "INR";

        const options = {
            amount: amount,
            currency: currency,
            receipt: `receipt_${Date.now()}`,
            notes: {
                // Attach the user's ID securely
                userId: decoded.userId,
                // Attach the plan ID securely
                plan: planId,
            },
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
        }

        return NextResponse.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        });
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
