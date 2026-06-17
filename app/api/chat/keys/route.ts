import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getAuth(req: NextRequest) {
    let token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get('token')?.value;
    }
    if (!token) return null;
    return await verifyToken(token);
}

export async function POST(req: NextRequest) {
    try {
        const decoded = await getAuth(req);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { publicKey } = body;

        if (!publicKey) {
            return NextResponse.json({ error: 'Public key is required' }, { status: 400 });
        }

        await dbConnect();
        
        await User.findByIdAndUpdate(decoded.userId, { publicKey });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving public key:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const decoded = await getAuth(req);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const friendId = req.nextUrl.searchParams.get('friendId');
        if (!friendId) {
            return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
        }

        await dbConnect();

        const friend = await User.findById(friendId).select('publicKey');
        if (!friend) {
            return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
        }

        return NextResponse.json({ publicKey: friend.publicKey || null });
    } catch (error) {
        console.error('Error fetching public key:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
