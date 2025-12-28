"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Folder, Tag, X, ArrowRight, Clock } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                    setSelectedIndex(0);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            } else if (query) {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                onClose();
            }
        } else if (e.key === "Escape") {
            onClose();
        }
    };

    const handleSelect = (item: any) => {
        if (item.resultType === "note") {
            router.push(`/notes/${item._id}`);
        } else if (item.resultType === "folder") {
            router.push(`/folders/${item._id}`);
        } else if (item.resultType === "tag") {
            router.push(`/search?q=${encodeURIComponent(item.name)}&type=tag`);
        }
        onClose();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "note": return <FileText size={16} />;
            case "folder": return <Folder size={16} />;
            case "tag": return <Tag size={16} />;
            default: return <Search size={16} />;
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
                        className="relative w-full max-w-2xl bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        <div className="flex items-center gap-3 p-4 border-b border-white/10">
                            <Search className="text-white/40" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search notes, folders, tags..."
                                className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-white/30"
                            />
                            <button onClick={onClose} className="text-white/40 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {isLoading ? (
                                <div className="p-4 text-center text-white/40 text-sm">Searching...</div>
                            ) : results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((item, index) => (
                                        <button
                                            key={item._id || item.name + index}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                                                index === selectedIndex ? "bg-primary/20 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-md", index === selectedIndex ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40")}>
                                                {getIcon(item.resultType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{item.title || item.name}</div>
                                                {item.resultType === "note" && (
                                                    <div className="text-xs opacity-60 truncate">{item.content?.substring(0, 60)}...</div>
                                                )}
                                            </div>
                                            {index === selectedIndex && <ArrowRight size={16} className="opacity-50" />}
                                        </button>
                                    ))}
                                </div>
                            ) : query ? (
                                <div className="p-8 text-center text-white/40">
                                    <p>No results found for "{query}"</p>
                                </div>
                            ) : (
                                <div className="p-4">
                                    <h4 className="text-xs font-medium text-white/30 uppercase mb-3">Recent Searches</h4>
                                    {/* Mock recent searches */}
                                    <div className="space-y-1">
                                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-white/50 hover:bg-white/5 hover:text-white transition-colors">
                                            <Clock size={14} />
                                            <span>Project Ideas</span>
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-white/50 hover:bg-white/5 hover:text-white transition-colors">
                                            <Clock size={14} />
                                            <span>React Components</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-2 border-t border-white/10 bg-black/20 text-[10px] text-white/30 flex items-center justify-end gap-3">
                            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">↑</kbd> <kbd className="bg-white/10 px-1 rounded">↓</kbd> to navigate</span>
                            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">↵</kbd> to select</span>
                            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">esc</kbd> to close</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
