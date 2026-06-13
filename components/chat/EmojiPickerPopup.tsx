"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface EmojiPickerPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onEmojiClick: (emoji: string) => void;
    anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export const EmojiPickerPopup: React.FC<EmojiPickerPopupProps> = ({
    isOpen,
    onClose,
    onEmojiClick,
    anchorRef,
}) => {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(e.target as Node) &&
                anchorRef.current &&
                !anchorRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose, anchorRef]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popupRef}
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute bottom-full left-0 mb-2 z-50"
                    style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" }}
                >
                    <EmojiPicker
                        onEmojiClick={(emojiData) => {
                            onEmojiClick(emojiData.emoji);
                        }}
                        theme={"dark" as any}
                        searchPlaceHolder="Search emojis..."
                        width={320}
                        height={380}
                        previewConfig={{ showPreview: false }}
                        skinTonesDisabled
                        style={{
                            background: "#13141f",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "14px",
                            fontFamily: "inherit",
                        } as React.CSSProperties}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
