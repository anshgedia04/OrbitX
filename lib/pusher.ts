import PusherServer from 'pusher';

// Server-side Pusher instance
export const pusherServer = new PusherServer({
    appId: process.env.pusher_app_id!,
    key: process.env.pusher_key!,
    secret: process.env.pusher_secret!,
    cluster: process.env.pusher_cluster!,
    useTLS: true,
});
