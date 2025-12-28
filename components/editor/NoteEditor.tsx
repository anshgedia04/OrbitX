"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TextareaAutosize from "react-textarea-autosize";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import dynamic from "next/dynamic";
import { ArrowLeft, Clock, Eye, EyeOff, Star, History, Share2 } from "lucide-react";

// Lazy load Monaco Editor
const Editor = dynamic(() => import("@monaco-editor/react"), {
    loading: () => <div className="h-full w-full bg-[#1e1e1e] animate-pulse" />,
    ssr: false
});
import { ShareModal } from "@/components/notes/ShareModal";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { EditorToolbar } from "./EditorToolbar";
import { TagSelector } from "./TagSelector";
import { FolderSelector } from "./FolderSelector";
import { VersionHistoryModal } from "@/components/notes/VersionHistoryModal";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/use-ui-store";

interface NoteEditorProps {
    initialData?: {
        _id?: string;
        title: string;
        content: string;
        type: "text" | "markdown" | "code";
        tags: string[];
        folder?: string | null;
        isFavorite: boolean;
        language?: string;
        updatedAt?: string;
        isShared?: boolean;
        shareToken?: string;
        shareExpiresAt?: string;
        sharePermissions?: "read" | "edit";
    };
    mode: "create" | "edit";
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ initialData, mode }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { triggerFolderRefresh } = useUIStore();

    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [type, setType] = useState<"text" | "markdown" | "code">(initialData?.type || "markdown");
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [folder, setFolder] = useState<string | null>(initialData?.folder || searchParams.get("folder") || null);
    const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false);
    const [language, setLanguage] = useState(initialData?.language || "javascript");

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(initialData?.updatedAt ? new Date(initialData.updatedAt) : null);
    const [showPreview, setShowPreview] = useState(true);
    const [wordCount, setWordCount] = useState(0);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    // Auto-save logic
    useEffect(() => {
        if (mode === "create") return; // Don't autosave new notes until created

        const timer = setTimeout(() => {
            handleAutoSave();
        }, 30000); // 30 seconds

        return () => clearTimeout(timer);
    }, [content, title, tags, folder, isFavorite]);

    useEffect(() => {
        const words = content.trim().split(/\s+/).length;
        setWordCount(content ? words : 0);
    }, [content]);

    // Warn on unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isSaving) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isSaving]);

    const handleAutoSave = async () => {
        if (!initialData?._id) return;

        setIsSaving(true);
        try {
            await fetch(`/api/notes/${initialData._id}/autosave`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            setLastSaved(new Date());
        } catch (error) {
            console.error("Autosave failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const url = mode === "create" ? "/api/notes" : `/api/notes/${initialData?._id}`;
            const method = mode === "create" ? "POST" : "PUT";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    type,
                    tags,
                    folder,
                    isFavorite,
                    language: type === "code" ? language : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 403 && errorData.code === "STORAGE_LIMIT_EXCEEDED") {
                    useUIStore.getState().setStorageLimitModalOpen(true);
                    return;
                }
                throw new Error("Failed to save");
            }

            const data = await response.json();
            setLastSaved(new Date());
            showToast("Note saved successfully", "success");
            triggerFolderRefresh(); // Trigger UI update (folders + storage)

            if (mode === "create") {
                router.push(`/notes/${data._id}`);
            }
        } catch (error) {
            showToast("Failed to save note", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToolbarAction = (action: string) => {
        // Implement text insertion logic here
        console.log("Action:", action);
    };

    const handleRestoreVersion = (restoredContent: string) => {
        setContent(restoredContent);
        showToast("Version content restored. Save to persist.", "success");
    };

    return (
        <div className="flex flex-col h-full bg-[#0f111a]">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0f111a]/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white/50 hover:text-white">
                        <ArrowLeft size={20} />
                    </Button>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Note"
                        className="bg-transparent border-none outline-none text-xl font-bold text-white placeholder-white/30 flex-1"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2">
                        <FolderSelector selectedFolderId={folder} onChange={setFolder} />
                        <TagSelector tags={tags} onChange={setTags} />
                    </div>

                    <div className="h-6 w-[1px] bg-white/10 mx-2" />

                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:border-primary/50"
                    >
                        <option value="text">Text</option>
                        <option value="markdown">Markdown</option>
                        <option value="code">Code</option>
                    </select>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsHistoryOpen(true)}
                        className="text-white/50 hover:text-white"
                        title="Version History"
                    >
                        <History size={20} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsShareOpen(true)}
                        className="text-white/50 hover:text-blue-400"
                        title="Share Note"
                    >
                        <Share2 size={20} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={cn("text-white/50 hover:text-yellow-400", isFavorite && "text-yellow-400")}
                    >
                        <Star size={20} fill={isFavorite ? "currentColor" : "none"} />
                    </Button>

                    <Button onClick={handleSave} disabled={isSaving} showRocket>
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            {type !== "code" && <EditorToolbar onAction={handleToolbarAction} mode={type} />}

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden flex">
                {/* Input Area */}
                <div className={cn("flex-1 h-full overflow-y-auto custom-scrollbar", type === "markdown" && showPreview ? "w-1/2 border-r border-white/10" : "w-full")}>
                    {type === "code" ? (
                        <Editor
                            height="100%"
                            defaultLanguage={language}
                            theme="vs-dark"
                            value={content}
                            onChange={(value) => setContent(value || "")}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 20 },
                                scrollBeyondLastLine: false,
                            }}
                        />
                    ) : (
                        <TextareaAutosize
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Start writing..."
                            className="w-full h-full bg-transparent text-white resize-none outline-none p-8 text-lg leading-relaxed font-mono"
                            minRows={20}
                        />
                    )}
                </div>

                {/* Preview Area (Markdown only) */}
                {type === "markdown" && showPreview && (
                    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 bg-black/20 markdown-preview max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {content || "*Nothing to preview*"}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
            <div className="h-10 border-t border-white/10 bg-[#0f111a] flex items-center justify-between px-4 text-xs text-white/40">
                <div className="flex items-center gap-4">
                    <span>{wordCount} words</span>
                    <span>{Math.ceil(wordCount / 200)} min read</span>
                    {lastSaved && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Saved {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {type === "markdown" && (
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPreview ? "Hide Preview" : "Show Preview"}
                        </button>
                    )}
                    {type === "code" && (
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-white/40 hover:text-white cursor-pointer"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="json">JSON</option>
                        </select>
                    )}
                </div>
            </div>

            <VersionHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                noteId={initialData?._id || ""}
                currentContent={content}
                onRestore={handleRestoreVersion}
            />

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                noteId={initialData?._id || ""}
                initialData={initialData ? {
                    isShared: (initialData as any).isShared,
                    shareToken: (initialData as any).shareToken,
                    shareExpiresAt: (initialData as any).shareExpiresAt,
                    sharePermissions: (initialData as any).sharePermissions
                } : undefined}
            />
        </div>
    );
};
