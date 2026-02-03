"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Editor from "@monaco-editor/react";
import {
    Edit,
    Trash2,
    Star,
    Share2,
    Download,
    ArrowLeft,
    Clock,
    Calendar,
    Eye,
    Copy,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { RelatedNotes } from "@/components/notes/RelatedNotes";
import { cn } from "@/lib/utils";

export default function NotePage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [note, setNote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const response = await fetch(`/api/notes/${params.id}`);
                if (!response.ok) throw new Error("Failed to fetch note");
                const data = await response.json();
                setNote(data);
            } catch (err) {
                setError("Note not found");
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchNote();
    }, [params.id]);

    const handleToggleFavorite = async () => {
        try {
            const response = await fetch(`/api/notes/${note._id}/favorite`, {
                method: "POST",
            });
            if (response.ok) {
                setNote({ ...note, isFavorite: !note.isFavorite });
                showToast(note.isFavorite ? "Removed from favorites" : "Added to favorites", "success");
            }
        } catch (error) {
            showToast("Failed to update favorite status", "error");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            const response = await fetch(`/api/notes/${note._id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                showToast("Note moved to trash", "success");
                router.push("/");
            }
        } catch (error) {
            showToast("Failed to delete note", "error");
        }
    };

    const handleCopyContent = () => {
        navigator.clipboard.writeText(note.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        showToast("Content copied to clipboard", "success");
    };

    const handlePrint = () => {
        // Set document title for PDF filename
        const originalTitle = document.title;
        document.title = `${note.title} - OrbitX Notes`;

        // Trigger print
        window.print();

        // Restore original title
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (error || !note) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                <p className="text-white/50 mb-4">{error}</p>
                <Button onClick={() => router.push("/")}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 min-h-full bg-[#0f111a]">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-8 print:hidden">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white/50 hover:text-white">
                    <ArrowLeft size={20} />
                </Button>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleToggleFavorite} className={cn("text-white/50 hover:text-yellow-400", note.isFavorite && "text-yellow-400")}>
                        <Star size={20} fill={note.isFavorite ? "currentColor" : "none"} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handlePrint} className="text-white/50 hover:text-white">
                        <Download size={20} />
                    </Button>
                    <Link href={`/notes/${note._id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                            <Edit size={20} />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-white/50 hover:text-red-400">
                        <Trash2 size={20} />
                    </Button>
                </div>
            </div>

            {/* Metadata */}
            <div className="mb-8 border-b border-white/10 pb-8">
                <div className="flex items-center gap-2 mb-4">
                    {note.tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                            #{tag}
                        </span>
                    ))}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    {note.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-sm text-white/40">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Eye size={14} />
                        <span>{note.viewCount || 0} views</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="markdown-preview max-w-none mb-12">
                {note.type === "code" ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
                        <div className="absolute top-2 right-2 z-10">
                            <button
                                onClick={handleCopyContent}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                            >
                                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <Editor
                            height="600px"
                            defaultLanguage={note.language || "javascript"}
                            theme="vs-dark"
                            value={note.content}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 20 },
                                scrollBeyondLastLine: false,
                                domReadOnly: true,
                            }}
                        />
                    </div>
                ) : note.type === "markdown" ? (
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
                        {note.content}
                    </ReactMarkdown>
                ) : (
                    <div className="whitespace-pre-wrap font-sans text-white/80 leading-relaxed">
                        {note.content}
                    </div>
                )}
            </div>

            {/* Related Notes */}
            <RelatedNotes currentNoteId={note._id} tags={note.tags} />
        </div>
    );
}
