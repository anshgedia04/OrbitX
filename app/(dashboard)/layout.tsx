"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopBar } from "@/components/ui/TopBar";
import { ToastProvider } from "@/components/ui/Toast";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { ShortcutsModal } from "@/components/ui/ShortcutsModal";
import { TalkPanel } from "@/components/chat/TalkPanel";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { useChatStore } from "@/store/use-chat-store";

// TalkPanel width in px — must match the motion.div width below
const TALK_PANEL_WIDTH = 288;

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
    const [isTalkPanelOpen, setIsTalkPanelOpen] = useState(false);
    const { activeFriend, setActiveFriend } = useChatStore();

    const isAiPage = pathname === "/ai";
    const isChatPage = pathname.startsWith("/chat");
    const isPro = user?.subscriptionStatus === "pro";

    // Closing the panel: always allowed. On chat page, go home since conversation needs the panel.
    const handleTalkClose = () => {
        setIsTalkPanelOpen(false);
        setActiveFriend(null);
    };

    const handleTalkToggle = () => {
        if (isTalkPanelOpen) {
            handleTalkClose();
        } else {
            setIsTalkPanelOpen(true);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "n") {
                e.preventDefault();
                router.push("/notes/new");
            }
            if (e.ctrlKey && e.key === "/") {
                e.preventDefault();
                setIsShortcutsOpen(true);
            }
            if (e.key === "Escape" && isTalkPanelOpen) {
                handleTalkClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router, isTalkPanelOpen, isChatPage]);

    // Auto-open TalkPanel when navigating to chat page
    useEffect(() => {
        if (isChatPage) {
            setIsTalkPanelOpen(true);
        }
    }, [isChatPage]);

    const handleFabClick = () => {
        if (isAiPage) {
            router.push("/");
        } else {
            isPro ? router.push("/ai") : router.push("/subscription");
        }
    };

    const handleSelectFriend = (friend: any) => {
        setActiveFriend(friend);
        router.push(`/chat`);
    };

    // FAB right offset: shift left when TalkPanel open
    const fabRightOffset = isTalkPanelOpen ? TALK_PANEL_WIDTH + 24 : 32;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-white font-sans">

            {/* ── Left Sidebar — locked open on chat page ── */}
            <div className="hidden lg:block h-full shrink-0">
                <Sidebar
                    onTalkToggle={handleTalkToggle}
                    isTalkOpen={isTalkPanelOpen}
                    isLocked={isChatPage}
                />
            </div>

            {/* ── Mobile Sidebar Drawer ── */}
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
                            <Sidebar
                                onTalkToggle={handleTalkToggle}
                                isTalkOpen={isTalkPanelOpen}
                                isLocked={isChatPage}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main column (TopBar + content row) ── */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
                <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />

                {/* ── Content row: page content + TalkPanel side-by-side ── */}
                <div className="flex flex-1 overflow-hidden min-h-0">

                    {/* Page content */}
                    <main className="flex-1 overflow-y-auto relative z-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-w-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className={isChatPage ? "h-full" : "p-4 md:p-8 max-w-7xl mx-auto"}
                        >
                            {children}
                        </motion.div>
                    </main>

                    {/* ── TalkPanel — in-flow, animates width ── */}
                    <AnimatePresence initial={false}>
                        {isTalkPanelOpen && (
                            <motion.div
                                key="talk-panel-wrapper"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: TALK_PANEL_WIDTH, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.8 }}
                                className="shrink-0 overflow-hidden h-full"
                            >
                                <div style={{ width: TALK_PANEL_WIDTH }} className="h-full">
                                    <TalkPanel
                                        isOpen={isTalkPanelOpen}
                                        onClose={handleTalkClose}
                                        onSelectFriend={handleSelectFriend}
                                        selectedFriendId={activeFriend?._id}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── FAB — only on non-AI pages, shifts left when TalkPanel open ── */}
                {!isAiPage && !isChatPage && (
                    <FloatingActionButton
                        onClick={handleFabClick}
                        variant="ai"
                        rightOffset={fabRightOffset}
                    />
                )}
            </div>

            <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        </div>
    );
}
