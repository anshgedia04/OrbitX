"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Friend {
    _id: string;
    name: string;
    username?: string;
    avatar?: string;
}

interface TalkPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFriend: (friend: Friend) => void;
    selectedFriendId?: string;
}

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export const TalkPanel: React.FC<TalkPanelProps> = ({
    isOpen,
    onClose,
    onSelectFriend,
    selectedFriendId,
}) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [hasFetched, setHasFetched] = useState(false);

    // Fetch friends only once when panel first opens
    useEffect(() => {
        if (isOpen && !hasFetched) {
            setIsLoading(true);
            setHasFetched(true);
            fetch("/api/friends/list")
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => setFriends(data))
                .catch(() => setFriends([]))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, hasFetched]);

    useEffect(() => {
        if (!isOpen) setSearch("");
    }, [isOpen]);

    const filtered = friends.filter(
        (f) =>
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            (f.username && f.username.toLowerCase().includes(search.toLowerCase()))
    );

    // Rendered as an in-flow panel — parent wrapper handles open/close animation
    return (
        <div
            className="h-full flex flex-col border-l border-white/8 shrink-0"
            style={{
                background:
                    "linear-gradient(160deg, rgba(15,15,30,0.97) 0%, rgba(18,14,32,0.97) 100%)",
                boxShadow: "-4px 0 32px rgba(0,0,0,0.35), -1px 0 0 rgba(139,92,246,0.07)",
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-secondary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                        <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-white tracking-tight">OrbitX Talk</p>
                        <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">
                            {friends.length} {friends.length === 1 ? "friend" : "friends"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all cursor-pointer"
                >
                    <X size={15} />
                </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-white/5 shrink-0">
                <div className="relative flex items-center">
                    <Search className="absolute left-3 text-white/25 shrink-0" size={13} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search friends..."
                        className="w-full bg-white/5 border border-white/8 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary/40 focus:bg-white/8 transition-all"
                    />
                </div>
            </div>

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/8 scrollbar-track-transparent py-2 px-2">
                {isLoading ? (
                    <div className="flex flex-col gap-1 p-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                                <div className="w-10 h-10 rounded-full bg-white/8 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-white/8 rounded-full animate-pulse w-3/4" />
                                    <div className="h-2.5 bg-white/5 rounded-full animate-pulse w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                            <Users className="w-7 h-7 text-white/15" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/35">
                                {search ? "No matches" : "No friends yet"}
                            </p>
                            <p className="text-xs text-white/18 mt-1">
                                {search ? "Try a different name" : "Add friends to start chatting"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 pt-2 pb-1.5">
                            Friends
                        </p>
                        {filtered.map((friend) => {
                            const isSelected = friend._id === selectedFriendId;
                            return (
                                <motion.button
                                    key={friend._id}
                                    onClick={() => onSelectFriend(friend)}
                                    whileHover={{ x: -2 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border text-left",
                                        isSelected
                                            ? "bg-primary/12 border-primary/20 shadow-sm"
                                            : "hover:bg-white/5 border-transparent"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full overflow-hidden ring-2 transition-all duration-200",
                                            isSelected ? "ring-primary/40" : "ring-white/8"
                                        )}>
                                            {friend.avatar ? (
                                                <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/70 to-secondary/70 flex items-center justify-center text-white text-xs font-bold">
                                                    {getInitials(friend.name)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f0f1e] bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-semibold truncate transition-colors",
                                            isSelected ? "text-white" : "text-white/75"
                                        )}>
                                            {friend.name}
                                        </p>
                                        {friend.username && (
                                            <p className="text-[11px] text-white/28 truncate mt-0.5">
                                                @{friend.username}
                                            </p>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/5 shrink-0">
                <p className="text-[10px] text-white/15 text-center">
                    End-to-end encrypted · OrbitX Talk
                </p>
            </div>
        </div>
    );
};
