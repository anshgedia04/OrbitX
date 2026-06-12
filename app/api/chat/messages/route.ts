import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sql } from '@/lib/neon';
import { pusherServer } from '@/lib/pusher';

async function getAuth(req: NextRequest) {
    let token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get('token')?.value;
    }
    if (!token) return null;
    return await verifyToken(token);
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

        const myId = decoded.userId;

        const messages = await sql`
            SELECT id, sender_id, receiver_id, encrypted_content, iv, created_at
            FROM messages
            WHERE (
                (sender_id = ${myId} AND receiver_id = ${friendId})
                OR
                (sender_id = ${friendId} AND receiver_id = ${myId})
            )
            AND created_at > NOW() - INTERVAL '6 hours'
            ORDER BY created_at ASC;
        `;

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const decoded = await getAuth(req);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { receiverId, encryptedContent, iv } = body;

        if (!receiverId || !encryptedContent || !iv) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const myId = decoded.userId;

        const result = await sql`
            INSERT INTO messages (sender_id, receiver_id, encrypted_content, iv)
            VALUES (${myId}, ${receiverId}, ${encryptedContent}, ${iv})
            RETURNING id, created_at;
        `;

        await sql`
            DELETE FROM messages
            WHERE created_at <= NOW() - INTERVAL '6 hours';
        `;

        const messageData = {
            id: result[0].id,
            sender_id: myId,
            receiver_id: receiverId,
            encrypted_content: encryptedContent,
            iv: iv,
            created_at: result[0].created_at
        };

        // Determine deterministic channel name
        const channelName = [myId, receiverId].sort().join('-');
        
        // Broadcast the message asynchronously
        pusherServer.trigger(channelName, 'new-message', messageData).catch(err => {
            console.error('Failed to trigger pusher event:', err);
        });

        return NextResponse.json({ 
            success: true, 
            message: {
                id: result[0].id,
                created_at: result[0].created_at
            }
        });
    } catch (error) {
        console.error('Error saving message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
