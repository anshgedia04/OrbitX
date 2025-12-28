"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Code, FileType, Star, Clock, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface NoteCardProps {
    note: {
        _id: string;
        title: string;
        content: string;
        type: string;
        tags: string[];
        isFavorite: boolean;
        updatedAt: string;
    };
    viewMode: "grid" | "list";
    onEdit?: (id: string) => void;
    onDelete?: (id: string, e?: React.MouseEvent) => void;
    onToggleFavorite?: (id: string) => void;
    onClick?: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
    note,
    viewMode,
    onEdit,
    onDelete,
    onToggleFavorite,
    onClick
}) => {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case "code": return <Code size={16} />;
            case "markdown": return <FileType size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    };

    if (viewMode === "list") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
            >
                <div
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => onClick?.(note._id)}
                >
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                        {getTypeIcon(note.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{note.title}</h4>
                        <p className="text-xs text-white/50 truncate">{note.content.substring(0, 50)}...</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-white/40">
                        <span className="hidden md:inline">{formatDate(note.updatedAt)}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(note._id); }} className={cn("hover:text-yellow-400", note.isFavorite && "text-yellow-400 opacity-100")}>
                                <Star size={16} fill={note.isFavorite ? "currentColor" : "none"} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onEdit?.(note._id); }} className="hover:text-white">
                                <Edit size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete?.(note._id, e as any); }} className="hover:text-red-400">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            className="h-full"
        >
            <Card
                className="h-full flex flex-col group relative overflow-hidden border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => onClick?.(note._id)}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-white/5 text-white/70 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        {getTypeIcon(note.type)}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(note._id); }}
                        className={cn("text-white/20 hover:text-yellow-400 transition-colors", note.isFavorite && "text-yellow-400")}
                    >
                        <Star size={18} fill={note.isFavorite ? "currentColor" : "none"} />
                    </button>
                </div>

                <h3 className="font-bold text-lg text-white mb-2 line-clamp-1">{note.title}</h3>
                <p className="text-sm text-white/50 line-clamp-3 mb-4 flex-1">
                    {note.content || "No content"}
                </p>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {note.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/60 border border-white/5">
                            #{tag}
                        </span>
                    ))}
                    {note.tags.length > 3 && (
                        <span className="text-xs text-white/40">+{note.tags.length - 3}</span>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatDate(note.updatedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                        <button onClick={(e) => { e.stopPropagation(); onEdit?.(note._id); }} className="hover:text-white p-1">
                            <Edit size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete?.(note._id, e as any); }} className="hover:text-red-400 p-1">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
