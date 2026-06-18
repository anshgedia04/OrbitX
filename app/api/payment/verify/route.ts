import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId, token } = body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing Razorpay tokens' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            console.error('RAZORPAY_KEY_SECRET is missing');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Verify the signature
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error('Invalid signature detected during synchronous verification');
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // Verify User Identity
        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
        }

        await dbConnect();

        // Calculate Expiry
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        
        // Determine plan dynamically
        const finalPlan = planId === 'plus' ? 'plus' : 'pro';

        // Direct MongoDB Update (bypass mongoose schema cache for hot reloads)
        const updateResult = await User.collection.updateOne(
            { _id: new mongoose.Types.ObjectId(decoded.userId) },
            [
                {
                    $set: {
                        subscriptionStatus: {
                            $cond: {
                                if: { $and: [ { $eq: ["$subscriptionStatus", "plus"] }, { $eq: [finalPlan, "pro"] } ] },
                                then: "$subscriptionStatus", // don't downgrade
                                else: finalPlan
                            }
                        },
                        subscriptionId: razorpay_payment_id,
                        subscriptionPlan: finalPlan,
                        subscriptionExpiry: expiryDate,
                        updatedAt: new Date(),
                    }
                }
            ]
        );

        if (updateResult.matchedCount === 0) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        return NextResponse.json({ success: true, plan: finalPlan });
    } catch (error: any) {
        console.error("Payment synchronous verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
