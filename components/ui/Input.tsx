"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const [hasValue, setHasValue] = useState(false);

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            props.onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
        };

        return (
            <div className="relative w-full group">
                <motion.div
                    animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
                    className="relative"
                >
                    <input
                        ref={ref}
                        className={cn(
                            "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder-transparent outline-none transition-all duration-300",
                            "focus:border-accent focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]",
                            error && "border-red-500 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
                            className
                        )}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        {...props}
                    />
                    {label && (
                        <label
                            className={cn(
                                "absolute left-4 transition-all duration-300 pointer-events-none text-white/50",
                                (isFocused || hasValue || props.value)
                                    ? "-top-2.5 left-3 text-xs bg-background px-1 text-accent"
                                    : "top-3 text-base"
                            )}
                        >
                            {label}
                        </label>
                    )}
                </motion.div>
                {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
