"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Bot, User, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader } from "@/components/ui/Loader";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "./markdown-styles.css";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export default function AIPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading && user?.subscriptionStatus !== 'pro') {
            router.push("/subscription");
        }
    }, [user, isAuthLoading, router]);

    // Use a combined loading state to prevent flash of content
    if (isAuthLoading || (user && user.subscriptionStatus !== 'pro')) {
        return (
            <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm OrbitX AI. How can I help you with your notes today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date()
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.details || "Failed to connect to AI Service");
            }

            const data = await response.json();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            console.error("Chat Error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Error: ${error.message || "Something went wrong."}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col max-w-5xl mx-auto">
            {/* Chat Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg
                                ${msg.role === "assistant"
                                    ? "bg-gradient-to-br from-primary to-secondary shadow-primary/20"
                                    : "bg-white/10"
                                }
                            `}>
                                {msg.role === "assistant" ? <Wand2 size={20} className="text-white" /> : <User size={20} className="text-white/70" />}
                            </div>

                            <div className={`
                                max-w-[80%] rounded-2xl px-6 py-4 text-base leading-relaxed shadow-lg
                                ${msg.role === "assistant"
                                    ? "bg-white/5 border border-white/10 text-white/90 rounded-tl-none ai-message-content"
                                    : "bg-primary text-white rounded-tr-none shadow-primary/10"
                                }
                            `}>
                                {msg.role === "assistant" ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-200">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-200">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-200">{children}</ol>,
                                            li: ({ children }) => <li className="pl-1">{children}</li>,
                                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                            em: ({ children }) => <em className="text-gray-300 italic">{children}</em>,
                                            code: ({ node, className, children, ...props }) => {
                                                const { ref, ...rest } = props as any;
                                                const match = /language-(\w+)/.exec(className || '');
                                                const isInline = !match && !String(children).includes('\n');

                                                if (isInline) {
                                                    return (
                                                        <code className="bg-white/10 text-primary-foreground px-1.5 py-0.5 rounded text-sm font-mono" {...rest}>
                                                            {children}
                                                        </code>
                                                    );
                                                }

                                                return (
                                                    <div className="rounded-lg overflow-hidden my-4 shadow-lg border border-white/10">
                                                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                                                            <span className="text-xs text-gray-400 font-sans uppercase">{match?.[1] || 'code'}</span>
                                                        </div>
                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus as any}
                                                            language={match?.[1]}
                                                            PreTag="div"
                                                            customStyle={{
                                                                margin: 0,
                                                                borderRadius: 0,
                                                                background: '#09090b', // darker background
                                                                padding: '1.5rem',
                                                                fontSize: '0.875rem',
                                                                lineHeight: '1.7',
                                                            }}
                                                            {...rest}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                );
                                            },
                                            pre: ({ children }) => <>{children}</>, // Let code component handle the block
                                            h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-6 mb-3">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
                                            blockquote: ({ children }) => (
                                                <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-4 italic text-gray-300 bg-white/5 rounded-r">
                                                    {children}
                                                </blockquote>
                                            ),
                                            a: ({ children, href }) => (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:text-primary/80 underline decoration-primary/50 underline-offset-4 transition-colors"
                                                >
                                                    {children}
                                                </a>
                                            ),
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                                <div suppressHydrationWarning className={`text-[10px] mt-2 ${msg.role === "assistant" ? "text-white/30" : "text-white/50"}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                                <Wand2 size={20} className="text-white" />
                            </div>
                            <div className="flex items-center">
                                <Loader size="md" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-0 pt-4">
                    <div className="relative flex items-center gap-3">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask anything..."
                                className="relative w-full bg-white/5 border border-white/10 rounded-xl pl-5 pr-12 py-4 text-base text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20 shadow-inner"
                                autoFocus
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Sparkles className="w-5 h-5 text-primary/50 animate-pulse" />
                            </div>
                        </div>
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="h-[58px] w-[58px] rounded-xl !p-0 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20"
                            showRocket={false}
                        >
                            {isLoading ? <Loader size="sm" /> : <Send size={24} />}
                        </Button>
                    </div>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-white/20">AI responses can be inaccurate.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
