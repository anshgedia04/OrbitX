"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Editor from "@monaco-editor/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { StarBackground } from "@/components/ui/StarBackground";
import { ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SharedNotePage() {
    const params = useParams();
    const token = params.token as string;
    const [note, setNote] = useState<any>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const response = await fetch(`/api/shared/${token}`);
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to load note");
                }
                const data = await response.json();
                setNote(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchNote();
        }
    }, [token]);

    if (isLoading) {
        return (
            <div className="h-screen w-full bg-[#0f111a] flex items-center justify-center text-white">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-full bg-[#0f111a] flex flex-col items-center justify-center text-white p-4">
                <StarBackground />
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl max-w-md w-full text-center backdrop-blur-xl relative z-10">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Unavailable</h1>
                    <p className="text-white/50 mb-8">{error}</p>
                    <Link href="/">
                        <Button className="w-full">Go to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f111a] text-white font-sans flex flex-col">
            <StarBackground density={30} />

            {/* Header */}
            <header className="border-b border-white/10 bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-bold text-white">
                            O
                        </div>
                        <span className="font-bold text-lg tracking-tight">OrbitX Notes</span>
                    </div>
                    <Link href="/signup">
                        <Button size="sm" variant="secondary" rightIcon={<ArrowRight size={16} />}>
                            Create your own
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 relative z-10">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">{note.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-white/40">
                        <span>Last updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{note.type}</span>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-[500px] shadow-2xl">
                    {note.type === "code" ? (
                        <Editor
                            height="70vh"
                            defaultLanguage={note.language || "javascript"}
                            theme="vs-dark"
                            value={note.content}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 20 },
                                scrollBeyondLastLine: false,
                            }}
                        />
                    ) : note.type === "markdown" ? (
                        <div className="p-8 prose prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {note.content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="p-8 whitespace-pre-wrap text-lg leading-relaxed font-mono text-white/80">
                            {note.content}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm relative z-10">
                <p>Powered by OrbitX Notes. Secure, fast, and beautiful.</p>
            </footer>
        </div>
    );
}
