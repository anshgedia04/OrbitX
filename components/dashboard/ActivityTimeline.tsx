"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Folder, Trash2, Edit, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface Activity {
    id: string;
    type: "create" | "edit" | "delete" | "move";
    target: string;
    targetType: "note" | "folder";
    timestamp: string;
}

interface ActivityTimelineProps {
    activities: Activity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
    const getIcon = (type: string) => {
        switch (type) {
            case "create": return <Plus size={14} />;
            case "edit": return <Edit size={14} />;
            case "delete": return <Trash2 size={14} />;
            default: return <FileText size={14} />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "create": return "bg-green-500";
            case "edit": return "bg-blue-500";
            case "delete": return "bg-red-500";
            default: return "bg-gray-500";
        }
    };

    return (
        <Card className="h-full">
            <h3 className="font-bold text-lg mb-4 text-white">Recent Activity</h3>
            <div className="space-y-6 relative pl-2">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/10 rounded-full" />

                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex items-start gap-4"
                    >
                        <div className={`relative z-10 w-6 h-6 rounded-full ${getColor(activity.type)} flex items-center justify-center text-white shadow-lg ring-4 ring-[#0a0e27]`}>
                            {getIcon(activity.type)}
                        </div>
                        <div className="flex-1 pt-0.5">
                            <p className="text-sm text-white/80">
                                <span className="font-medium capitalize">{activity.type}d</span>{" "}
                                <span className="text-accent">{activity.target}</span>
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">{activity.timestamp}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Card>
    );
};
