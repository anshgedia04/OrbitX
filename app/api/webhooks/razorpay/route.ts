import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

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
            const email = payment.email; // Razorpay Payment Page requires email field
            const orderId = payment.order_id;
            const paymentId = payment.id;

            if (!email) {
                console.error('No email found in payment payload');
                return NextResponse.json({ error: 'No email provided' }, { status: 400 });
            }

            // 4. Update User
            await dbConnect();

            // Calculate expiry (1 year for Pro plan as per your setup)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            const updatedUser = await User.findOneAndUpdate(
                { email: email },
                {
                    $set: {
                        subscriptionStatus: 'pro',
                        subscriptionId: paymentId,
                        subscriptionPlan: 'pro_yearly',
                        subscriptionExpiry: expiryDate,
                    }
                },
                { new: true }
            );

            if (!updatedUser) {
                console.error(`User with email ${email} not found`);
                // Return 200 even if user not found to stop Razorpay from retrying, 
                // but log it for manual reconciliation.
                return NextResponse.json({ message: 'User not found, but webhook received' }, { status: 200 });
            }

            console.log(`Subscription activated for ${email}`);
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
