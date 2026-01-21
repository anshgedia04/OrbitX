"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopBar } from "@/components/ui/TopBar";
import { ToastProvider } from "@/components/ui/Toast";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { ShortcutsModal } from "@/components/ui/ShortcutsModal";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <ToastProvider>
                <DashboardContent>{children}</DashboardContent>
            </ToastProvider>
        </AuthProvider>
    );
}

function DashboardContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + N: New Note
            if (e.ctrlKey && e.key === "n") {
                e.preventDefault();
                router.push("/notes/new");
            }
            // Ctrl + /: Shortcuts
            if (e.ctrlKey && e.key === "/") {
                e.preventDefault();
                setIsShortcutsOpen(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router]);

    const isAiPage = pathname === "/ai";
    const isPro = user?.subscriptionStatus === 'pro';

    const handleFabClick = () => {
        if (isAiPage) {
            router.push("/");
        } else {
            if (isPro) {
                router.push("/ai");
            } else {
                router.push("/subscription"); // Or show an upgrade modal
            }
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-white font-sans">

            {/* Desktop Sidebar */}
            <div className="hidden lg:block h-full">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 20 }}
                            className="fixed inset-y-0 left-0 z-50 lg:hidden"
                        >
                            <Sidebar />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>

                <FloatingActionButton
                    onClick={handleFabClick}
                    variant={isAiPage ? "notebook" : "rocket"}
                />
            </div>

            <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        </div>
    );
}
