"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, X, UserCheck, Send, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface FriendRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FriendRequestModal: React.FC<FriendRequestModalProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setResults([]);
            setSentRequests(new Set());
            setPendingRequests(new Set());
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            // Only search if starts with @ or #
            if (!debouncedQuery.startsWith("@") && !debouncedQuery.startsWith("#")) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api/friends/search?q=${encodeURIComponent(debouncedQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Friend search failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    const handleSendRequest = async (userId: string) => {
        setPendingRequests(prev => new Set(prev).add(userId));
        try {
            const res = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId: userId })
            });
            const data = await res.json();

            if (res.ok) {
                showToast("Friend request sent!", "success");
                setSentRequests(prev => new Set(prev).add(userId));
            } else {
                showToast(data.error || "Failed to send request", "error");
                if (data.error?.includes("already")) {
                    setSentRequests(prev => new Set(prev).add(userId));
                }
            }
        } catch (error) {
            showToast("Failed to send friend request", "error");
        } finally {
            setPendingRequests(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-xl bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        <div className="flex flex-col p-4 border-b border-white/10 gap-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-primary" />
                                    Find Friends
                                </h3>
                                <button onClick={onClose} className="text-white/40 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="relative flex items-center">
                                <Search className="absolute left-3 text-white/40" size={18} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by @username or #email..."
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 outline-none text-sm text-white placeholder-white/30 focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {isLoading ? (
                                <div className="p-8 text-center text-white/40 text-sm">Searching the cosmos...</div>
                            ) : results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((user) => (
                                        <div
                                            key={user._id}
                                            className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px] flex-shrink-0">
                                                    <div className="w-full h-full rounded-full bg-[#1a1b26] overflow-hidden flex items-center justify-center font-bold text-xs">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-white text-sm truncate">{user.name}</div>
                                                    <div className="text-xs text-white/50 truncate">
                                                        @{user.username} {user.email && `• ${user.email}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (user.relationStatus === 'none' && !sentRequests.has(user._id) && !pendingRequests.has(user._id)) {
                                                        handleSendRequest(user._id);
                                                    }
                                                }}
                                                disabled={user.relationStatus !== 'none' || sentRequests.has(user._id) || pendingRequests.has(user._id)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-[90px] justify-center",
                                                    pendingRequests.has(user._id)
                                                        ? "bg-primary/70 text-white cursor-wait"
                                                        : (user.relationStatus !== 'none' || sentRequests.has(user._id))
                                                            ? "bg-white/10 text-white/40 cursor-not-allowed"
                                                            : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 cursor-pointer"
                                                )}
                                            >
                                                {pendingRequests.has(user._id) ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Sending...</>
                                                ) : user.relationStatus === 'self' ? (
                                                    <><UserCheck size={14} /> You</>
                                                ) : user.relationStatus === 'friends' ? (
                                                    <><UserCheck size={14} /> Friends</>
                                                ) : user.relationStatus === 'pending_sent' || sentRequests.has(user._id) ? (
                                                    <><UserCheck size={14} /> Sent</>
                                                ) : user.relationStatus === 'pending_received' ? (
                                                    <><UserCheck size={14} /> Requested</>
                                                ) : (
                                                    <><Send size={14} /> Request</>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : query.length > 1 && (query.startsWith("@") || query.startsWith("#")) ? (
                                <div className="p-8 text-center text-white/40">
                                    <p>No user found matching "{query}"</p>
                                </div>
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center justify-center text-white/30 space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <div className="text-sm">
                                        <p>Type <kbd className="bg-white/10 px-1 rounded text-xs mx-1">@</kbd> to search by username</p>
                                        <p className="mt-1">Type <kbd className="bg-white/10 px-1 rounded text-xs mx-1">#</kbd> to search by email</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
