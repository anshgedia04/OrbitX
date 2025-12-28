"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

// Define props explicitly extending HTMLMotionProps to get all motion capabilities
interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
    size?: "sm" | "md" | "lg";
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    showRocket?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", leftIcon, rightIcon, showRocket = false, children, ...props }, ref) => {

        const variants = {
            primary: "bg-primary text-white shadow-[0_0_15px_rgba(107,70,193,0.5)] hover:shadow-[0_0_25px_rgba(107,70,193,0.8)] border border-primary/50",
            secondary: "bg-secondary text-white shadow-[0_0_15px_rgba(66,153,225,0.5)] hover:shadow-[0_0_25px_rgba(66,153,225,0.8)] border border-secondary/50",
            ghost: "bg-transparent text-foreground hover:bg-white/10 border border-transparent hover:border-white/20",
            danger: "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] border border-red-600/50",
            outline: "bg-transparent text-white border border-white/20 hover:bg-white/10 hover:border-white/40",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2 text-base",
            lg: "px-6 py-3 text-lg",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "relative flex items-center justify-center gap-2 rounded-lg font-medium transition-colors overflow-hidden backdrop-blur-sm",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {/* Glow effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:animate-[shimmer_1.5s_infinite]" />

                {showRocket && <Rocket className="w-4 h-4 animate-pulse" />}
                {/* Cast to any to avoid potential MotionValue type conflicts in strict mode */}
                {leftIcon && <span className="w-4 h-4 flex items-center justify-center">{leftIcon as any}</span>}
                {children as any}
                {rightIcon && <span className="w-4 h-4 flex items-center justify-center">{rightIcon as any}</span>}
            </motion.button>
        );
    }
);

Button.displayName = "Button";
