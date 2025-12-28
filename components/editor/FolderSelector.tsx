"use client";

import React, { useState, useEffect } from "react";
import { Folder, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FolderSelectorProps {
    selectedFolderId?: string | null;
    onChange: (folderId: string | null) => void;
}

// Mock folders for now - replace with API call
const mockFolders = [
    { _id: "1", name: "Personal", color: "bg-blue-500" },
    { _id: "2", name: "Work", color: "bg-red-500" },
    { _id: "3", name: "Ideas", color: "bg-green-500" },
];

export const FolderSelector: React.FC<FolderSelectorProps> = ({ selectedFolderId, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedFolder = mockFolders.find(f => f._id === selectedFolderId);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border border-white/10 hover:bg-white/5 transition-colors text-sm text-white/70 min-w-[140px] justify-between"
            >
                <div className="flex items-center gap-2">
                    <Folder size={14} className={selectedFolder ? "text-primary" : "text-white/40"} />
                    <span className="truncate max-w-[100px]">
                        {selectedFolder ? selectedFolder.name : "No Folder"}
                    </span>
                </div>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-1 w-48 bg-[#1a1b26] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                        <button
                            onClick={() => { onChange(null); setIsOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <Folder size={14} className="text-white/40" />
                            <span>No Folder</span>
                            {!selectedFolderId && <Check size={14} className="ml-auto text-primary" />}
                        </button>

                        <div className="h-[1px] bg-white/10 my-1" />

                        {mockFolders.map(folder => (
                            <button
                                key={folder._id}
                                onClick={() => { onChange(folder._id); setIsOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <Folder size={14} className="text-primary" />
                                <span>{folder.name}</span>
                                {selectedFolderId === folder._id && <Check size={14} className="ml-auto text-primary" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
