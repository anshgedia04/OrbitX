"use client";

import React from "react";
import { StarBackground } from "@/components/ui/StarBackground";
import { ToastProvider } from "@/components/ui/Toast";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToastProvider>
            <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background text-white">
                <StarBackground />

                {/* Nebula effects */}
                <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 w-full max-w-md p-4">
                    {children}
                </div>
            </div>
        </ToastProvider>
    );
}
