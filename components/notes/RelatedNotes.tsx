"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Code, FileType } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface RelatedNotesProps {
    currentNoteId: string;
    tags: string[];
}

export const RelatedNotes: React.FC<RelatedNotesProps> = ({ currentNoteId, tags }) => {
    const [notes, setNotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            if (tags.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                // In a real app, we'd have a specific endpoint or use the search API
                // For now, we'll simulate by fetching all and filtering (inefficient but works for demo)
                // Or better, use the search API with a tag query
                const tagQuery = tags.join(" ");
                const response = await fetch(`/api/notes/search?q=${encodeURIComponent(tagQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    // Filter out current note and limit to 3
                    const related = data
                        .filter((n: any) => n._id !== currentNoteId)
                        .slice(0, 3);
                    setNotes(related);
                }
            } catch (error) {
                console.error("Failed to fetch related notes", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRelated();
    }, [currentNoteId, tags]);

    if (isLoading || notes.length === 0) return null;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "code": return <Code size={14} />;
            case "markdown": return <FileType size={14} />;
            default: return <FileText size={14} />;
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-white/10 print:hidden">
            <h3 className="text-lg font-bold text-white mb-4">Related Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {notes.map((note) => (
                    <Link href={`/notes/${note._id}`} key={note._id}>
                        <Card className="h-full hover:bg-white/5 transition-colors p-4">
                            <div className="flex items-center gap-2 mb-2 text-white/50">
                                {getTypeIcon(note.type)}
                                <span className="text-xs capitalize">{note.type}</span>
                            </div>
                            <h4 className="font-medium text-white line-clamp-1 mb-1">{note.title}</h4>
                            <div className="flex gap-1 flex-wrap">
                                {note.tags.map((tag: string) => (
                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};
