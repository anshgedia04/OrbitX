"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TagSelectorProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    suggestions?: string[];
}

export const TagSelector: React.FC<TagSelectorProps> = ({ tags, onChange, suggestions = [] }) => {
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedColor, setSelectedColor] = useState("bg-primary");

    const colors = [
        "bg-primary", "bg-secondary", "bg-accent",
        "bg-red-500", "bg-blue-500", "bg-green-500",
        "bg-yellow-500", "bg-purple-500", "bg-pink-500"
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowColorPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddTag = async (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            // Check if tag exists in suggestions (which implies it exists in DB)
            if (!suggestions.includes(trimmedTag)) {
                // It's a new tag, show color picker if not already showing
                if (!showColorPicker) {
                    setShowColorPicker(true);
                    return;
                }

                // Create tag via API
                try {
                    await fetch('/api/tags', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: trimmedTag, color: selectedColor })
                    });
                } catch (e) {
                    console.error("Failed to create tag", e);
                }
                setShowColorPicker(false);
            }

            onChange([...tags, trimmedTag]);
        }
        setInput("");
        setIsOpen(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag(input);
        } else if (e.key === "Backspace" && !input && tags.length > 0) {
            handleRemoveTag(tags[tags.length - 1]);
        }
    };

    const filteredSuggestions = suggestions.filter(
        s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
    );

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/10 focus-within:border-primary/50 transition-colors min-h-[42px]">
                <Tag size={14} className="text-white/40 ml-1" />

                <AnimatePresence>
                    {tags.map(tag => (
                        <motion.span
                            key={tag}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/20 text-primary text-xs font-medium border border-primary/20"
                        >
                            {tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-white transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    ))}
                </AnimatePresence>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setIsOpen(true);
                        setShowColorPicker(false);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/30 min-w-[80px]"
                />
            </div>

            {isOpen && (input || filteredSuggestions.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1b26] border border-white/10 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    {filteredSuggestions.map(suggestion => (
                        <button
                            key={suggestion}
                            onClick={() => handleAddTag(suggestion)}
                            className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}

                    {input && !filteredSuggestions.includes(input) && (
                        <div className="p-2 border-t border-white/10">
                            <button
                                onClick={() => handleAddTag(input)}
                                className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 rounded-md"
                            >
                                <Plus size={14} />
                                Create "{input}"
                            </button>

                            {showColorPicker && (
                                <div className="mt-2 p-2 bg-black/20 rounded-lg grid grid-cols-5 gap-2">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-6 h-6 rounded-full ${color} ${selectedColor === color ? 'ring-2 ring-white' : ''}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
