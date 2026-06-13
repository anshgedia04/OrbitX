import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const key = process.env.pusher_key;
    const cluster = process.env.pusher_cluster;

    if (!key || !cluster) {
        console.error('[Pusher Config] Missing pusher_key or pusher_cluster environment variables');
        return NextResponse.json(
            { error: 'Pusher not configured on server' },
            { status: 500 }
        );
    }

    return NextResponse.json({ key, cluster });
}
