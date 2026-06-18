"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Folder,
    Plus,
    Settings,
    LayoutDashboard,
    FileText,
    Tags,
    Trash2,
    ChevronDown,
    Rocket,
    Star,
    MessageCircle,
    Edit2,
    MessageSquarePlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUIStore } from "@/store/use-ui-store";
import { StorageLimitModal } from "./StorageLimitModal";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface SidebarProps {
    className?: string;
    onTalkToggle?: () => void;
    isTalkOpen?: boolean;
    isLocked?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onTalkToggle, isTalkOpen, isLocked = false }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [creatingFolderParentId, setCreatingFolderParentId] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState("");
    const [aiProcessedNotes, setAiProcessedNotes] = useState<any[]>([]);
    const searchParams = useSearchParams();
    const activeContextNoteId = searchParams.get("contextNoteId");
    const activeSessionId = searchParams.get("sessionId");
    const [noteToDelete, setNoteToDelete] = useState<{ id: string, title: string } | null>(null);
    const [isDeletingNote, setIsDeletingNote] = useState(false);
    const [aiChatSessions, setAiChatSessions] = useState<any[]>([]);

    const { foldersUpdated, triggerFolderRefresh, storageUsage, setStorageUsage } = useUIStore();
    const { showToast } = useToast();
    const { user } = useAuth();
    const isAiPage = pathname === "/ai";

    // When locked (e.g. /chat page), force sidebar expanded
    useEffect(() => {
        if (isLocked) setIsCollapsed(false);
    }, [isLocked]);

    React.useEffect(() => {
        fetchFolders();
        fetchStorage();
        if (isAiPage) {
            fetchAiProcessedNotes();
            fetchAiChatSessions();
        }
    }, [foldersUpdated, isAiPage, activeContextNoteId]);

    const fetchAiChatSessions = async () => {
        try {
            const response = await fetch("/api/ai/chats");
            if (response.ok) {
                const data = await response.json();
                setAiChatSessions(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch AI chat sessions");
        }
    };

    const fetchAiProcessedNotes = async () => {
        try {
            const response = await fetch("/api/notes?aiProcessed=true&limit=10");
            if (response.ok) {
                const data = await response.json();
                setAiProcessedNotes(data.notes || []);
            }
        } catch (error) {
            console.error("Failed to fetch AI processed notes");
        }
    };

    const fetchStorage = async () => {
        try {
            const res = await fetch(`/api/user/storage?t=${Date.now()}`); // Cache busting
            if (res.ok) {
                const data = await res.json();
                setStorageUsage({ used: data.used, limit: data.limit });
            }
        } catch (error) {
            console.error("Failed to fetch storage", error);
        }
    };

    const fetchFolders = async () => {
        try {
            const res = await fetch("/api/folders");
            if (res.ok) {
                const data = await res.json();
                setFolders(data);
            }
        } catch (error) {
            console.error("Failed to fetch folders", error);
        }
    };

    const handleCreateFolder = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            const res = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName,
                    color: "bg-blue-500",
                    parentFolder: creatingFolderParentId === "root" ? undefined : creatingFolderParentId
                }),
            });

            if (res.ok) {
                setNewFolderName("");
                setCreatingFolderParentId(null);
                fetchFolders();
                showToast("Folder created successfully!", "success");
                // If created in a folder, ensure it's expanded
                if (creatingFolderParentId && creatingFolderParentId !== "root") {
                    setExpandedFolders(prev => prev.includes(creatingFolderParentId) ? prev : [...prev, creatingFolderParentId]);
                }
            } else {
                const errorData = await res.json();
                showToast(errorData.error || "Failed to create folder", "error");
                setNewFolderName("");
                setCreatingFolderParentId(null);
            }
        } catch (error) {
            console.error("Failed to create folder", error);
            showToast("Failed to create folder", "error");
        }
    };

    const confirmDeleteProcessedNote = async () => {
        if (!noteToDelete) return;
        setIsDeletingNote(true);
        try {
            const res = await fetch(`/api/ai/process-note?noteId=${noteToDelete.id}`, {
                method: "DELETE"
            });
            
            if (res.ok) {
                setAiProcessedNotes(prev => prev.filter(n => n._id !== noteToDelete.id));
                showToast("Note removed from AI context", "success");
                
                // If we are currently chatting with this note, clear the context
                if (activeContextNoteId === noteToDelete.id) {
                    router.push('/ai');
                }
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to remove note", "error");
            }
        } catch (error) {
            console.error("Failed to delete processed note:", error);
            showToast("Failed to remove note", "error");
        } finally {
            setIsDeletingNote(false);
            setNoteToDelete(null);
        }
    };

    const handleDeleteProcessedNote = (e: React.MouseEvent, noteId: string, title: string) => {
        e.stopPropagation();
        setNoteToDelete({ id: noteId, title });
    };

    const handleCreateChat = async () => {
        const name = window.prompt("Enter new chat name:");
        if (!name) return;
        try {
            const res = await fetch("/api/ai/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                const newChat = await res.json();
                setAiChatSessions(prev => [newChat, ...prev]);
                router.push(`/ai?sessionId=${newChat.id}`);
            }
        } catch (e) {
            console.error("Failed to create chat", e);
        }
    };

    const handleRenameChat = async (e: React.MouseEvent, id: string, oldName: string) => {
        e.stopPropagation();
        const newName = window.prompt("Enter new name:", oldName);
        if (!newName || newName === oldName) return;
        try {
            const res = await fetch(`/api/ai/chats/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                const updated = await res.json();
                setAiChatSessions(prev => prev.map(c => c.id === id ? updated : c));
            }
        } catch (e) {
            console.error("Failed to rename chat", e);
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this chat permanently?")) return;
        try {
            const res = await fetch(`/api/ai/chats/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setAiChatSessions(prev => prev.filter(c => c.id !== id));
                if (activeSessionId === id) {
                    router.push("/ai");
                }
            }
        } catch (e) {
            console.error("Failed to delete chat", e);
        }
    };

    const sidebarVariants = {
        expanded: { width: 280 },
        collapsed: { width: 80 }
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        );
    };

    const renderFolder = (folder: any, level: number = 0) => (
        <FolderItem
            key={folder._id}
            name={folder.name}
            id={folder._id}
            isCollapsed={isCollapsed}
            isExpanded={expandedFolders.includes(folder._id)}
            onToggle={() => toggleFolder(folder._id)}
            onClick={() => router.push(`/folders/${folder._id}`)}
            depth={level}
            canAddSubfolder={level < 2}
            onAddSubFolder={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (level < 2) {
                    setCreatingFolderParentId(folder._id);
                    setExpandedFolders(prev => prev.includes(folder._id) ? prev : [...prev, folder._id]);
                }
            }}
        >
            {creatingFolderParentId === folder._id && (
                <div className="pl-6 pr-2 py-1">
                    <FolderCreationForm
                        value={newFolderName}
                        onChange={setNewFolderName}
                        onSubmit={handleCreateFolder}
                        onCancel={() => {
                            setCreatingFolderParentId(null);
                            setNewFolderName("");
                        }}
                    />
                </div>
            )}
            {folder.children && folder.children.map((child: any) => renderFolder(child, level + 1))}
        </FolderItem>
    );

    return (
        <>
        <motion.div
            initial="expanded"
            animate={isCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            className={cn(
                "h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col relative transition-all duration-300 z-50",
                className
            )}
        >
            {/* Toggle Button — hidden when sidebar is locked */}
            {!isLocked && (
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-primary text-white p-1 rounded-full shadow-lg border border-white/20 hover:scale-110 transition-transform z-10 cursor-pointer"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            )}

            {/* Header */}
            <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
            {isAiPage ? (
                // AI Page Logo
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img src="/OrbitX AI.png" alt="OrbitX AI" className="w-full h-full object-cover" />
                    </div>
                    <motion.span animate={{ opacity: isCollapsed ? 0 : 1 }} className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        OrbitX AI
                    </motion.span>
                </motion.div>
            ) : (
                // Standard Logo
                <>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Rocket className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <motion.span animate={{ opacity: isCollapsed ? 0 : 1 }} className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        OrbitX
                    </motion.span>
                </>
            )}
            </div>

            {isAiPage ? (
                // AI Sidebar Content
                <div className="flex-1 overflow-y-auto px-4 space-y-4">
                    {!isCollapsed && (
                        <div className="flex items-center justify-between px-2 mb-2">
                            <div className="text-xs font-semibold uppercase text-white/40">History</div>
                            <button 
                                onClick={handleCreateChat}
                                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                                title="New Chat"
                            >
                                <MessageSquarePlus size={14} />
                            </button>
                        </div>
                    )}
                    <div className="space-y-1">
                        {aiChatSessions.length > 0 ? (
                            aiChatSessions.map(session => (
                                <div 
                                    key={session.id}
                                    onClick={() => router.push(`/ai?sessionId=${session.id}`)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-sm text-white/70 truncate cursor-pointer transition-colors flex items-center justify-between group",
                                        activeSessionId === session.id
                                            ? "bg-primary/20 border-l-2 border-primary"
                                            : "hover:bg-white/5"
                                    )}
                                >
                                    <span className="truncate">{session.name}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleRenameChat(e, session.id, session.name)}
                                            className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white cursor-pointer"
                                            title="Rename Chat"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteChat(e, session.id)}
                                            className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-red-400 cursor-pointer"
                                            title="Delete Chat"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-white/30 italic">No chat history.</div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <div className="text-xs font-semibold uppercase text-white/40 mt-6 mb-2 px-2 flex items-center gap-2">
                            <FileText size={12} /> Processed Notes Context
                        </div>
                    )}
                    <div className="space-y-1">
                        {aiProcessedNotes.length > 0 ? (
                            aiProcessedNotes.map(note => (
                                <div 
                                    key={note._id}
                                    onClick={() => router.push(`/ai?contextNoteId=${note._id}`)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-sm text-white/70 truncate cursor-pointer transition-colors flex items-center justify-between group",
                                        activeContextNoteId === note._id
                                            ? "bg-violet-500/10 border border-violet-500/30"
                                            : "hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                            activeContextNoteId === note._id
                                                ? "bg-violet-400"
                                                : "bg-white/20"
                                        )} />
                                        <span className="truncate">{note.title}</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteProcessedNote(e, note._id, note.title)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-white/40 hover:text-red-400 transition-all flex-shrink-0 cursor-pointer"
                                        title="Remove from AI context"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-white/30 italic">No notes loaded into AI yet.</div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <div className="mt-8 text-center text-xs text-white/20 px-4">Values generated by AI may be inaccurate.</div>
                    )}
                </div>
            ) : (
                // Standard Sidebar Content
                <>
                    {/* Quick Actions */}
                    <div className="px-4 mb-6">
                        <Button
                            variant="primary"
                            className={cn("w-full justify-start gap-2 shadow-lg shadow-primary/20", isCollapsed && "justify-center px-0")}
                            showRocket={!isCollapsed}
                            onClick={() => router.push("/notes/new")}
                        >
                            <Plus size={20} />
                            {!isCollapsed && "New Note"}
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <NavItem
                            icon={<LayoutDashboard size={20} />}
                            label="Dashboard"
                            isCollapsed={isCollapsed}
                            active={pathname === "/dashboard"}
                            onClick={() => router.push("/dashboard")}
                        />
                        <NavItem
                            icon={<FileText size={20} />}
                            label="All Notes"
                            isCollapsed={isCollapsed}
                            active={pathname === "/notes"}
                            onClick={() => router.push("/notes")}
                        />
                        <NavItem
                            icon={<MessageCircle size={20} />}
                            label="Let's Talk"
                            isCollapsed={isCollapsed}
                            active={!!isTalkOpen}
                            onClick={() => onTalkToggle?.()}
                        />
                        <NavItem
                            icon={<Star size={20} />}
                            label="Favorites"
                            isCollapsed={isCollapsed}
                            active={pathname === "/favorites"}
                            onClick={() => router.push("/favorites")}
                        />
                        <NavItem
                            icon={<Tags size={20} />}
                            label="Tags"
                            isCollapsed={isCollapsed}
                            active={pathname === "/tags"}
                            onClick={() => router.push("/tags")}
                        />
                        <NavItem
                            icon={<Trash2 size={20} />}
                            label="Trash"
                            isCollapsed={isCollapsed}
                            active={pathname === "/trash"}
                            onClick={() => router.push("/trash")}
                        />

                        <div className="my-4 border-t border-white/10" />

                        <div className="space-y-1">
                            {!isCollapsed && (
                                <div className="flex items-center justify-between px-2 mb-2 text-white/40">
                                    <p className="text-xs font-semibold uppercase">Folders</p>
                                    <Plus
                                        size={14}
                                        className="cursor-pointer hover:text-white transition-colors"
                                        onClick={() => setCreatingFolderParentId("root")}
                                    />
                                </div>
                            )}

                            {creatingFolderParentId === "root" && !isCollapsed && (
                                <div className="px-2 py-1">
                                    <FolderCreationForm
                                        value={newFolderName}
                                        onChange={setNewFolderName}
                                        onSubmit={handleCreateFolder}
                                        onCancel={() => {
                                            setCreatingFolderParentId(null);
                                            setNewFolderName("");
                                        }}
                                    />
                                </div>
                            )}

                            {folders.map((folder) => renderFolder(folder))}
                        </div>
                    </nav>
                </>
            )}

            {/* Footer & Storage - Keep for both but maybe simplified for AI? keeping same for consistency */}
            <div className="p-4 border-t border-white/10 space-y-4 bg-black/20">
                {!isCollapsed && !isAiPage && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/60">
                            <span>Storage</span>
                            <span>{Math.round((storageUsage.used / storageUsage.limit) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    (storageUsage.used / storageUsage.limit) > 0.9 ? "bg-red-500" : "bg-gradient-to-r from-primary to-accent"
                                )}
                                style={{ width: `${Math.min((storageUsage.used / storageUsage.limit) * 100, 100)}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-white/30 text-right">
                            {((storageUsage.used / (1024 * 1024)).toFixed(1))} MB / {((storageUsage.limit / (1024 * 1024)).toFixed(0))} MB
                        </div>
                    </div>
                )}

                <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-xs font-bold ring-2 ring-white/10 overflow-hidden">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-white/50 truncate">{user?.subscriptionStatus === 'plus' ? 'Plus Plan' : user?.subscriptionStatus === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <Settings
                            size={16}
                            className="text-white/40 hover:text-white cursor-pointer"
                            onClick={() => router.push("/settings")}
                        />
                    )}
                </div>
            </div>
            <StorageLimitModal />

        </motion.div>

        {/* Note Deletion Modal - Moved outside motion.div to prevent being trapped in sidebar */}
        <Modal
            isOpen={!!noteToDelete}
            onClose={() => !isDeletingNote && setNoteToDelete(null)}
            title="Remove from AI context?"
        >
            <div className="space-y-4">
                <p className="text-sm text-white/70">
                    Are you sure you want to remove <span className="text-white font-medium">"{noteToDelete?.title}"</span> from your AI context?
                </p>
                <p className="text-xs text-red-400/80 bg-red-400/10 p-3 rounded border border-red-400/20">
                    This will permanently delete all vector embeddings generated for this note and clear its chat history. The original note itself will <strong>not</strong> be deleted.
                </p>
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="ghost"
                        onClick={() => setNoteToDelete(null)}
                        disabled={isDeletingNote}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        className="bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 cursor-pointer"
                        onClick={confirmDeleteProcessedNote}
                        disabled={isDeletingNote}
                    >
                        {isDeletingNote ? "Removing..." : "Yes, Remove it"}
                    </Button>
                </div>
            </div>
        </Modal>
        </>
    );
};

const NavItem = ({ icon, label, isCollapsed, active, onClick }: any) => (
    <Button
        variant="ghost"
        onClick={onClick}
        className={cn(
            "w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-white/5",
            isCollapsed && "justify-center px-0",
            active && "bg-primary/10 text-primary hover:bg-primary/20"
        )}
        leftIcon={icon}
    >
        {!isCollapsed && <span>{label}</span>}
    </Button>
);

const FolderCreationForm = ({ value, onChange, onSubmit, onCancel }: any) => (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
        <Folder size={16} className="text-primary" />
        <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => !value && onCancel()}
            onKeyDown={(e) => e.key === 'Escape' && onCancel()}
            placeholder="Folder name..."
            className="bg-transparent border-b border-white/20 text-sm text-white w-full focus:outline-none focus:border-primary"
        />
    </form>
);

const FolderItem = ({ name, id, isCollapsed, isExpanded, onToggle, children, depth = 0, onClick, onAddSubFolder, canAddSubfolder = true }: any) => {
    const [isHovered, setIsHovered] = useState(false);

    if (isCollapsed) {
        return (
            <div className="flex justify-center py-2" title={name}>
                <Folder size={20} className="text-white/40 hover:text-primary transition-colors" />
            </div>
        );
    }

    return (
        <div className="select-none">
            <div
                className={cn(
                    "group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-sm text-white/70 hover:text-white transition-colors relative pr-8"
                )}
                style={{ marginLeft: `${depth * 16}px` }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => {
                    // If clicking interacitve elements, don't navigate
                    if ((e.target as HTMLElement).closest('.interactive')) {
                        e.stopPropagation();
                        return;
                    }
                    onClick && onClick();
                    onToggle && onToggle();
                }}
            >
                {/* Arrow always reserved space or visible if has children OR if we want to align */}
                {(children || depth > 0) ? (
                    <div className="interactive p-0.5 hover:bg-white/10 rounded" onClick={(e) => {
                        e.stopPropagation();
                        onToggle && onToggle();
                    }}>
                        {/* Only show arrow if has children to expand/collapse or if we intend to allow adding to empty folders so we might want to expand them */}
                        {(React.Children.count(children) > 0) ? (
                            <ChevronDown
                                size={14}
                                className={cn("transition-transform", !isExpanded && "-rotate-90")}
                            />
                        ) : <div className="w-[14px]" />}
                    </div>
                ) : (
                    <div className="w-[14px]" />
                )}

                <Folder size={16} className={cn("text-primary/70", (isExpanded || React.Children.count(children) > 0) && "text-primary")} />
                <span className="truncate flex-1">{name}</span>

                {/* Add Subfolder Button - Visible on Hover and only if depth limit allows */}
                {isHovered && canAddSubfolder && (
                    <div
                        className="interactive absolute right-2 opacity-100 p-1 hover:bg-white/20 rounded-full transition-all"
                        onClick={onAddSubFolder}
                        title="Create sub-folder"
                    >
                        <Plus size={12} className="text-white/70 hover:text-white" />
                    </div>
                )}
            </div>
            <AnimatePresence>
                {(isExpanded) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
