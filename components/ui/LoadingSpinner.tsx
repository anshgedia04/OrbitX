"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md" }) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-16 h-16",
        lg: "w-24 h-24"
    };

    return (
        <div className="flex items-center justify-center">
            <div className={`relative ${sizeClasses[size]}`}>
                {/* Core */}
                <motion.div
                    className="absolute inset-0 m-auto w-1/4 h-1/4 bg-accent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Inner Ring */}
                <motion.div
                    className="absolute inset-0 w-full h-full border-2 border-primary/50 rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Outer Ring */}
                <motion.div
                    className="absolute -inset-[15%] w-[130%] h-[130%] border-2 border-secondary/30 rounded-full border-b-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </div>
        </div>
    );
};
