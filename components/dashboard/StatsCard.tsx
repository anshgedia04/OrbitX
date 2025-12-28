"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: string;
    delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    label,
    value,
    icon,
    trend,
    color = "bg-primary",
    delay = 0,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
        >
            <Card className="relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-white/50 font-medium mb-1">{label}</p>
                        <h3 className="text-2xl font-bold text-white">{value}</h3>

                        {trend && (
                            <div className={cn(
                                "flex items-center gap-1 text-xs mt-2 font-medium",
                                trend.isPositive ? "text-green-400" : "text-red-400"
                            )}>
                                <span>{trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%</span>
                                <span className="text-white/30">vs last month</span>
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        "p-3 rounded-xl text-white shadow-lg",
                        color
                    )}>
                        {icon}
                    </div>
                </div>

                {/* Background Glow */}
                <div className={cn(
                    "absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-[40px] opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none",
                    color
                )} />
            </Card>
        </motion.div>
    );
};
