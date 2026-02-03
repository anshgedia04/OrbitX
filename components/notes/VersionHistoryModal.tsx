"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import * as Diff from "diff";
import { Clock, RotateCcw, X, ArrowLeft, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";

interface Version {
    _id: string;
    content: string;
    updatedAt: string;
    changeDescription?: string;
}

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId: string;
    currentContent: string;
    onRestore: (content: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
    isOpen,
    onClose,
    noteId,
    currentContent,
    onRestore,
}) => {
    const { showToast } = useToast();
    const [versions, setVersions] = useState<Version[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchVersions();
        }
    }, [isOpen, noteId]);

    const fetchVersions = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/notes/${noteId}/versions`);
            if (response.ok) {
                const data = await response.json();
                setVersions(data);
                if (data.length > 0) {
                    setSelectedVersion(data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch versions", error);
            showToast("Failed to load history", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = () => {
        if (selectedVersion) {
            if (confirm("Are you sure you want to restore this version? Current changes will be overwritten.")) {
                onRestore(selectedVersion.content);
                onClose();
            }
        }
    };

    const renderDiff = () => {
        if (!selectedVersion) return null;

        // Compare selected version with current content (or previous version?)
        // Usually version history compares the selected version with the one before it, 
        // or shows the content of the selected version.
        // Let's show the content of the selected version, but maybe highlight diffs 
        // against the *current* state to show what would change if restored?
        // Or just show the content. The user asked for "Diff viewer showing changes".
        // Let's compare selected version vs current content to show what restoring will do.

        const diff = Diff.diffChars(currentContent, selectedVersion.content);

        return (
            <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {diff.map((part, index) => {
                    const color = part.added ? "bg-green-500/20 text-green-300" : part.removed ? "bg-red-500/20 text-red-300 line-through opacity-50" : "text-white/70";
                    return (
                        <span key={index} className={color}>
                            {part.value}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Version History"
            className="max-w-4xl h-[80vh]"
        >
            <div className="flex h-full gap-6 -m-6 p-6">
                {/* Sidebar List */}
                <div className="w-1/3 border-r border-white/10 pr-4 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader size="sm" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center text-white/40 py-8">
                            No history available.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((version) => (
                                <button
                                    key={version._id || version.updatedAt}
                                    onClick={() => setSelectedVersion(version)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors border ${selectedVersion === version
                                        ? "bg-primary/20 border-primary/50"
                                        : "bg-white/5 border-transparent hover:bg-white/10"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock size={14} className={selectedVersion === version ? "text-primary" : "text-white/40"} />
                                        <span className="text-sm font-medium text-white">
                                            {format(new Date(version.updatedAt), "MMM d, h:mm a")}
                                        </span>
                                    </div>
                                    {version.changeDescription && (
                                        <p className="text-xs text-white/50 truncate">
                                            {version.changeDescription}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Preview / Diff */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {selectedVersion ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-white/50">
                                    <span className="text-red-400">Red</span> = Removed from current, <span className="text-green-400">Green</span> = Added from version
                                </div>
                                <Button size="sm" onClick={handleRestore} leftIcon={<RotateCcw size={16} />}>
                                    Restore this version
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-lg p-4 border border-white/10">
                                {renderDiff()}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-white/30">
                            Select a version to preview
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
