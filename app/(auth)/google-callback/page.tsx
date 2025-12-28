"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const code = searchParams.get("code");

    useEffect(() => {
        const handleCallback = async () => {
            if (!code) {
                showToast("Authentication failed", "error");
                router.push("/login");
                return;
            }

            try {
                const response = await fetch("/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Login failed");
                }

                localStorage.setItem("token", result.token);
                localStorage.setItem("refreshToken", result.refreshToken);

                showToast("Successfully logged in!", "success");
                router.push("/");

            } catch (error: any) {
                showToast(error.message, "error");
                router.push("/login");
            }
        };

        handleCallback();
    }, [code, router, showToast]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="mt-4 text-white/50">Completing authentication...</p>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GoogleCallbackContent />
        </Suspense>
    );
}
