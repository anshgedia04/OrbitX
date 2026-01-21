"use client";

import React from "react";
import { motion } from "framer-motion";
import { Rocket, Notebook } from "lucide-react";

interface FloatingActionButtonProps {
    onClick: () => void;
    variant?: "rocket" | "notebook";
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, variant = "rocket" }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="fixed bottom-8 right-8 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(107,70,193,0.5)] hover:shadow-[0_0_30px_rgba(107,70,193,0.8)] transition-shadow z-50 group"
        >
            {variant === "rocket" ? (
                <Rocket className="text-white w-6 h-6 group-hover:animate-pulse" />
            ) : (
                <Notebook className="text-white w-6 h-6 group-hover:animate-pulse" />
            )}
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
        </motion.button>
    );
};
