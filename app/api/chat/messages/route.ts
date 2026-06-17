import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sql } from '@/lib/neon';
import { pusherServer } from '@/lib/pusher';
import connectToDatabase from '@/lib/mongodb';
import FCMToken from '@/models/FCMToken';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

async function getAuth(req: NextRequest) {
    let token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get('token')?.value;
    }
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: NextRequest) {
    try {
        const decoded = getAuth(req);
        const resolvedDecoded = decoded instanceof Promise ? await decoded : decoded;
        if (!resolvedDecoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const friendId = req.nextUrl.searchParams.get('friendId');
        if (!friendId) {
            return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
        }

        const myId = resolvedDecoded.userId;

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
        const decoded = getAuth(req);
        const resolvedDecoded = decoded instanceof Promise ? await decoded : decoded;
        if (!resolvedDecoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { receiverId, encryptedContent, iv } = body;

        if (!receiverId || !encryptedContent || !iv) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const myId = resolvedDecoded.userId;

        const result = await sql`
            INSERT INTO messages (sender_id, receiver_id, encrypted_content, iv)
            VALUES (${myId}, ${receiverId}, ${encryptedContent}, ${iv})
            RETURNING id, created_at;
        `;

        // Clean up old messages asynchronously
        sql`DELETE FROM messages WHERE created_at <= NOW() - INTERVAL '6 hours';`
            .catch(err => console.error('Cleanup error:', err));

        const messageData = {
            id: result[0].id,
            sender_id: myId,
            receiver_id: receiverId,
            encrypted_content: encryptedContent,
            iv: iv,
            created_at: result[0].created_at
        };

        // ── 1. Pusher real-time (awaited for Vercel) ──────────────────────────
        const channelName = [myId, receiverId].sort().join('-');
        try {
            await pusherServer.trigger(channelName, 'new-message', messageData);
        } catch (pusherErr) {
            console.error('[Pusher] Failed to trigger event:', pusherErr);
        }

        // ── 2. FCM Push Notification ─────────────────────────────────────────────
        // Awaited so errors appear in terminal/Vercel logs.
        // Still in try/catch so FCM failure never affects message delivery.
        try {
            await sendPushNotification(myId, receiverId);
        } catch (fcmErr) {
            console.error('[FCM] Push notification failed (non-fatal):', fcmErr);
        }

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

async function sendPushNotification(senderId: string, receiverId: string) {
    try {
        console.log(`[FCM-Server] Starting push notification process from ${senderId} to ${receiverId}`);
        await connectToDatabase();

        const sender = await User.findById(senderId).select('name username avatar').lean() as any;
        if (!sender) {
            console.log(`[FCM-Server] ❌ Sender not found in DB`);
            return;
        }

        const tokenDocs = await FCMToken.find({ userId: receiverId }).lean();
        if (!tokenDocs.length) {
            console.log(`[FCM-Server] ❌ No FCM tokens found for receiver ID: ${receiverId}`);
            return;
        }

        const tokens = tokenDocs.map((t: any) => t.token);
        console.log(`[FCM-Server] Found ${tokens.length} token(s) for receiver`);

        const notification = {
            title: `OrbitX Talk — ${sender.name}`,
            body: `@${sender.username || sender.name} sent you a message`,
        };

        const data = {
            senderId: String(senderId),
            senderName: sender.name,
            senderUsername: sender.username || '',
            url: '/chat',
        };

        // Dynamic import — keeps firebase-admin out of the initial module graph
        // so a failure here never affects message sending
        const { adminMessaging } = await import('@/lib/firebase-admin');

        const response = await adminMessaging.sendEachForMulticast({
            tokens,
            notification,
            data,
            webpush: {
                notification: {
                    title: notification.title,
                    body: notification.body,
                    icon: sender.avatar || '/icon-192.png',
                    badge: '/icon-72.png',
                    tag: senderId,
                    renotify: true,
                    requireInteraction: false,
                    actions: [
                        { action: 'open', title: '💬 Open Chat' },
                        { action: 'dismiss', title: 'Dismiss' }
                    ]
                },
                fcmOptions: { link: '/chat' }
            }
        });

        // Clean up stale tokens
        const staleTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const code = resp.error?.code;
                if (
                    code === 'messaging/registration-token-not-registered' ||
                    code === 'messaging/invalid-registration-token'
                ) {
                    staleTokens.push(tokens[idx]);
                }
            }
        });
        if (staleTokens.length > 0) {
            await FCMToken.deleteMany({ token: { $in: staleTokens } });
        }

        console.log(`[FCM] Push sent to ${response.successCount}/${tokens.length} device(s)`);
    } catch (err) {
        // FCM errors are always caught here — they never propagate up to break message sending
        console.error('[FCM] sendPushNotification error:', err);
    }
}
