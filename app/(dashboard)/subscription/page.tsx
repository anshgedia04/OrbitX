"use client";

import React from "react";
import { Check, Star, Zap, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

export default function SubscriptionPage() {
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const handleUpgrade = () => {
        setIsUpgradeModalOpen(true);
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Power Level</span>
                </h1>
                <p className="text-white/60 max-w-2xl mx-auto text-lg">
                    Unlock the full potential of your second brain with our premium features.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
                {/* Free Plan */}
                <Card className="relative p-8 flex flex-col h-full bg-[#12121A]/80 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300 group">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">Free Plan</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">₹0</span>
                            <span className="text-white/50">/month</span>
                        </div>
                        <p className="text-white/50 mt-4 text-sm">Perfect for getting started.</p>
                    </div>

                    <div className="flex-grow space-y-4 mb-8">
                        <FeatureItem text="40 MB Storage" />
                        <FeatureItem text="Standard Email Support" />
                        <FeatureItem text="Limit: 250 Notes" />
                        <FeatureItem text="Basic Note Editing" />
                        <FeatureItem text="Mobile Access" />
                    </div>

                    <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white">
                        Current Plan
                    </Button>
                </Card>

                {/* Pro Plan */}
                <Card className="relative p-8 flex flex-col h-full bg-[#12121A]/90 border-purple-500/50 backdrop-blur-xl transform md:-translate-y-4 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.5)]">

                    {/* Badge */}
                    <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 rotate-12">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                            <Crown size={12} fill="currentColor" />
                            Most Popular
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">Pro Plan</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">₹9</span>
                            <span className="text-white/50">/year</span>
                        </div>
                        <p className="text-purple-200/50 mt-4 text-sm">For power users who need more.</p>
                    </div>

                    <div className="flex-grow space-y-4 mb-8">
                        <FeatureItem text="100 MB Storage" highlighted />
                        <FeatureItem text="Priority Email Support" highlighted />
                        <FeatureItem text="Unlimited Note Creation" highlighted />
                        <FeatureItem text="Advanced Search" />
                        <FeatureItem text="Early Access to New Features" />
                    </div>

                    <Button
                        onClick={handleUpgrade}
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-purple-500/25"
                    >
                        <Zap size={16} className="mr-2 fill-current" />
                        Upgrade Now
                    </Button>
                </Card>
            </div>

            <div className="mt-16 text-center text-white/30 text-sm">
                <p>Secure payment processing. Cancel anytime.</p>
            </div>

            <Modal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                title="Pro Plan Unavailable"
            >
                <div className="space-y-4">
                    <p className="text-lg text-white/80">
                        Currently pro plan is not available. Please enjoy your free tier plan.
                    </p>
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={() => setIsUpgradeModalOpen(false)}
                            variant="secondary"
                        >
                            Got it
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function FeatureItem({ text, highlighted = false }: { text: string; highlighted?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("p-1 rounded-full", highlighted ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60")}>
                <Check size={14} strokeWidth={3} />
            </div>
            <span className={cn("text-sm", highlighted ? "text-white font-medium" : "text-white/70")}>{text}</span>
        </div>
    );
}
