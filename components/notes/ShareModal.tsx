"use client";

import React, { useState, useEffect } from "react";
import { Copy, Globe, Lock, RefreshCw, Check, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId: string;
    initialData?: {
        isShared: boolean;
        shareToken?: string;
        shareExpiresAt?: string;
        sharePermissions: "read" | "edit";
    };
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, noteId, initialData }) => {
    const { showToast } = useToast();
    const [isShared, setIsShared] = useState(initialData?.isShared || false);
    const [shareToken, setShareToken] = useState(initialData?.shareToken || "");
    const [expiresAt, setExpiresAt] = useState(initialData?.shareExpiresAt || "");
    const [permissions, setPermissions] = useState<"read" | "edit">(initialData?.sharePermissions || "read");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (initialData) {
            setIsShared(initialData.isShared);
            setShareToken(initialData.shareToken || "");
            setExpiresAt(initialData.shareExpiresAt || "");
            setPermissions(initialData.sharePermissions);
        }
    }, [initialData]);

    const handleToggleShare = async () => {
        setIsLoading(true);
        try {
            const newIsShared = !isShared;
            if (!newIsShared) {
                // Revoke
                await fetch(`/api/notes/${noteId}/share`, { method: "DELETE" });
                setIsShared(false);
                setShareToken("");
                showToast("Sharing disabled", "success");
            } else {
                // Enable
                const response = await fetch(`/api/notes/${noteId}/share`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isShared: true, sharePermissions: permissions }),
                });
                const data = await response.json();
                setIsShared(true);
                setShareToken(data.shareToken);
                showToast("Sharing enabled", "success");
            }
        } catch (error) {
            showToast("Failed to update sharing settings", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSettings = async (newPermissions?: "read" | "edit", newExpiresAt?: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/notes/${noteId}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isShared: true,
                    sharePermissions: newPermissions || permissions,
                    shareExpiresAt: newExpiresAt !== undefined ? newExpiresAt : expiresAt
                }),
            });
            const data = await response.json();
            setPermissions(data.sharePermissions);
            setExpiresAt(data.shareExpiresAt || "");
            showToast("Settings updated", "success");
        } catch (error) {
            showToast("Failed to update settings", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        const url = `${window.location.origin}/shared/${shareToken}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast("Link copied to clipboard", "success");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Note">
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isShared ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                            {isShared ? <Globe size={20} /> : <Lock size={20} />}
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Public Sharing</h3>
                            <p className="text-xs text-white/50">
                                {isShared ? "Anyone with the link can view this note" : "Only you can access this note"}
                            </p>
                        </div>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                        <input
                            type="checkbox"
                            className="absolute w-6 h-6 opacity-0 cursor-pointer"
                            checked={isShared}
                            onChange={handleToggleShare}
                            disabled={isLoading}
                        />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${isShared ? "bg-primary" : "bg-white/20"}`} />
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isShared ? "translate-x-6" : "translate-x-0"}`} />
                    </div>
                </div>

                {isShared && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Share Link</label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${shareToken}`}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
                                />
                                <Button onClick={copyToClipboard} variant="secondary">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Permissions</label>
                                <select
                                    value={permissions}
                                    onChange={(e) => handleUpdateSettings(e.target.value as "read" | "edit")}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
                                >
                                    <option value="read">Can view</option>
                                    <option value="edit">Can edit (Coming soon)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Expires At (Optional)</label>
                                <input
                                    type="date"
                                    value={expiresAt ? format(new Date(expiresAt), "yyyy-MM-dd") : ""}
                                    onChange={(e) => handleUpdateSettings(undefined, e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
