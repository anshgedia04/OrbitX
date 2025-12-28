"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";

interface QuickNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const { showToast } = useToast();
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            // Create a new note in a "Quick Notes" folder (or default)
            // For now, we'll just create it without a folder, or we could try to find/create "Quick Notes"
            // Let's just create it with a default title "Quick Note - [Date]"

            const title = `Quick Note - ${new Date().toLocaleString()}`;

            const response = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    type: "text",
                    tags: ["quick-note"],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 403 && errorData.code === "STORAGE_LIMIT_EXCEEDED") {
                    onClose(); // Close quick note modal
                    useUIStore.getState().setStorageLimitModalOpen(true); // Open limit modal
                    return;
                }
                throw new Error("Failed to save");
            }

            const data = await response.json();
            showToast("Quick note saved!", "success");
            setContent("");
            onClose();
            router.push(`/notes/${data._id}/edit`);
        } catch (error) {
            showToast("Failed to save quick note", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quick Note">
            <div className="space-y-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-40 bg-black/20 border border-white/10 rounded-lg p-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 resize-none"
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Save Note"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
