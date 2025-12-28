import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ForgotPasswordSchema } from '@/lib/validations';
import { generateToken, sendEmail } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        const result = ForgotPasswordSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const { email } = result.data;
        const user = await User.findOne({ email });

        if (user) {
            // Generate a short-lived token for reset (e.g., 1 hour)
            // Reusing generateToken for simplicity, but ideally use a specific secret/expiry
            const resetToken = generateToken({ userId: user._id, type: 'reset' });

            const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

            await sendEmail(email, 'Password Reset', `Click here to reset your password: ${resetLink}`);
        }

        // Always return success to prevent email enumeration
        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
