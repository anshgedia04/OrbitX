import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tag from '@/models/Tag';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { TagSchema } from '@/lib/validations';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = await verifyToken(token);
        if (!decoded || !decoded.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tags = await Tag.find({ owner: decoded.userId }).sort({ usageCount: -1 });
        return NextResponse.json(tags);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = await verifyToken(token);
        if (!decoded || !decoded.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const result = TagSchema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: result.error.issues }, { status: 400 });

        const { name, color } = result.data;

        const existingTag = await Tag.findOne({ owner: decoded.userId, name });
        if (existingTag) return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });

        const tag = await Tag.create({
            name,
            color: color || 'bg-primary',
            owner: decoded.userId,
            usageCount: 0
        });

        return NextResponse.json(tag, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
