import React from "react";

interface LoaderProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function Loader({ size = "md", className = "" }: LoaderProps) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-2",
        lg: "w-12 h-12 border-3",
    };

    return (
        <div
            className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin ${className}`}
            role="status"
            aria-label="Loading"
        />
    );
}
