"use client";

import React from "react";
import { ToastProvider } from "@/components/ui/Toast";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToastProvider>
            <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background text-white">

                <div className="relative z-10 w-full max-w-md p-4">
                    {children}
                </div>
            </div>
        </ToastProvider>
    );
}
