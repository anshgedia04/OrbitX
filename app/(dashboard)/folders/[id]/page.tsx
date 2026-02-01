"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Folder,
    ChevronRight,
    Search,
    Plus,
    Filter,
    Grid,
    List,
    MoreVertical,
    Trash2,
    Edit2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NoteCard } from "@/components/notes/NoteCard";
import { useUIStore } from "@/store/use-ui-store";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

// Mock Data (Replace with API calls)
const mockFolder = {
    _id: "1",
    name: "Project Ideas",
    color: "bg-primary",
    path: "/Personal/Project Ideas",
};

const mockNotes = [
    { _id: "1", title: "App Architecture", content: "Use Next.js 15 with Server Actions...", type: "markdown", tags: ["dev", "planning"], isFavorite: true, updatedAt: "2023-10-25T10:00:00Z" },
    { _id: "2", title: "UI Design System", content: "Color palette: #6B46C1 (Primary)...", type: "text", tags: ["design"], isFavorite: false, updatedAt: "2023-10-24T15:30:00Z" },
    { _id: "3", title: "API Routes", content: "GET /api/notes - Fetch all notes...", type: "code", tags: ["backend", "api"], isFavorite: false, updatedAt: "2023-10-23T09:15:00Z" },
];

export default function FolderPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { viewMode, setViewMode, triggerFolderRefresh } = useUIStore();

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [filter, setFilter] = useState<"all" | "favorites" | "text" | "markdown" | "code">("all");

    const [isLoading, setIsLoading] = useState(true);
    const [notes, setNotes] = useState<any[]>([]);
    const [folder, setFolder] = useState<any>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const notesRes = await fetch(`/api/notes?folder=${params.id}`);
                const notesData = await notesRes.json();

                if (notesRes.ok) {
                    setNotes(notesData.notes);
                }

                // Temporary: Fetch all folders to find this one's name
                const foldersRes = await fetch("/api/folders");
                const foldersData = await foldersRes.json();

                const findFolder = (items: any[], id: string): any => {
                    for (const item of items) {
                        if (item._id === id) return item;
                        if (item.children) {
                            const found = findFolder(item.children, id);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const currentFolder = findFolder(foldersData, params.id as string);
                if (currentFolder) {
                    setFolder(currentFolder);
                } else {
                    // Fallback if not found in tree (maybe root?)
                    setFolder({ name: "Unknown Folder", color: "bg-gray-500" });
                }

            } catch (error) {
                console.error(error);
                showToast("Failed to load folder data", "error");
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (note.content && note.content.toLowerCase().includes(debouncedSearch.toLowerCase()));
        const matchesFilter = filter === "all" ? true :
            filter === "favorites" ? note.isFavorite :
                note.type === filter;
        return matchesSearch && matchesFilter;
    });

    const handleCreateNote = () => {
        router.push(`/notes/new?folder=${params.id}`);
    };

    const handleEditNote = (id: string) => {
        router.push(`/notes/${id}`);
    };

    const handleDeleteNote = async (id: string) => {
        try {
            // Optimistically remove from UI immediately
            setNotes(prevNotes => prevNotes.filter(note => note._id !== id));

            const res = await fetch(`/api/notes/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                showToast("Note moved to trash", "success");
            } else {
                // If deletion failed, restore the note
                showToast("Failed to delete note", "error");
                const notesRes = await fetch(`/api/notes?folder=${params.id}`);
                const notesData = await notesRes.json();
                if (notesRes.ok) {
                    setNotes(notesData.notes);
                }
            }
        } catch (error) {
            console.error("Failed to delete note", error);
            showToast("Failed to delete note", "error");
            // Restore notes on error
            const notesRes = await fetch(`/api/notes?folder=${params.id}`);
            const notesData = await notesRes.json();
            if (notesRes.ok) {
                setNotes(notesData.notes);
            }
        }
    };

    const handleToggleFavorite = async (id: string) => {
        try {
            const note = notes.find(n => n._id === id);
            const res = await fetch(`/api/notes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isFavorite: !note?.isFavorite }),
            });
            if (res.ok) {
                showToast(note?.isFavorite ? "Removed from favorites" : "Added to favorites", "success");
                // Update local state
                setNotes(notes.map(n => n._id === id ? { ...n, isFavorite: !n.isFavorite } : n));
            } else {
                showToast("Failed to update favorite", "error");
            }
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            showToast("Failed to update favorite", "error");
        }
    };

    const handleDeleteFolder = async () => {
        setIsDeleteModalOpen(false);

        try {
            const res = await fetch(`/api/folders/${params.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                showToast("Folder deleted successfully", "success");
                triggerFolderRefresh();
                router.push("/");
            } else {
                showToast("Failed to delete folder", "error");
            }
        } catch (error) {
            console.error("Failed to delete folder", error);
            showToast("Failed to delete folder", "error");
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-white/50">Loading folder...</div>;
    }

    if (!folder) {
        return <div className="p-8 text-center text-red-400">Folder not found</div>;
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-white/50">
                    <Folder size={14} />
                    <span>Folders</span>
                    <ChevronRight size={14} />
                    <span className="text-white">{folder.name}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${folder.color || 'bg-primary'} flex items-center justify-center shadow-lg`}>
                            <Folder className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{folder.name}</h1>
                            <p className="text-sm text-white/50">{notes.length} notes</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                            <Edit2 size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/50 hover:text-red-400"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            <Trash2 size={18} />
                        </Button>
                        <Button onClick={handleCreateNote} showRocket>
                            New Note
                        </Button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        type="text"
                        placeholder="Search in folder..."
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
                            onClick={(id) => router.push(`/notes/${id}`)}
                            onEdit={handleEditNote}
                            onDelete={handleDeleteNote}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Folder size={40} className="text-white/20" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No notes found</h3>
                    <p className="text-white/50 mb-6 max-w-md">
                        {searchQuery ? "Try adjusting your search or filters." : "This folder is empty. Create your first note to get started!"}
                    </p>
                    <Button onClick={handleCreateNote} showRocket>
                        Create Note
                    </Button>
                </div>
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Folder"
            >
                <div className="space-y-4">
                    <p>Are you sure you want to delete this folder? All notes and subfolders inside it will be moved to trash.</p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                            onClick={handleDeleteFolder}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
