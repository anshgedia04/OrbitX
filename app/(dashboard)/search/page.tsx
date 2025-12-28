"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, FileText, Folder, Tag, Filter } from "lucide-react";
import { NoteCard } from "@/components/notes/NoteCard";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";
    const typeFilter = searchParams.get("type");

    const [results, setResults] = useState<any>({ notes: [], folders: [], tags: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}${typeFilter ? `&type=${typeFilter}` : ""}`);
                if (response.ok) {
                    const data = await response.json();
                    // If type filter is applied, the API returns an array, otherwise an object
                    if (Array.isArray(data)) {
                        // Reconstruct object structure for consistent rendering if needed, 
                        // but for this page we might want to handle specific types
                        // For simplicity, let's assume the API returns the object structure if no type is specified
                        // Wait, my API implementation returns flattened array if no type is specified in one branch, 
                        // but object in another. Let's fix the API or handle it here.
                        // Actually, the API returns flattened array if NO type is specified in the 'flattened' block?
                        // No, wait. 
                        // API logic:
                        // If !type: returns flattened array.
                        // If type: returns object with keys? No, wait.

                        // Let's look at the API again.
                        // If !type: returns flattened array [].
                        // If type: returns { notes: [], folders: [], tags: [] } ? No.

                        // Ah, the API logic I wrote:
                        // if (!type) { return flattened }
                        // return results; (which is the object)

                        // So if I request ?type=note, I get { notes: [...], folders: [], tags: [] }
                        // If I request no type, I get [...mixed]

                        if (typeFilter) {
                            setResults(data); // This will be the object { notes: ... }
                        } else {
                            // It's a flat array, let's group it back for the UI
                            const grouped = {
                                notes: (data as any[]).filter((i: any) => i.resultType === 'note'),
                                folders: (data as any[]).filter((i: any) => i.resultType === 'folder'),
                                tags: (data as any[]).filter((i: any) => i.resultType === 'tag')
                            };
                            setResults(grouped);
                        }
                    } else {
                        setResults(data);
                    }
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (query) {
            fetchResults();
        } else {
            setIsLoading(false);
        }
    }, [query, typeFilter]);

    const handleFilter = (type: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (type) {
            params.set("type", type);
        } else {
            params.delete("type");
        }
        router.push(`/search?${params.toString()}`);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Search Results
                    </h1>
                    <p className="text-white/50">
                        Found {results.notes.length + results.folders.length + results.tags.length} results for "{query}"
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => handleFilter(null)}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${!typeFilter ? "bg-primary text-white" : "text-white/50 hover:text-white"}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => handleFilter("note")}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${typeFilter === "note" ? "bg-primary text-white" : "text-white/50 hover:text-white"}`}
                    >
                        Notes
                    </button>
                    <button
                        onClick={() => handleFilter("folder")}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${typeFilter === "folder" ? "bg-primary text-white" : "text-white/50 hover:text-white"}`}
                    >
                        Folders
                    </button>
                    <button
                        onClick={() => handleFilter("tag")}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${typeFilter === "tag" ? "bg-primary text-white" : "text-white/50 hover:text-white"}`}
                    >
                        Tags
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Notes */}
                {(results.notes.length > 0 || typeFilter === "note") && (
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FileText className="text-primary" size={20} />
                            Notes
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.notes.map((note: any) => (
                                <NoteCard key={note._id} note={note} viewMode="grid" />
                            ))}
                        </div>
                        {results.notes.length === 0 && <p className="text-white/30 italic">No notes found.</p>}
                    </section>
                )}

                {/* Folders */}
                {(results.folders.length > 0 || typeFilter === "folder") && (
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Folder className="text-secondary" size={20} />
                            Folders
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {results.folders.map((folder: any) => (
                                <div
                                    key={folder._id}
                                    onClick={() => router.push(`/folders/${folder._id}`)}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-3"
                                >
                                    <div className={`w-10 h-10 rounded-lg ${folder.color || "bg-primary"} flex items-center justify-center`}>
                                        <Folder className="text-white" size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-white truncate">{folder.name}</h3>
                                        <p className="text-xs text-white/40 truncate">{folder.path}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {results.folders.length === 0 && <p className="text-white/30 italic">No folders found.</p>}
                    </section>
                )}

                {/* Tags */}
                {(results.tags.length > 0 || typeFilter === "tag") && (
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Tag className="text-accent" size={20} />
                            Tags
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {results.tags.map((tag: any) => (
                                <button
                                    key={tag._id}
                                    onClick={() => router.push(`/search?q=${encodeURIComponent(tag.name)}&type=tag`)}
                                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Tag size={14} />
                                    <span>{tag.name}</span>
                                    <span className="bg-white/10 px-1.5 rounded-full text-[10px]">{tag.count}</span>
                                </button>
                            ))}
                        </div>
                        {results.tags.length === 0 && <p className="text-white/30 italic">No tags found.</p>}
                    </section>
                )}
            </div>
        </div>
    );
}
