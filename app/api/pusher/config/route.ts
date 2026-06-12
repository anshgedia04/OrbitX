import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        key: process.env.pusher_key,
        cluster: process.env.pusher_cluster,
    });
}
