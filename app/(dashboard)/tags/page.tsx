"use client";

import React, { useEffect, useState } from "react";
import { Tag, Plus, Trash2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";

export default function TagsPage() {
    const { showToast } = useToast();
    const [tags, setTags] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<any>(null);
    const [tagName, setTagName] = useState("");
    const [tagColor, setTagColor] = useState("bg-primary");

    const colors = [
        "bg-primary", "bg-secondary", "bg-accent",
        "bg-red-500", "bg-blue-500", "bg-green-500",
        "bg-yellow-500", "bg-purple-500", "bg-pink-500"
    ];

    const fetchTags = async () => {
        try {
            const response = await fetch("/api/tags");
            if (response.ok) {
                const data = await response.json();
                setTags(data);
            }
        } catch (error) {
            console.error("Failed to fetch tags", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingTag ? `/api/tags/${editingTag._id}` : "/api/tags";
            const method = editingTag ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: tagName, color: tagColor }),
            });

            if (!response.ok) throw new Error("Failed to save tag");

            showToast(editingTag ? "Tag updated" : "Tag created", "success");
            setIsModalOpen(false);
            setEditingTag(null);
            setTagName("");
            fetchTags();
        } catch (error) {
            showToast("Failed to save tag", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove the tag from all notes.")) return;
        try {
            const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });
            if (response.ok) {
                showToast("Tag deleted", "success");
                fetchTags();
            }
        } catch (error) {
            showToast("Failed to delete tag", "error");
        }
    };

    const openModal = (tag?: any) => {
        if (tag) {
            setEditingTag(tag);
            setTagName(tag.name);
            setTagColor(tag.color);
        } else {
            setEditingTag(null);
            setTagName("");
            setTagColor("bg-primary");
        }
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tags</h1>
                    <p className="text-white/50">Manage your tags and categories</p>
                </div>
                <Button onClick={() => openModal()} leftIcon={<Plus size={18} />}>
                    New Tag
                </Button>
            </div>

            {/* Tag Cloud */}
            <div className="mb-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Tag size={18} className="text-primary" />
                    Tag Cloud
                </h2>
                <div className="flex flex-wrap gap-3">
                    {tags.map((tag) => (
                        <div
                            key={tag._id}
                            className={`px-4 py-2 rounded-full ${tag.color} bg-opacity-20 text-white border border-white/10 flex items-center gap-2`}
                            style={{ fontSize: Math.max(12, Math.min(24, 12 + (tag.usageCount || 0))) }}
                        >
                            <span className="font-medium">{tag.name}</span>
                            <span className="text-xs opacity-70 bg-black/20 px-1.5 rounded-full">{tag.usageCount || 0}</span>
                        </div>
                    ))}
                    {tags.length === 0 && <p className="text-white/30 italic">No tags yet.</p>}
                </div>
            </div>

            {/* Tag List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                    <div
                        key={tag._id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${tag.color} flex items-center justify-center`}>
                                <Tag className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">{tag.name}</h3>
                                <p className="text-xs text-white/40">{tag.usageCount || 0} notes</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(tag)} className="p-2 text-white/50 hover:text-white bg-black/20 rounded-lg">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(tag._id)} className="p-2 text-white/50 hover:text-red-400 bg-black/20 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTag ? "Edit Tag" : "New Tag"}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Tag Name"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        placeholder="e.g., Project Ideas"
                    />

                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Color</label>
                        <div className="grid grid-cols-5 gap-3">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setTagColor(color)}
                                    className={`w-10 h-10 rounded-full ${color} transition-transform hover:scale-110 ${tagColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1b26]" : ""
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingTag ? "Update Tag" : "Create Tag"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
