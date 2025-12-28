"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<typeof motion.div> {
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
    className,
    children,
    hoverEffect = true,
    ...props
}) => {
    return (
        <motion.div
            whileHover={hoverEffect ? { y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" } : {}}
            className={cn(
                "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl relative overflow-hidden",
                className
            )}
            {...props}
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10 h-full">{children as any}</div>
        </motion.div>
    );
};
