"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, LayoutGrid, List as ListIcon } from "lucide-react";
import { NoteCard } from "@/components/notes/NoteCard";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { useUIStore } from "@/store/use-ui-store";

export default function FavoritesPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { viewMode, setViewMode } = useUIStore();
    const [notes, setNotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFavorites = async () => {
        setIsLoading(true);
        try {
            // We can reuse the search API with a filter or fetch all notes and filter client-side 
            // if we don't have a dedicated favorites endpoint. 
            // Or we can use the /api/notes endpoint if it supports filtering.
            // Let's assume we can filter by isFavorite=true on the client for now 
            // or fetch from a new endpoint if needed.
            // Actually, the search API is powerful. Let's use it or just fetch all notes?
            // Fetching all notes might be heavy.
            // Let's try fetching from /api/search?q=&type=note and filter client side for now, 
            // as we don't have a specific GET /api/notes?isFavorite=true implemented yet.
            // Wait, we have /api/folders/[id]/notes.
            // Let's just fetch all notes for the user via a new endpoint or existing one.
            // The /api/search endpoint returns top 10.
            // Let's implement a simple fetch from /api/notes if it existed for listing all.
            // But /api/notes is for creating.
            // Let's use /api/search with a special query or just add a query param to /api/notes?
            // Let's assume we can use /api/search for now, but we might need to paginate.
            // Actually, let's just create a quick fetch to /api/search?q=&type=note and filter.
            // Ideally we should have a dedicated endpoint.

            const response = await fetch("/api/search?q=&type=note");
            if (response.ok) {
                const data = await response.json();
                // The search API returns { notes: [...] } or [...] depending on implementation.
                // Based on previous view, it returns { notes: ... } if type specified?
                // Let's check search/route.ts again.
                // It returns `results.notes` array if type='note'.
                // Wait, if type is 'note', it returns `results` object? No.
                // "if (!type) ... return flattened ... else return results"
                // So if type='note', it returns { notes: [], folders: [], tags: [] }.

                const notesList = data.notes || [];
                setNotes(notesList.filter((n: any) => n.isFavorite));
            }
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const handleToggleFavorite = async (id: string) => {
        try {
            // Optimistic update
            setNotes(prev => prev.filter(n => n._id !== id));

            await fetch(`/api/notes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isFavorite: false }),
            });

            showToast("Removed from favorites", "success");
        } catch (error) {
            showToast("Failed to update note", "error");
            fetchFavorites(); // Revert on error
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Star className="text-yellow-400 fill-yellow-400" size={32} />
                        Favorites
                    </h1>
                    <p className="text-white/50">Your most important notes</p>
                </div>

                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                            }`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                            }`}
                    >
                        <ListIcon size={20} />
                    </button>
                </div>
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="text-white/20" size={32} />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No favorites yet</h3>
                    <p className="text-white/40 max-w-md mx-auto">
                        Star important notes to access them quickly here.
                    </p>
                </div>
            ) : (
                <div className={
                    viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "flex flex-col gap-2"
                }>
                    {notes.map((note) => (
                        <NoteCard
                            key={note._id}
                            note={note}
                            viewMode={viewMode}
                            onEdit={(id) => router.push(`/notes/${id}/edit`)}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
