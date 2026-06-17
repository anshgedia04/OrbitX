"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Users, Send, Smile, Phone, Video, MoreHorizontal, Lock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/use-chat-store";
import { cn } from "@/lib/utils";
import { useE2EE } from "@/hooks/useE2EE";
import { encryptMessage, decryptMessage } from "@/lib/crypto";
import { EmojiPickerPopup } from "@/components/chat/EmojiPickerPopup";

interface ChatMessage {
    id: string;
    senderId: string; // "me" or friend's id
    text: string;
    timestamp: Date;
}

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ChatContent() {
    const { user } = useAuth();
    const router = useRouter();
    const { activeFriend } = useChatStore();
    const { isReady, getSharedSecret } = useE2EE(user?._id);

    const friendId = activeFriend?._id;
    const friendName = activeFriend?.name;
    const friendUsername = activeFriend?.username;
    const friendAvatar = activeFriend?.avatar;

    const hasFriend = !!friendId && !!friendName;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const [isPusherConnected, setIsPusherConnected] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const processedMessageIds = useRef<Set<string>>(new Set());

    // Fetch and decrypt messages from server
    const fetchMessages = useCallback(async () => {
        if (!friendId || !isReady || !user) return;
        try {
            const sharedSecret = await getSharedSecret(friendId);
            if (!sharedSecret) return; // Wait until friend sets up E2EE or secret is ready

            const res = await fetch(`/api/chat/messages?friendId=${friendId}`);
            if (!res.ok) return;
            const data = await res.json();
            
            const serverMsgs = data.messages || [];
            const newDecryptedMsgs: ChatMessage[] = [];

            for (const msg of serverMsgs) {
                if (processedMessageIds.current.has(msg.id)) continue;

                try {
                    const text = await decryptMessage(msg.encrypted_content, msg.iv, sharedSecret);
                    newDecryptedMsgs.push({
                        id: msg.id,
                        senderId: msg.sender_id === (user as any)?._id ? "me" : msg.sender_id,
                        text,
                        timestamp: new Date(msg.created_at)
                    });
                    processedMessageIds.current.add(msg.id);
                } catch (e) {
                    console.error("Failed to decrypt message:", msg.id, e);
                    // Add as a failed decryption message
                    newDecryptedMsgs.push({
                        id: msg.id,
                        senderId: msg.sender_id === (user as any)?._id ? "me" : msg.sender_id,
                        text: "[Message could not be decrypted]",
                        timestamp: new Date(msg.created_at)
                    });
                    processedMessageIds.current.add(msg.id);
                }
            }

            if (newDecryptedMsgs.length > 0) {
                setMessages(prev => {
                    const combined = [...prev, ...newDecryptedMsgs];
                    // Ensure unique by ID
                    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                    // Sort by timestamp just in case
                    return unique.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                });
            }
        } catch (err) {
            console.error("Error polling messages:", err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [friendId, isReady, user]);

    // ─── Initial + re-fetch effect ───────────────────────────────────────────
    // Fires when the friend changes OR when E2EE finishes initializing.
    // This is separate from the Pusher effect so we don't re-subscribe on every
    // isReady change, while still fetching messages as soon as keys are available.
    useEffect(() => {
        if (!hasFriend || !friendId || !isReady || !user) return;
        setIsLoadingMsgs(true);
        fetchMessages().finally(() => setIsLoadingMsgs(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasFriend, friendId, isReady]);

    // ─── Real-time Pusher subscription ───────────────────────────────────────
    useEffect(() => {
        if (!hasFriend || !user?._id || !friendId || !isReady) return;

        let pusher: import('pusher-js').default | null = null;
        let channel: any = null;
        let isCancelled = false;

        async function initPusher() {
            try {
                const res = await fetch('/api/pusher/config');
                const { key, cluster } = await res.json();
                
                if (isCancelled || !key || !cluster) return;

                const PusherClient = (await import('pusher-js')).default;
                if (isCancelled) return;

                pusher = new PusherClient(key, { cluster });
                const channelName = [(user as any)._id as string, friendId as string].sort().join('-');
                console.log("[Pusher] Connecting to channel:", channelName);
                
                channel = pusher.subscribe(channelName);

                channel.bind('pusher:subscription_succeeded', () => {
                    console.log("[Pusher] Subscription active for:", channelName);
                    setIsPusherConnected(true);
                });

                channel.bind('new-message', async (msg: any) => {
                    if (processedMessageIds.current.has(msg.id)) return;
                    
                    try {
                        const sharedSecret = await getSharedSecret(friendId as string);
                        if (!sharedSecret) {
                            console.warn("[Pusher] E2EE not ready, dropping message");
                            return;
                        }

                        const text = await decryptMessage(msg.encrypted_content, msg.iv, sharedSecret);
                        
                        const newMsg: ChatMessage = {
                            id: msg.id,
                            senderId: msg.sender_id === (user as any)._id ? "me" : msg.sender_id,
                            text,
                            timestamp: new Date(msg.created_at)
                        };

                        processedMessageIds.current.add(msg.id);
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                        });
                    } catch (err) {
                        console.error("Failed to decrypt live message:", err);
                    }
                });
            } catch (err) {
                console.error("Failed to init Pusher:", err);
            }
        }

        initPusher();

        return () => {
            isCancelled = true;
            if (channel) {
                channel.unbind_all();
                channel.unsubscribe();
            }
            if (pusher) {
                pusher.disconnect();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasFriend, (user as any)?._id, friendId, isReady]);

    // Clear messages when friend changes
    useEffect(() => {
        setMessages([]);
        processedMessageIds.current.clear();
        setIsPusherConnected(false);
    }, [friendId]);

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleEmojiClick = (emoji: string) => {
        const inputEl = inputRef.current;
        if (!inputEl) {
            setInput(prev => prev + emoji);
            return;
        }
        const start = inputEl.selectionStart ?? input.length;
        const end = inputEl.selectionEnd ?? input.length;
        const newValue = input.slice(0, start) + emoji + input.slice(end);
        setInput(newValue);
        // Restore cursor position after emoji insertion
        requestAnimationFrame(() => {
            inputEl.focus();
            const pos = start + emoji.length;
            inputEl.setSelectionRange(pos, pos);
        });
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || !friendId || !isReady || !user) return;
        
        setInput(""); // Optimistic clear
        setIsEmojiOpen(false);

        try {
            const sharedSecret = await getSharedSecret(friendId);
            if (!sharedSecret) {
                alert("Cannot send message. Friend has not set up End-to-End Encryption yet.");
                return;
            }

            // Encrypt
            const { encryptedContent, iv } = await encryptMessage(text, sharedSecret);

            // POST to server
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiverId: friendId,
                    encryptedContent,
                    iv
                })
            });

            if (!res.ok) throw new Error("Failed to send");

            const data = await res.json();
            
            // Optimistic add
            const optimisticMsg: ChatMessage = {
                id: data.message?.id || Date.now().toString(),
                senderId: "me",
                text,
                timestamp: new Date()
            };
            
            processedMessageIds.current.add(optimisticMsg.id);
            setMessages(prev => {
                if (prev.some(m => m.id === optimisticMsg.id)) return prev;
                return [...prev, optimisticMsg];
            });
            
        } catch (err) {
            console.error("Failed to send message:", err);
            setInput(text); // Restore text on failure
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!hasFriend) {
        // Empty state — no friend selected yet
        return (
            <div className="h-full flex flex-col items-center justify-center text-center gap-6 px-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/25 via-violet-500/20 to-secondary/25 border border-white/10 flex items-center justify-center shadow-2xl shadow-primary/10">
                            <MessageCircle className="w-12 h-12 text-primary/60" />
                        </div>
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl -z-10 scale-150" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white/85">OrbitX Talk</h1>
                        <p className="text-white/35 text-sm mt-2 max-w-xs leading-relaxed">
                            Select a friend from the panel on the right to start chatting
                        </p>
                    </div>
                    <motion.p
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="text-xs text-white/20 flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 inline-block" />
                        Click "Let's Talk" in the sidebar to open the friends panel
                    </motion.p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">

            {/* ── Chat Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between px-6 py-3.5 border-b border-white/8 bg-white/3 backdrop-blur-sm shrink-0"
            >
                <div className="flex items-center gap-3.5">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 shadow-lg">
                            {friendAvatar ? (
                                <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-sm font-bold">
                                    {getInitials(friendName || "")}
                                </div>
                            )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                    </div>
                    <div>
                        <p className="font-semibold text-white text-sm leading-tight flex items-center gap-1.5">
                            {friendName}
                            <Lock size={12} className="text-white/30" />
                        </p>
                        <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                            End-to-End Encrypted
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg text-white/35 hover:text-white hover:bg-white/8 transition-all cursor-pointer" title="Voice Call">
                        <Phone size={17} />
                    </button>
                    <button className="p-2 rounded-lg text-white/35 hover:text-white hover:bg-white/8 transition-all cursor-pointer" title="Video Call">
                        <Video size={17} />
                    </button>
                    <button className="p-2 rounded-lg text-white/35 hover:text-white hover:bg-white/8 transition-all cursor-pointer">
                        <MoreHorizontal size={17} />
                    </button>
                </div>
            </motion.div>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 scrollbar-thin scrollbar-thumb-white/8 scrollbar-track-transparent">
                <AnimatePresence initial={false}>
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center gap-4 py-20"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 border border-white/8 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-primary/50" />
                            </div>
                            <div>
                                <p className="text-white/45 font-medium text-sm">
                                    Start a secure conversation with{" "}
                                    <span className="text-white/70 font-semibold">{friendName}</span>
                                </p>
                                <p className="text-white/22 text-xs mt-1">Messages auto-delete after 6 hours</p>
                            </div>
                        </motion.div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderId === "me";
                            const prevMsg = messages[index - 1];
                            const showAvatar = !isMe && (!prevMsg || prevMsg.senderId === "me");

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                    className={cn("flex items-end gap-2.5", isMe ? "flex-row-reverse" : "flex-row")}
                                >
                                    {/* Friend avatar */}
                                    {!isMe && (
                                        <div className={cn(
                                            "w-7 h-7 rounded-full shrink-0 overflow-hidden",
                                            !showAvatar && "opacity-0"
                                        )}>
                                            {friendAvatar ? (
                                                <img src={friendAvatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-[9px] font-bold">
                                                    {getInitials(friendName || "")}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={cn("flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                                            isMe
                                                ? "bg-gradient-to-br from-primary to-primary/85 text-white rounded-br-md shadow-lg shadow-primary/20"
                                                : "bg-white/8 border border-white/10 text-white/90 rounded-bl-md"
                                        )}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-white/18 px-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="px-6 py-4 border-t border-white/8 bg-white/2 shrink-0">
                <div className="relative flex items-center gap-3 bg-white/6 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-primary/40 focus-within:bg-white/8 transition-all duration-200 shadow-sm">
                    <EmojiPickerPopup
                        isOpen={isEmojiOpen}
                        onClose={() => setIsEmojiOpen(false)}
                        onEmojiClick={handleEmojiClick}
                        anchorRef={emojiButtonRef}
                    />
                    <button
                        ref={emojiButtonRef}
                        onClick={() => setIsEmojiOpen(prev => !prev)}
                        className={cn(
                            "transition-colors cursor-pointer shrink-0",
                            isEmojiOpen ? "text-primary" : "text-white/28 hover:text-white/60"
                        )}
                        title="Emoji"
                    >
                        <Smile size={19} />
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            !isReady ? "Initializing E2EE Keys..." : 
                            !isPusherConnected ? "Connecting to live chat..." : 
                            `Message ${friendName}...`
                        }
                        disabled={!isReady || !isPusherConnected}
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/22 focus:outline-none min-w-0"
                        autoFocus
                    />
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={handleSend}
                        disabled={!input.trim() || !isReady || !isPusherConnected}
                        className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
                            (input.trim() && isReady && isPusherConnected)
                                ? "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 cursor-pointer"
                                : "bg-white/5 text-white/18 cursor-not-allowed"
                        )}
                    >
                        <Send size={14} />
                    </motion.button>
                </div>
                <p className="text-[10px] text-white/12 text-center mt-2 flex items-center justify-center gap-1.5">
                    <Lock size={9} />
                    End-to-End Encrypted. Messages self-destruct after 6 hours.
                </p>
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <div className="h-full overflow-hidden">
            <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
            }>
                <ChatContent />
            </Suspense>
        </div>
    );
}
