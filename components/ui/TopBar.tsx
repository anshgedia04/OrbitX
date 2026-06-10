"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, User, Menu, Home, UserPlus } from "lucide-react";
import { Button } from "./Button";
import { SearchModal } from "@/components/search/SearchModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { FriendRequestModal } from "@/components/friends/FriendRequestModal";
import { NotificationsDropdown } from "@/components/friends/NotificationsDropdown";

interface TopBarProps {
    onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "k") {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
            <div className="h-16 border-b border-white/10 bg-[#0f111a]/50 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-20">
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="sm" className="lg:hidden !p-2" onClick={onMenuClick}>
                        <Menu className="w-5 h-5" />
                    </Button>


                    {/* Search Trigger */}
                    <div
                        onClick={() => setIsSearchOpen(true)}
                        className="relative max-w-md w-full hidden md:block group cursor-pointer"
                    >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" />
                        <div className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white/30 group-hover:text-white/50 group-hover:border-white/20 transition-all flex items-center justify-between">
                            <span>Search notes...</span>
                            <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/30">
                                <span className="text-xs">Ctrl</span>K
                            </kbd>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="md:hidden p-2 text-white/70 hover:text-white"
                    >
                        <Search size={20} />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {/* Home */}
                        <Link
                            href="/dashboard"
                            className="p-2 text-white/50 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium"
                            title="Home"
                        >
                            <Home className="w-5 h-5" />
                            <span className="hidden sm:inline">Home</span>
                        </Link>

                        {/* Friend Requests */}
                        <button 
                            className="p-2 text-white/50 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium"
                            title="Find Friends"
                            onClick={() => {
                                if (!user?.username) {
                                    showToast("Please set your unique username first to connect with friends.", "error");
                                    router.push("/settings");
                                    return;
                                }
                                setIsFriendModalOpen(true);
                            }}
                        >
                            <UserPlus className="w-5 h-5" />
                        </button>

                        <div className="relative">
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="p-2 text-white/50 hover:text-white transition-colors relative"
                            >
                                <Bell size={20} />
                                {/* Optional: A real unread count would require fetching in TopBar, but we'll show red dot for now */}
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f111a]" />
                            </button>
                            <NotificationsDropdown 
                                isOpen={isNotificationsOpen} 
                                onClose={() => setIsNotificationsOpen(false)} 
                            />
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

                    <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-white">{user?.name || 'User'}</div>
                            <div className="text-xs text-white/50">{user?.subscriptionStatus === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                            <div className="w-full h-full rounded-full bg-[#0f111a] flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name || 'User'}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <FriendRequestModal isOpen={isFriendModalOpen} onClose={() => setIsFriendModalOpen(false)} />
        </>
    );
};
