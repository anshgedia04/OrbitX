"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Keyboard } from "lucide-react";

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    const shortcuts = [
        { key: "Ctrl + N", description: "Create new note" },
        { key: "Ctrl + K", description: "Search notes" },
        { key: "Ctrl + S", description: "Save note (in editor)" },
        { key: "Ctrl + /", description: "Show shortcuts" },
        { key: "Esc", description: "Close modals" },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/50 mb-4">
                    <Keyboard size={18} />
                    <span className="text-sm">Master your workflow with these shortcuts</span>
                </div>

                <div className="grid gap-3">
                    {shortcuts.map((shortcut) => (
                        <div
                            key={shortcut.key}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                            <span className="text-white/80 text-sm">{shortcut.description}</span>
                            <kbd className="px-2 py-1 rounded bg-white/10 border border-white/10 text-xs font-mono text-primary font-bold">
                                {shortcut.key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};
