import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FCM_PROJECT_ID,
            clientEmail: process.env.FCM_CLIENT_EMAIL,
            // The private key uses literal \n in .env, replace with real newlines
            privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

export const adminMessaging = getMessaging();

