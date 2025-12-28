import { NextResponse } from 'next/server';
import { addToBlacklist } from '@/lib/blacklist';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            addToBlacklist(token);
        }
        const response = NextResponse.json({ message: 'Logged out successfully' });

        response.cookies.delete('token');

        return response;
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
