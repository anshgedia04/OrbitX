"use client";

import React, { useEffect, useState } from "react";
import { Trash2, RotateCcw, AlertTriangle, Folder, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useUIStore } from "@/store/use-ui-store";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";

export default function TrashPage() {
    const { showToast } = useToast();
    const { triggerFolderRefresh } = useUIStore();
    const [items, setItems] = useState<{ notes: any[], folders: any[] }>({ notes: [], folders: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, id: string | null, type: "note" | "folder" | "all" | null }>({ isOpen: false, id: null, type: null });

    const fetchTrash = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/trash");
            if (response.ok) {
                const data = await response.json();
                setItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch trash", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    const handleRestore = async (id: string, type: "note" | "folder") => {
        setRestoringId(id);
        try {
            const response = await fetch(`/api/trash/restore/${id}`, { method: "POST" });
            if (response.ok) {
                showToast(`${type === "note" ? "Note" : "Folder"} restored`, "success");

                // Optimistic update
                setItems(prev => ({
                    ...prev,
                    notes: type === "note" ? prev.notes.filter(n => n._id !== id) : prev.notes,
                    folders: type === "folder" ? prev.folders.filter(f => f._id !== id) : prev.folders
                }));

                if (type === "folder" || type === "note") {
                    triggerFolderRefresh();
                }
            }
        } catch (error) {
            showToast("Failed to restore item", "error");
            fetchTrash(); // Revert on failure
        } finally {
            setRestoringId(null);
        }
    };

    const handlePermanentDelete = (id: string, type: "note" | "folder") => {
        setDeleteConfirmation({ isOpen: true, id, type });
    };

    const handleEmptyTrash = () => {
        setDeleteConfirmation({ isOpen: true, id: null, type: "all" });
    };

    const confirmDelete = async () => {
        const { id, type } = deleteConfirmation;
        setDeleteConfirmation({ isOpen: false, id: null, type: null });

        if (type === "all") {
            try {
                const response = await fetch("/api/trash/empty", { method: "POST" });
                if (response.ok) {
                    showToast("Trash emptied", "success");
                    setItems({ notes: [], folders: [] });
                }
            } catch (error) {
                showToast("Failed to empty trash", "error");
            }
        } else if (id && (type === "note" || type === "folder")) {
            try {
                const response = await fetch(`/api/trash/permanent/${id}`, { method: "DELETE" });
                if (response.ok) {
                    showToast(`${type === "note" ? "Note" : "Folder"} deleted permanently`, "success");

                    // Optimistic update
                    setItems(prev => ({
                        ...prev,
                        notes: type === "note" ? prev.notes.filter(n => n._id !== id) : prev.notes,
                        folders: type === "folder" ? prev.folders.filter(f => f._id !== id) : prev.folders
                    }));
                }
            } catch (error) {
                showToast("Failed to delete item", "error");
                fetchTrash(); // Revert on failure
            }
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const hasItems = items.notes.length > 0 || items.folders.length > 0;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Trash2 className="text-red-400" size={32} />
                        Trash
                    </h1>
                    <p className="text-white/50">Items are automatically deleted after 30 days</p>
                </div>

                {hasItems && (
                    <Button
                        onClick={handleEmptyTrash}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                        leftIcon={<Trash2 size={16} />}
                    >
                        Empty Trash
                    </Button>
                )}
            </div>

            {!hasItems ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="text-white/20" size={32} />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Trash is empty</h3>
                    <p className="text-white/40">No deleted items found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Folders */}
                    {items.folders.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Folder size={18} className="text-primary" />
                                Folders
                            </h2>
                            <div className="grid gap-3">
                                {items.folders.map((folder) => (
                                    <div key={folder._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Folder className="text-white/40" size={20} />
                                            <div>
                                                <h3 className="font-medium text-white">{folder.name}</h3>
                                                <p className="text-xs text-white/40">Deleted {format(new Date(folder.updatedAt), "MMM d, yyyy")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => handleRestore(folder._id, "folder")} title="Restore" disabled={restoringId === folder._id}>
                                                {restoringId === folder._id ? <Loader2 size={16} className="animate-spin text-primary" /> : <RotateCcw size={16} />}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handlePermanentDelete(folder._id, "folder")} className="text-red-400 hover:text-red-300" title="Delete Forever">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {items.notes.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                Notes
                            </h2>
                            <div className="grid gap-3">
                                {items.notes.map((note) => (
                                    <div key={note._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <FileText className="text-white/40" size={20} />
                                            <div>
                                                <h3 className="font-medium text-white">{note.title}</h3>
                                                <p className="text-xs text-white/40">Deleted {format(new Date(note.updatedAt), "MMM d, yyyy")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => handleRestore(note._id, "note")} title="Restore" disabled={restoringId === note._id}>
                                                {restoringId === note._id ? <Loader2 size={16} className="animate-spin text-primary" /> : <RotateCcw size={16} />}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handlePermanentDelete(note._id, "note")} className="text-red-400 hover:text-red-300" title="Delete Forever">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, id: null, type: null })}
                title="Confirm Deletion"
            >
                <div className="space-y-4">
                    <p>
                        {deleteConfirmation.type === "all"
                            ? "Are you sure you want to delete all items? This action cannot be undone."
                            : "Are you sure you want to permanently delete this item? This action cannot be undone."}
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirmation({ isOpen: false, id: null, type: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                            onClick={confirmDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
