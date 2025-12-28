"use client";

import React from "react";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Link as LinkIcon,
    Code,
    Image as ImageIcon,
    Heading1,
    Heading2,
    Quote
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EditorToolbarProps {
    onAction: (action: string) => void;
    mode: "text" | "markdown" | "code";
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onAction, mode }) => {
    if (mode === "code") return null;

    const actions = [
        { id: "bold", icon: <Bold size={16} />, label: "Bold (Ctrl+B)" },
        { id: "italic", icon: <Italic size={16} />, label: "Italic (Ctrl+I)" },
        { id: "h1", icon: <Heading1 size={16} />, label: "Heading 1" },
        { id: "h2", icon: <Heading2 size={16} />, label: "Heading 2" },
        { id: "list", icon: <List size={16} />, label: "Bullet List" },
        { id: "ordered-list", icon: <ListOrdered size={16} />, label: "Numbered List" },
        { id: "quote", icon: <Quote size={16} />, label: "Quote" },
        { id: "code", icon: <Code size={16} />, label: "Code Block" },
        { id: "link", icon: <LinkIcon size={16} />, label: "Link" },
        { id: "image", icon: <ImageIcon size={16} />, label: "Image" },
    ];

    return (
        <div className="flex items-center gap-1 p-2 bg-white/5 border-b border-white/10 overflow-x-auto">
            {actions.map((action) => (
                <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction(action.id)}
                    title={action.label}
                    className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                >
                    {action.icon}
                </Button>
            ))}
        </div>
    );
};
