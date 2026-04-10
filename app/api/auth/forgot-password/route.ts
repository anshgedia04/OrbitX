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
            const resetToken = generateToken({ userId: user._id, type: 'reset' });
            const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #ffffff; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 20px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
                        .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 20px; text-align: center; }
                        .content { padding: 40px 30px; text-align: center; }
                        .footer { padding: 20px; text-align: center; color: rgba(255,255,255,0.5); font-size: 12px; }
                        h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
                        p { line-height: 1.6; color: rgba(255,255,255,0.8); margin-bottom: 30px; }
                        .btn { display: inline-block; padding: 14px 32px; background: #a855f7; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                        .logo { font-size: 28px; font-weight: 800; margin-bottom: 10px; display: block; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <span class="logo">OrbitX</span>
                            <h1>Reset Your Password</h1>
                        </div>
                        <div class="content">
                            <p>We received a request to reset your password for your OrbitX account. Click the button below to set a new password. This link will expire in 1 hour.</p>
                            <a href="${resetLink}" class="btn">Reset Password</a>
                            <p style="margin-top: 30px; font-size: 14px; color: rgba(255,255,255,0.5);">If you didn't request this, you can safely ignore this email.</p>
                        </div>
                        <div class="footer">
                            &copy; ${new Date().getFullYear()} OrbitX Notes. All rights reserved.
                        </div>
                    </div>
                </body>
                </html>
            `;

            await sendEmail(email, 'Password Reset - OrbitX Notes', emailHtml);
        }

        // Always return success to prevent email enumeration
        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
