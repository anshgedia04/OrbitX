import { NextResponse } from 'next/server';
import { verifyRefreshToken, generateToken, generateRefreshToken } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { refreshToken } = await req.json();

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const newToken = generateToken({ userId: user._id, email: user.email });
        const newRefreshToken = generateRefreshToken({ userId: user._id });

        return NextResponse.json({
            token: newToken,
            refreshToken: newRefreshToken,
        });

    } catch (error) {
        console.error('Refresh error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
