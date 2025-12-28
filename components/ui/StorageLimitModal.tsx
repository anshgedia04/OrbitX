"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Zap, HardDrive } from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";

export const StorageLimitModal = () => {
    const { isStorageLimitModalOpen, setStorageLimitModalOpen, storageUsage } = useUIStore();

    // Calculate formatted size strings for display
    const formatSize = (bytes: number) => {
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <Modal
            isOpen={isStorageLimitModalOpen}
            onClose={() => setStorageLimitModalOpen(false)}
            title="Storage Limit Reached"
            className="border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
        >
            <div className="flex flex-col items-center text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <HardDrive className="text-red-400" size={32} />
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Out of Storage</h3>
                    <p className="text-white/60 max-w-xs mx-auto">
                        You have used {formatSize(storageUsage.used)} of your {formatSize(storageUsage.limit)} limit.
                        Please upgrade your plan to create more notes.
                    </p>
                </div>

                <div className="w-full bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Usage</span>
                        <span className="text-red-400 font-medium">100%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-red-500 rounded-full" />
                    </div>
                </div>

                <div className="flex gap-3 w-full">
                    <Button
                        variant="ghost"
                        onClick={() => setStorageLimitModalOpen(false)}
                        className="flex-1"
                    >
                        Maybe Later
                    </Button>
                    <Button
                        onClick={() => {
                            // Placeholder for upgrade flow
                            alert("Redirecting to upgrade page...");
                            setStorageLimitModalOpen(false);
                        }}
                        className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 border-none text-white shadow-lg shadow-red-500/20"
                        leftIcon={<Zap size={16} />}
                    >
                        Upgrade Plan
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
