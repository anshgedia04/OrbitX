"use client";

import React, { useState } from "react";
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
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { useRouter, usePathname } from "next/navigation";
import { useUIStore } from "@/store/use-ui-store";
import { StorageLimitModal } from "./StorageLimitModal";

interface SidebarProps {
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [creatingFolderParentId, setCreatingFolderParentId] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState("");

    const { foldersUpdated, triggerFolderRefresh, storageUsage, setStorageUsage } = useUIStore();

    React.useEffect(() => {
        fetchFolders();
        fetchStorage();
    }, [foldersUpdated]);

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
                // If created in a folder, ensure it's expanded
                if (creatingFolderParentId && creatingFolderParentId !== "root") {
                    setExpandedFolders(prev => prev.includes(creatingFolderParentId) ? prev : [...prev, creatingFolderParentId]);
                }
            }
        } catch (error) {
            console.error("Failed to create folder", error);
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
            onAddSubFolder={(e: React.MouseEvent) => {
                e.stopPropagation();
                setCreatingFolderParentId(folder._id);
                setExpandedFolders(prev => prev.includes(folder._id) ? prev : [...prev, folder._id]);
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
        <motion.div
            initial="expanded"
            animate={isCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            className={cn(
                "h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col relative transition-all duration-300 z-50",
                className
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 bg-primary text-white p-1 rounded-full shadow-lg border border-white/20 hover:scale-110 transition-transform z-10"
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Header */}
            <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Rocket className="w-5 h-5 text-white animate-pulse" />
                </div>
                <motion.span
                    animate={{ opacity: isCollapsed ? 0 : 1 }}
                    className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70"
                >
                    OrbitX
                </motion.span>
            </div>

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
                    active={pathname === "/"}
                    onClick={() => router.push("/")}
                />
                <NavItem
                    icon={<FileText size={20} />}
                    label="All Notes"
                    isCollapsed={isCollapsed}
                    active={pathname === "/notes"}
                    onClick={() => router.push("/notes")}
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

            {/* Footer & Storage */}
            <div className="p-4 border-t border-white/10 space-y-4 bg-black/20">
                {!isCollapsed && (
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                        JD
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">John Doe</p>
                            <p className="text-xs text-white/50 truncate">Pro Plan</p>
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

const FolderItem = ({ name, id, isCollapsed, isExpanded, onToggle, children, depth = 0, onClick, onAddSubFolder }: any) => {
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
                    "group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-sm text-white/70 hover:text-white transition-colors relative pr-8",
                    depth > 0 && "ml-4"
                )}
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

                {/* Add Subfolder Button - Visible on Hover */}
                {isHovered && (
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
