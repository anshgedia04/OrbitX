import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validations';
import { comparePassword, generateToken, generateRefreshToken } from '@/lib/auth';
import rateLimit from "@/lib/rate-limit";

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function POST(req: Request) {
    try {
        // Rate Limiting
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        try {
            await limiter.check(NextResponse.next(), 10, ip); // 10 requests per minute per IP
        } catch {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        await dbConnect();
        const body = await req.json();

        const result = LoginSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const { email, password } = result.data;

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = generateToken({ userId: user._id, email: user.email });
        const refreshToken = generateRefreshToken({ userId: user._id });

        const response = NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
            refreshToken,
        });

        response.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
