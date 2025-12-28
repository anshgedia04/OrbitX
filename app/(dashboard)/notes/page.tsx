"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    Search,
    Grid,
    List,
    Plus,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NoteCard } from "@/components/notes/NoteCard";
import { useUIStore } from "@/store/use-ui-store";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/components/ui/Toast";

export default function AllNotesPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { viewMode, setViewMode, triggerFolderRefresh } = useUIStore();

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [filter, setFilter] = useState<"all" | "favorites" | "text" | "markdown" | "code">("all");

    const [isLoading, setIsLoading] = useState(true);
    const [notes, setNotes] = useState<any[]>([]);

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/notes");
            if (!res.ok) throw new Error("Failed to fetch notes");
            const data = await res.json();
            setNotes(data.notes);
        } catch (error) {
            console.error(error);
            showToast("Failed to load notes", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (note.content && note.content.toLowerCase().includes(debouncedSearch.toLowerCase()));
        const matchesFilter = filter === "all" ? true :
            filter === "favorites" ? note.isFavorite :
                note.type === filter;
        return matchesSearch && matchesFilter;
    });

    const handleCreateNote = () => {
        router.push("/notes/new");
    };

    const handleEditNote = (id: string) => {
        router.push(`/notes/${id}/edit`);
    };

    const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        try {
            // Optimistic update: Remove from UI immediately
            const previousNotes = [...notes];
            setNotes(prev => prev.filter(n => n._id !== id));

            const res = await fetch(`/api/notes/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                showToast("Note moved to trash", "success");
                triggerFolderRefresh(); // Update storage meter and folder counts
            } else {
                throw new Error("Failed to delete");
                setNotes(previousNotes); // Revert on failure
            }
        } catch (error) {
            showToast("Failed to delete note", "error");
            fetchNotes(); // Revert/Refresh on error
        }
    };

    const handleToggleFavorite = async (id: string) => {
        try {
            const note = notes.find(n => n._id === id);
            if (!note) return;

            const res = await fetch(`/api/notes/${id}/favorite`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isFavorite: !note.isFavorite }),
            });

            if (res.ok) {
                setNotes(prev => prev.map(n => n._id === id ? { ...n, isFavorite: !n.isFavorite } : n));
                showToast(note.isFavorite ? "Removed from favorites" : "Added to favorites", "success");
            }
        } catch (error) {
            showToast("Failed to update favorite", "error");
        }
    };

    const handleNoteClick = (id: string) => {
        router.push(`/notes/${id}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg">
                        <FileText className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">All Notes</h1>
                        <p className="text-sm text-white/50">{notes.length} notes</p>
                    </div>
                </div>

                <Button onClick={handleCreateNote} showRocket>
                    New Note
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/10">
                        {(["all", "favorites", "text", "markdown", "code"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filter === f ? "bg-primary text-white" : "text-white/50 hover:text-white"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="w-[1px] h-8 bg-white/10 mx-2" />

                    <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes Grid/List */}
            {filteredNotes.length > 0 ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                    {filteredNotes.map((note) => (
                        <NoteCard
                            key={note._id}
                            note={note}
                            viewMode={viewMode}
                            onEdit={handleEditNote}
                            onDelete={handleDeleteNote}
                            onToggleFavorite={handleToggleFavorite}
                            onClick={handleNoteClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <FileText size={40} className="text-white/20" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No notes found</h3>
                    <p className="text-white/50 mb-6 max-w-md">
                        {searchQuery ? "Try adjusting your search or filters." : "Create your first note to get started!"}
                    </p>
                    <Button onClick={handleCreateNote} showRocket>
                        Create Note
                    </Button>
                </div>
            )}
        </div>
    );
}
