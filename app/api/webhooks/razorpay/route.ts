import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // 1. Verify Signature
        if (!secret) {
            console.error('RAZORPAY_WEBHOOK_SECRET is not set');
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('Invalid signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // 2. Parse Event
        const event = JSON.parse(body);

        // 3. Handle payment.captured
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const email = payment.email;
            const userId = payment.notes?.userId; // Fetch the secure userId we attached during order creation
            
            // Determine plan securely based on the exact amount paid
            let plan = 'pro';
            if (payment.amount === 4900) {
                plan = 'plus';
            } else if (payment.amount === 900) {
                plan = 'pro';
            } else if (payment.notes?.plan) {
                plan = payment.notes.plan;
            }
            
            const paymentId = payment.id;

            if (!email && !userId) {
                console.error('No email or userId found in payment payload');
                return NextResponse.json({ error: 'No identification provided' }, { status: 400 });
            }

            // 4. Update User
            await dbConnect();
            
            console.log(`Razorpay Webhook: Received ${event.event} for ${email || userId}. Amount: ${payment.amount}, Computed Plan: ${plan}`);

            // Calculate expiry (1 month)
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);

            // Use userId if available (secure), otherwise fallback to email
            let query: any;
            if (userId && mongoose.Types.ObjectId.isValid(userId)) {
                 query = { _id: new mongoose.Types.ObjectId(userId) };
            } else {
                 query = { email: email };
            }

            // Using collection.updateOne bypasses Mongoose schema validation.
            // Only update if the user isn't already on a higher tier OR if the new plan is 'plus'
            const updateResult = await User.collection.updateOne(
                query,
                [
                    {
                        $set: {
                            subscriptionStatus: {
                                $cond: {
                                    if: { $and: [ { $eq: ["$subscriptionStatus", "plus"] }, { $eq: [plan, "pro"] } ] },
                                    then: "$subscriptionStatus", // Don't downgrade plus to pro on old webhook retries
                                    else: plan
                                }
                            },
                            subscriptionId: paymentId,
                            subscriptionPlan: plan,
                            subscriptionExpiry: expiryDate,
                            updatedAt: new Date(),
                        }
                    }
                ]
            );

            if (updateResult.matchedCount === 0) {
                console.error(`User with identifier ${userId || email} not found`);
                // Return 200 even if user not found to stop Razorpay from retrying, 
                // but log it for manual reconciliation.
                return NextResponse.json({ message: 'User not found, but webhook received' }, { status: 200 });
            }
            console.log(`Subscription activated for ${email || userId}`);
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
