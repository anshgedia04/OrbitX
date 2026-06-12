"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Search, Settings, ChevronLeft, ChevronRight, Users, Circle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

interface Friend {
    _id: string;
    name: string;
    username?: string;
    avatar?: string;
    email?: string;
}

interface ChatSidebarProps {
    friends: Friend[];
    isLoading: boolean;
    selectedFriendId?: string;
    onSelectFriend: (friend: Friend) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    friends,
    isLoading,
    selectedFriendId,
    onSelectFriend,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFriends = friends.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.username && f.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const sidebarVariants = {
        expanded: { width: 280 },
        collapsed: { width: 80 },
    };

    return (
        <motion.div
            initial="expanded"
            animate={isCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-50 shrink-0"
        >
            {/* Toggle Collapse Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 bg-primary text-white p-1 rounded-full shadow-lg border border-white/20 hover:scale-110 transition-transform z-10"
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Header */}
            <div className="p-5 flex items-center gap-3 overflow-hidden border-b border-white/10 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-secondary flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/30">
                    <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <motion.div
                    animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                >
                    <p className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        OrbitX Talk
                    </p>
                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest -mt-0.5">
                        {friends.length} {friends.length === 1 ? "friend" : "friends"}
                    </p>
                </motion.div>
            </div>

            {/* Search (only when expanded) */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-3 border-b border-white/5 shrink-0"
                    >
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 text-white/30" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search friends..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Friends List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent py-2">
                {isLoading ? (
                    <div className="flex flex-col gap-2 px-3 py-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-2 py-2">
                                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
                                {!isCollapsed && (
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-white/10 rounded-full animate-pulse w-3/4" />
                                        <div className="h-2.5 bg-white/5 rounded-full animate-pulse w-1/2" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : filteredFriends.length === 0 ? (
                    !isCollapsed && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-white/20" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/40">
                                    {searchQuery ? "No matches found" : "No friends yet"}
                                </p>
                                <p className="text-xs text-white/20 mt-1">
                                    {searchQuery ? "Try a different name" : "Add friends to start chatting"}
                                </p>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="px-2 space-y-0.5">
                        {!isCollapsed && (
                            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pt-2 pb-1">
                                Friends
                            </p>
                        )}
                        {filteredFriends.map((friend) => {
                            const isSelected = friend._id === selectedFriendId;
                            return (
                                <motion.button
                                    key={friend._id}
                                    onClick={() => onSelectFriend(friend)}
                                    whileHover={{ x: 2 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group",
                                        isSelected
                                            ? "bg-primary/15 border border-primary/25"
                                            : "hover:bg-white/6 border border-transparent"
                                    )}
                                    title={isCollapsed ? friend.name : undefined}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0 ring-2 transition-all",
                                            isSelected
                                                ? "ring-primary/50 shadow-lg shadow-primary/20"
                                                : "ring-white/10 group-hover:ring-white/20"
                                        )}>
                                            {friend.avatar ? (
                                                <img
                                                    src={friend.avatar}
                                                    alt={friend.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-xs font-bold">
                                                    {getInitials(friend.name)}
                                                </div>
                                            )}
                                        </div>
                                        {/* Online indicator dot (decorative) */}
                                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1b26] bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                    </div>

                                    {/* Info */}
                                    {!isCollapsed && (
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className={cn(
                                                "text-sm font-semibold truncate transition-colors",
                                                isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                                            )}>
                                                {friend.name}
                                            </p>
                                            {friend.username && (
                                                <p className="text-[11px] text-white/35 truncate mt-0.5">
                                                    @{friend.username}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Active indicator for selected */}
                                    {!isCollapsed && isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
