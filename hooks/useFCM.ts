"use client";

import { useEffect, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase-client";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useFCM(userId: string | undefined) {
    const registered = useRef(false);

    useEffect(() => {
        if (!userId || registered.current) return;

        async function initFCM() {
            console.log("[FCM] Starting init for user:", userId);

            // Step 1: Browser support
            if (!("Notification" in window)) {
                console.warn("[FCM] ❌ Notifications API not supported in this browser");
                return;
            }
            if (!("serviceWorker" in navigator)) {
                console.warn("[FCM] ❌ Service Worker not supported in this browser");
                return;
            }
            console.log("[FCM] ✅ Browser supports notifications + service workers");

            // Step 2: Check/request permission
            console.log("[FCM] Current permission:", Notification.permission);
            if (Notification.permission === "denied") {
                console.warn("[FCM] ❌ Notifications blocked by user — cannot request again");
                return;
            }

            const permission = await Notification.requestPermission();
            console.log("[FCM] Permission result:", permission);
            if (permission !== "granted") {
                console.warn("[FCM] ❌ User did not grant notification permission");
                return;
            }
            console.log("[FCM] ✅ Notification permission granted");

            // Step 3: Firebase messaging support check
            const messaging = await getFirebaseMessaging();
            if (!messaging) {
                console.warn("[FCM] ❌ Firebase Messaging not supported (likely not HTTPS or unsupported browser)");
                return;
            }
            console.log("[FCM] ✅ Firebase Messaging initialized");

            // Step 4: Register service worker
            try {
                await navigator.serviceWorker.register(
                    "/firebase-messaging-sw.js",
                    { scope: "/" }
                );
                console.log("[FCM] ✅ Service worker registered");
            } catch (swErr) {
                console.error("[FCM] ❌ Service worker registration failed:", swErr);
                return;
            }

            // Step 5: Wait for active service worker
            const readyRegistration = await navigator.serviceWorker.ready;
            console.log("[FCM] ✅ Service worker is active:", readyRegistration.scope);

            // Step 6: Get FCM token
            if (!VAPID_KEY) {
                console.error("[FCM] ❌ NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set in .env");
                return;
            }

            let fcmToken: string;
            try {
                fcmToken = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: readyRegistration,
                });
            } catch (tokenErr) {
                console.error("[FCM] ❌ Failed to get FCM token:", tokenErr);
                return;
            }

            if (!fcmToken) {
                console.warn("[FCM] ❌ getToken returned empty — check Firebase console VAPID key");
                return;
            }
            console.log("[FCM] ✅ FCM token obtained:", fcmToken.slice(0, 20) + "...");

            // Step 7: Save token to backend
            try {
                const res = await fetch("/api/fcm/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fcmToken }),
                });
                const data = await res.json();
                if (!res.ok) {
                    console.error("[FCM] ❌ Token registration API failed:", data);
                    return;
                }
                console.log("[FCM] ✅ Token saved to MongoDB successfully");
            } catch (regErr) {
                console.error("[FCM] ❌ Token registration request failed:", regErr);
                return;
            }

            registered.current = true;
            console.log("[FCM] 🎉 Push notifications fully set up!");

            // Step 8: Handle foreground messages (when tab is open and focused)
            onMessage(messaging, (payload) => {
                console.log("[FCM] 📨 Foreground message received:", payload);
                if (document.visibilityState !== "visible") {
                    const { title, body } = payload.notification || {};
                    if (title) {
                        new Notification(title, {
                            body: body || "",
                            icon: "/icon-192.png",
                            tag: "orbitx-message",
                        });
                    }
                }
            });
        }

        initFCM().catch(err => {
            console.error("[FCM] Unexpected error during init:", err);
        });
    }, [userId]);
}
