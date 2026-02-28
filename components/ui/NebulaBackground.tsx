"use client";

import React from "react";

export const NebulaBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none">
            {/* Deep space base */}
            <div className="absolute inset-0 bg-[#080b14]" />

            {/* Nebula glow - top left purple */}
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-900/30 blur-[120px]" />

            {/* Nebula glow - top right blue */}
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-blue-900/25 blur-[100px]" />

            {/* Nebula glow - center */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-indigo-900/20 blur-[140px]" />

            {/* Nebula glow - bottom left */}
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-900/20 blur-[100px]" />

            {/* Nebula glow - bottom right */}
            <div className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-900/15 blur-[120px]" />
        </div>
    );
};
