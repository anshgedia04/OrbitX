"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Bot, User, Wand2, ChevronDown, Check, Cpu } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Loader } from "@/components/ui/Loader";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "./markdown-styles.css";
import ShinyText from '@/components/ShinyText';

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const ReasoningBlock = ({ content, isThinking }: { content: string; isThinking: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!content && isThinking) {
        return (
            <div className="flex items-center gap-2 px-1 py-2">
                <ShinyText
                    text="Thinking..."
                    speed={2}
                    delay={0}
                    color="#9d4edd"
                    shineColor="#ffffff"
                    spread={120}
                    direction="left"
                    className="text-sm font-semibold italic"
                />
            </div>
        );
    }

    if (!content) return null;

    return (
        <div className="flex flex-col gap-2 my-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-fit gap-3 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group"
            >
                <div className="flex items-center gap-2">
                    {isThinking ? (
                        <ShinyText
                            text="Thinking..."
                            speed={2}
                            delay={0}
                            color="#9d4edd"
                            shineColor="#ffffff"
                            spread={120}
                            direction="left"
                            className="text-sm font-semibold"
                        />
                    ) : (
                        <span className="text-sm font-semibold text-white/50">Thought Process</span>
                    )}
                </div>
                <span className="text-white/40 group-hover:text-white/60 transition-colors text-xs">
                    {isExpanded ? "▲" : "▼"}
                </span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#0a0a0a] text-gray-400 p-4 rounded-xl border border-white/5 font-mono text-sm leading-relaxed shadow-inner">
                            <div className="text-violet-500/30 mb-2 select-none">&lt;think&gt;</div>
                            <div className="whitespace-pre-wrap">{content}</div>
                            <div className="text-violet-500/30 mt-2 select-none">&lt;/think&gt;</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Grok 3 logo (xAI)
const GrokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.637L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
);

// Gemini logo (from public/gemini.png)
const GeminiIcon = () => (
    <img src="/gemini.png" alt="Gemini" className="w-16 h-[23px] scale-y-150 scale-x-130 rounded-[6px] object-contain " />
);

interface SubModel {
    id: string;
    label: string;
    badge: string;
}

interface AIModel {
    id: string;
    label: string;
    badge: string;
    color: string;
    disabled: boolean;
    icon?: React.ReactNode;
    subModels?: SubModel[];  // if present, hovering shows a flyout submenu
}

const AI_MODELS: AIModel[] = [
    { id: "codestral", label: "CodeStral", badge: "Coding Expert", color: "from-teal-400 to-cyan-500", disabled: false },
    { id: "grok-3", label: "Grok 3", badge: "xAI", color: "from-red-400 to-rose-600", disabled: false, icon: <GrokIcon /> },
    { id: "orbitx-ai", label: "OrbitX AI", badge: "Native Model", color: "from-cyan-400 to-blue-500", disabled: false },
    { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro", badge: "Default", color: "from-violet-500 to-purple-600", disabled: false, icon: <GeminiIcon /> },
    { id: "nvidia-nemotron", label: "Nvidia Nemotron", badge: "Technology", color: "from-green-400 to-emerald-500", disabled: false },
    { id: "arcee-ai", label: "Arcee AI", badge: "#5 in Technology", color: "from-pink-400 to-rose-500", disabled: false },
    { id: "glm-4.5-air", label: "GLM 4.5 Air", badge: "Science & History", color: "from-yellow-400 to-orange-500", disabled: false },
    { id: "step-3.5-flash", label: "Step 3.5 Flash", badge: "Tech & Finance", color: "from-blue-400 to-indigo-500", disabled: false },
    {
        id: "microsoft",
        label: "Microsoft",
        badge: "Models",
        color: "from-slate-400 to-blue-600",
        disabled: false,
        subModels: [
            { id: "phi-4", label: "Phi-4", badge: "Logical Reasoning" },
            { id: "phi-4-reasoning", label: "Phi-4-reasoning", badge: "Deep Thinking" },
        ],
    },
    { id: "claude-sonnet-4.5", label: "Claude Sonnet 4.5", badge: "Coming Soon", color: "from-orange-400 to-amber-500", disabled: true },
];

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
            content: "How can I help you with your notes today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
    const [modelOpen, setModelOpen] = useState(false);
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // resolve display label — may be a sub-model
    const allSubModels = AI_MODELS.flatMap(m => m.subModels ?? []);
    const activeSubModel = allSubModels.find(s => s.id === selectedModel);
    const activeModel = activeSubModel
        ? { ...AI_MODELS.find(m => m.subModels?.some(s => s.id === selectedModel))!, label: `${activeSubModel.label}` }
        : (AI_MODELS.find(m => m.id === selectedModel) ?? AI_MODELS[0]);

    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setModelOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Scroll handler to detect if user is manually scrolling up
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // If user is scrolled up more than 50px from bottom, they are manually scrolling
        const isScrollingUp = scrollHeight - scrollTop - clientHeight > 50;
        setIsUserScrolling(isScrollingUp);
    }, []);

    // Smart auto-scroll that only scrolls if user hasn't scrolled up manually
    useEffect(() => {
        if (scrollRef.current && !isUserScrolling) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isUserScrolling]);

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
                body: JSON.stringify({ messages: newMessages, model: selectedModel }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.details || "Failed to connect to AI Service");
            }

            const aiMessageId = (Date.now() + 1).toString();

            // Handle event-stream (SSE)
            if (response.headers.get("Content-Type")?.includes("text/event-stream")) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                if (!reader) throw new Error("No readable stream");

                let done = false;
                let fullContent = "";
                let fullThinking = "";
                let buffer = "";
                let isMessageCreated = false;

                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    if (value) {
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine) continue;

                            if (trimmedLine === "data: [DONE]") break;
                            if (trimmedLine.startsWith("data: ")) {
                                try {
                                    const parsed = JSON.parse(trimmedLine.slice(6));
                                    if (parsed.error) throw new Error(parsed.error);

                                    // Add new content incrementally
                                    fullContent += parsed.content || "";
                                    if (parsed.thinking) {
                                        fullThinking += parsed.thinking;
                                    }

                                    // Detect transitions from thinking to content
                                    const isNowThinkingDone = !!fullContent;

                                    if (!isMessageCreated) {
                                        isMessageCreated = true;
                                        setMessages(prev => [...prev, {
                                            id: aiMessageId,
                                            role: "assistant",
                                            content: fullContent || fullThinking, // Fallback to thinking if content is empty
                                            timestamp: new Date()
                                        }]);
                                    } else {
                                        // Update react state in real time
                                        setMessages(prev => prev.map(msg =>
                                            msg.id === aiMessageId
                                                ? {
                                                    ...msg,
                                                    content: fullContent || fullThinking,
                                                }
                                                : msg
                                        ));
                                    }
                                } catch (e) {
                                    console.error("SSE parse error", e);
                                }
                            }
                        }
                    }
                }
            } else {
                // Fallback for models still using basic JSON format
                const data = await response.json();
                setMessages(prev => [...prev, {
                    id: aiMessageId,
                    role: "assistant",
                    content: data.message,
                    thinking: data.thinking,
                    timestamp: new Date()
                }]);
            }
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
        <div className="h-[calc(100vh-8rem)] flex flex-col max-w-5xl mx-auto px-2 sm:px-0">
            {/* Chat Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                    {messages.map((msg, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex gap-2 sm:gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            <div className={`
                                w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg
                                ${msg.role === "assistant"
                                    ? "bg-gradient-to-br from-primary to-secondary shadow-primary/20"
                                    : "bg-white/10"
                                }
                            `}>
                                {msg.role === "assistant" ? <Wand2 size={16} className="text-white sm:hidden" /> : <User size={16} className="text-white/70 sm:hidden" />}
                                {msg.role === "assistant" ? <Wand2 size={20} className="text-white hidden sm:block" /> : <User size={20} className="text-white/70 hidden sm:block" />}
                            </div>

                            <div className={`
                                max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base leading-relaxed shadow-lg
                                ${msg.role === "assistant"
                                    ? "bg-white/5 border border-white/10 text-white/90 rounded-tl-none ai-message-content"
                                    : "bg-primary text-white rounded-tr-none shadow-primary/10"
                                }
                            `}>
                                {msg.role === "assistant" ? (
                                    <div className="flex flex-col gap-3">
                                        {(() => {
                                            const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
                                            const parts = [];
                                            let lastIndex = 0;
                                            let match;

                                            while ((match = thinkRegex.exec(msg.content)) !== null) {
                                                // Text before the think block
                                                if (match.index > lastIndex) {
                                                    parts.push({ type: 'text', content: msg.content.slice(lastIndex, match.index) });
                                                }
                                                // The think block itself
                                                parts.push({ type: 'think', content: match[1], done: true });
                                                lastIndex = thinkRegex.lastIndex;
                                            }

                                            // Text after the last think block (or all text if no match)
                                            if (lastIndex < msg.content.length) {
                                                const remaining = msg.content.slice(lastIndex);
                                                // Check if there's an unclosed <think> tag at the end (for streaming)
                                                if (remaining.includes('<think>')) {
                                                    const [beforeThink, afterThink] = remaining.split('<think>');
                                                    if (beforeThink) parts.push({ type: 'text', content: beforeThink });
                                                    parts.push({ type: 'think', content: afterThink, done: false });
                                                } else {
                                                    parts.push({ type: 'text', content: remaining });
                                                }
                                            } else if (msg.content.endsWith('<think>')) {
                                                // Handle the case where the content ends exactly with <think>
                                                parts.push({ type: 'think', content: '', done: false });
                                            }

                                            return parts.map((part, i) => (
                                                part.type === 'think' ? (
                                                    <ReasoningBlock key={i} content={part.content} isThinking={!part.done || (isLoading && index === messages.length - 1)} />
                                                ) : (
                                                    <ReactMarkdown
                                                        key={i}
                                                        remarkPlugins={[remarkGfm, remarkMath]}
                                                        rehypePlugins={[rehypeKatex]}
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
                                                        {part.content + (isLoading && index === messages.length - 1 && i === parts.length - 1 ? " ▍" : "")}
                                                    </ReactMarkdown>
                                                )
                                            ));
                                        })()}
                                    </div>
                                ) : (
                                    msg.content
                                )}
                                <div suppressHydrationWarning className={`text-[10px] mt-2 ${msg.role === "assistant" ? "text-white/30" : "text-white/50"}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {messages.length > 0 && messages[messages.length - 1].role === "user" && isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 sm:gap-4 flex-row"
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-primary to-secondary shadow-primary/20`}>
                                <Wand2 size={16} className="text-white sm:hidden" />
                                <Wand2 size={20} className="text-white hidden sm:block" />
                            </div>

                            {/* Thinking bubble */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex flex-col gap-2">
                                {selectedModel === "phi-4-reasoning" ? (
                                    <>
                                        {/* Deep thinking label */}
                                        <div className="flex items-center gap-2">
                                            <ShinyText
                                                text="✨ Thinking..."
                                                speed={2}
                                                delay={0}
                                                color="#b5b5b5"
                                                shineColor="#ffffff"
                                                spread={120}
                                                direction="left"
                                                className="text-[12px] font-semibold uppercase tracking-widest"
                                            />
                                        </div>
                                        {/* Animated thought dots */}
                                        <div className="flex items-center gap-1.5">
                                            {[0, 0.2, 0.4, 0.6, 0.8].map((delay, i) => (
                                                <motion.span
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-violet-400"
                                                    animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-white/25">This model reasons carefully — may take a moment</p>
                                    </>
                                ) : (
                                    /* Regular typing indicator */
                                    <div className="flex items-center gap-1.5 py-1">
                                        {[0, 0.15, 0.3].map((delay, i) => (
                                            <motion.span
                                                key={i}
                                                className="w-2 h-2 rounded-full bg-white/40"
                                                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                                                transition={{ duration: 0.9, repeat: Infinity, delay }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-0 pt-3 sm:pt-4">
                    <div className="relative flex items-center gap-3">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {/* Combined input container */}
                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-visible focus-within:border-primary/50 focus-within:bg-white/10 transition-all shadow-inner">
                                {/* Text input */}
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-transparent pl-3 sm:pl-5 pr-2 sm:pr-4 py-3 sm:py-4 text-sm sm:text-base text-white focus:outline-none placeholder:text-white/20"
                                    autoFocus
                                />

                                {/* Divider */}
                                <div className="w-px h-5 bg-white/10 flex-shrink-0" />

                                {/* ── Modern Model Picker ── */}
                                <div ref={dropdownRef} className="relative flex-shrink-0 px-3">
                                    {/* Trigger pill */}
                                    <button
                                        type="button"
                                        onClick={() => setModelOpen(o => !o)}
                                        className={`
                                            flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-semibold
                                            transition-all duration-200 select-none
                                            ${modelOpen
                                                ? "bg-white/10 text-white"
                                                : "text-white/50 hover:text-white/80 hover:bg-white/5"
                                            }
                                        `}
                                    >
                                        {/* Gradient dot */}
                                        <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${activeModel.color} flex-shrink-0 shadow-sm`} />
                                        <span>{activeModel.label}</span>
                                        <motion.span
                                            animate={{ rotate: modelOpen ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex items-center"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                                        </motion.span>
                                    </button>

                                    {/* Floating dropdown panel */}
                                    <AnimatePresence>
                                        {modelOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.18, ease: "easeOut" }}
                                                className="absolute bottom-[calc(100%+12px)] right-0 z-50 rounded-2xl overflow-hidden
                                                    bg-[#0f0f1e]/90 backdrop-blur-xl border border-white/10
                                                    shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(139,92,246,0.15)]
                                                    flex"
                                            >
                                                {/* ── Left column: model list ── */}
                                                <div className="flex flex-col min-w-[220px]">
                                                    {/* Panel header */}
                                                    <div className="px-4 pt-3 pb-2 border-b border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <Cpu className="w-3.5 h-3.5 text-violet-400" />
                                                            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">AI Model</span>
                                                        </div>
                                                    </div>
                                                    {/* Model options */}
                                                    <div className="p-2 flex flex-col gap-1 max-h-[204px] overflow-y-auto
                                                        scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10
                                                        hover:scrollbar-thumb-white/20"
                                                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}
                                                    >
                                                        {AI_MODELS.map((m) => {
                                                            const isActive = m.id === selectedModel || (m.subModels?.some(s => s.id === selectedModel) ?? false);
                                                            const hasSubmenu = !!m.subModels?.length;
                                                            return (
                                                                <div
                                                                    key={m.id}
                                                                    className="relative"
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (m.disabled) return;
                                                                            if (hasSubmenu) {
                                                                                setHoveredGroup(hoveredGroup === m.id ? null : m.id);
                                                                            } else {
                                                                                setSelectedModel(m.id);
                                                                                setModelOpen(false);
                                                                                setHoveredGroup(null);
                                                                            }
                                                                        }}
                                                                        disabled={m.disabled}
                                                                        className={`
                                                                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                                                                            transition-all duration-150 group/item
                                                                            ${m.disabled
                                                                                ? "opacity-50 cursor-not-allowed"
                                                                                : isActive
                                                                                    ? "bg-gradient-to-r from-violet-600/20 to-purple-600/10 border border-violet-500/20"
                                                                                    : "hover:bg-white/5 border border-transparent"
                                                                            }
                                                                        `}
                                                                    >
                                                                        <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                                                            {m.icon ?? <Cpu className="w-3.5 h-3.5 text-white" />}
                                                                        </span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className={`text-[13px] font-semibold truncate ${isActive ? "text-white" : "text-white/70 group-hover/item:text-white"}`}>
                                                                                {m.label}
                                                                            </div>
                                                                            <div className={`text-[10px] mt-0.5 font-medium bg-gradient-to-r ${m.color} bg-clip-text text-transparent`}>
                                                                                {m.badge}
                                                                            </div>
                                                                        </div>
                                                                        {m.disabled ? (
                                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">Soon</span>
                                                                        ) : hasSubmenu ? (
                                                                            <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0 -rotate-90" />
                                                                        ) : isActive && (
                                                                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                                className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
                                                                                <Check className="w-2.5 h-2.5 text-violet-400" />
                                                                            </motion.span>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* Footer */}
                                                    <div className="px-4 py-2.5 border-t border-white/5">
                                                        <p className="text-[10px] text-white/20">More models coming soon</p>
                                                    </div>
                                                </div>

                                                {/* ── Right column: submodel panel (shows on hover) ── */}
                                                <AnimatePresence>
                                                    {hoveredGroup && (() => {
                                                        const parent = AI_MODELS.find(m => m.id === hoveredGroup);
                                                        if (!parent?.subModels?.length) return null;
                                                        return (
                                                            <motion.div
                                                                key="subpanel"
                                                                initial={{ opacity: 0, width: 0 }}
                                                                animate={{ opacity: 1, width: 200 }}
                                                                exit={{ opacity: 0, width: 0 }}
                                                                transition={{ duration: 0.18, ease: "easeOut" }}
                                                                className="border-l border-white/8 flex flex-col overflow-hidden"
                                                                onMouseEnter={() => setHoveredGroup(hoveredGroup)}
                                                                onMouseLeave={() => setHoveredGroup(null)}
                                                            >
                                                                {/* Subpanel header */}
                                                                <div className="px-4 pt-3 pb-2 border-b border-white/5 whitespace-nowrap">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-4 h-4 rounded-md bg-gradient-to-br ${parent.color} flex items-center justify-center flex-shrink-0`}>
                                                                            <Cpu className="w-2.5 h-2.5 text-white" />
                                                                        </span>
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{parent.label} · Models</span>
                                                                    </div>
                                                                </div>
                                                                {/* Submodel items */}
                                                                <div className="p-2 flex flex-col gap-1">
                                                                    {parent.subModels.map(sub => {
                                                                        const subActive = selectedModel === sub.id;
                                                                        return (
                                                                            <button
                                                                                key={sub.id}
                                                                                type="button"
                                                                                onClick={() => { setSelectedModel(sub.id); setModelOpen(false); setHoveredGroup(null); }}
                                                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all whitespace-nowrap ${subActive
                                                                                    ? "bg-gradient-to-r from-violet-600/20 to-purple-600/10 border border-violet-500/20"
                                                                                    : "hover:bg-white/5 border border-transparent"
                                                                                    }`}
                                                                            >
                                                                                <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${parent.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                                                                    <Cpu className="w-3.5 h-3.5 text-white" />
                                                                                </span>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-[13px] font-semibold text-white/80">{sub.label}</div>
                                                                                    <div className={`text-[10px] mt-0.5 bg-gradient-to-r ${parent.color} bg-clip-text text-transparent font-medium`}>{sub.badge}</div>
                                                                                </div>
                                                                                {subActive && (
                                                                                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                                        className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
                                                                                        <Check className="w-2.5 h-2.5 text-violet-400" />
                                                                                    </motion.span>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })()}
                                                </AnimatePresence>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {/* ── End Model Picker ── */}
                            </div>
                        </div>
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="h-[48px] w-[48px] sm:h-[58px] sm:w-[58px] rounded-xl !p-0 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20"
                            showRocket={false}
                        >
                            {isLoading ? <Loader size="sm" /> : <Send size={20} className="sm:hidden" />}
                            {!isLoading && <Send size={24} className="hidden sm:block" />}
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
