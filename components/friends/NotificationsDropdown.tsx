"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, UserPlus, Inbox } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface NotificationsDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, onClose }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            fetchRequests();
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/friends/requests");
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
        try {
            const res = await fetch("/api/friends/requests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action })
            });

            if (res.ok) {
                showToast(`Friend request ${action}ed`, "success");
                setRequests(prev => prev.filter(r => r._id !== requestId));
            } else {
                showToast(`Failed to ${action} request`, "error");
            }
        } catch (error) {
            showToast(`Error ${action}ing request`, "error");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-12 right-0 w-80 bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 max-h-[400px]"
                >
                    <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/20">
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                            <Bell size={16} className="text-primary" />
                            Notifications
                        </h4>
                        <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {requests.length} New
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-8 text-center text-white/40 text-sm">Loading...</div>
                        ) : requests.length > 0 ? (
                            <div className="flex flex-col">
                                {requests.map(req => (
                                    <div key={req._id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px] flex-shrink-0">
                                            <div className="w-full h-full rounded-full bg-[#1a1b26] overflow-hidden flex items-center justify-center font-bold text-xs">
                                                {req.sender.avatar ? (
                                                    <img src={req.sender.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    req.sender.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                                            <div>
                                                <p className="text-sm text-white/90">
                                                    <span className="font-semibold text-white">{req.sender.name}</span> sent you a friend request.
                                                </p>
                                                <p className="text-xs text-white/50 truncate">@{req.sender.username}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleAction(req._id, 'accept')}
                                                    className="flex-1 bg-primary text-white text-xs font-medium py-1.5 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    <Check size={14} /> Accept
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(req._id, 'reject')}
                                                    className="flex-1 bg-white/10 text-white/70 text-xs font-medium py-1.5 rounded-md hover:bg-white/20 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <X size={14} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 flex flex-col items-center justify-center text-center gap-3 text-white/40">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <Inbox size={24} className="opacity-50" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white/70">All caught up!</p>
                                    <p className="text-xs mt-1">No new notifications right now.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
