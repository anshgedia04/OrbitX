"use client";

import React from "react";
import { Check, Star, Zap, Shield, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import Script from "next/script";
import { useToast } from "@/components/ui/Toast";
export default function SubscriptionPage() {
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'plus'>('free');
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState("");
    const [userName, setUserName] = useState("");
    const { showToast } = useToast();

    React.useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setSubscriptionStatus(data.subscriptionStatus || 'free');
                    setUserEmail(data.email || "");
                    setUserName(data.name || "");
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleUpgrade = async (planId: 'pro' | 'plus') => {
        if (!userEmail) {
            showToast("Please log in to upgrade.", "error");
            return;
        }

        try {
            // Create order on the backend
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                throw new Error(orderData.error || 'Failed to create order');
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "OrbitX AI",
                description: `${planId === 'plus' ? 'Plus' : 'Pro'} Plan Upgrade - Unlock your second brain.`,
                image: `${window.location.origin}/OrbitX%20AI.png`,
                order_id: orderData.id,
                handler: async function (response: any) {
                    try {
                        showToast("Payment processing... please wait.", "info");
                        
                        // Fetch the token directly from cookies
                        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem("token");

                        // Synchronously verify the payment right here on the frontend!
                        // This bypasses the need for webhooks entirely.
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                planId: planId,
                                token: token
                            })
                        });

                        const verifyData = await verifyRes.json();
                        
                        if (verifyRes.ok && verifyData.success) {
                            showToast("Payment verified! Your account is officially upgraded.", "success");
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        } else {
                            throw new Error(verifyData.error || "Verification failed on server");
                        }
                    } catch (err: any) {
                        showToast(`Warning: Payment succeeded but verification failed (${err.message}). Contact support.`, "error");
                    }
                },
                prefill: {
                    name: userName,
                    email: userEmail,
                },
                readonly: {
                    email: true,
                },
                theme: {
                    color: "#3392eaff",
                    backdrop_color: "rgba(18, 18, 26, 0.7)"
                },
                notes: {
                    plan: planId
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                showToast(`Payment failed: ${response.error.description}`, "error");
            });
            rzp.open();
        } catch (error: any) {
            console.error("Upgrade error:", error);
            showToast(error.message || "Failed to initiate payment.", "error");
        }
    };

    return (
        <>
        <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Power Level</span>
                </h1>
                <p className="text-white/60 max-w-2xl mx-auto text-lg">
                    Unlock the full potential of your second brain with our premium features.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
                {/* Free Plan */}
                <Card className={`relative p-8 flex flex-col h-full border-white/10 backdrop-blur-xl transition-all duration-300 group ${subscriptionStatus === 'free' ? 'bg-[#12121A]/80 border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]' : 'bg-[#12121A]/80 hover:border-white/20'}`}>
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

                    <Button
                        variant="outline"
                        className="w-full border-white/20 hover:bg-white/10 text-white"
                        disabled={true}
                    >
                        {subscriptionStatus === 'free' ? 'Current Plan' : 'Basic Plan'}
                    </Button>
                </Card>

                {/* Pro Plan */}
                <Card className={`relative p-8 flex flex-col h-full bg-[#12121A]/90 backdrop-blur-xl transform md:-translate-y-4 transition-all duration-300 ${subscriptionStatus === 'pro' ? 'border-green-500/50 shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]' : 'border-purple-500/50 shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.5)]'}`}>

                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">Pro Plan</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">₹9</span>
                            <span className="text-white/50">/month</span>
                        </div>
                        <p className="text-purple-200/50 mt-4 text-sm">For power users who need more.</p>
                    </div>

                    <div className="flex-grow space-y-4 mb-8">
                        <FeatureItem text="100 MB Storage" highlighted />
                        <FeatureItem text="Get Access of OrbitX AI" special />
                        <FeatureItem text="Priority Email Support" highlighted />
                        <FeatureItem text="Unlimited Note Creation" highlighted />
                        <FeatureItem text="Advanced Search" />
                        <FeatureItem text="Early Access to New Features" />
                    </div>

                    {subscriptionStatus === 'pro' || subscriptionStatus === 'plus' ? (
                        <Button
                            className="w-full bg-green-600/20 text-green-400 border border-green-500/50 cursor-default hover:bg-green-600/20"
                            disabled
                        >
                            <Check size={16} className="mr-2" />
                            {subscriptionStatus === 'pro' ? 'Current Plan' : 'Included in Plus'}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleUpgrade('pro')}
                            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-purple-500/25"
                        >
                            <Zap size={16} className="mr-2 fill-current" />
                            Upgrade to Pro
                        </Button>
                    )}
                </Card>

                {/* Plus Plan (New Premium Tier) */}
                <Card className={`relative p-8 flex flex-col h-full bg-[#12121A]/90 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 backdrop-blur-3xl transform lg:-translate-y-6 transition-all duration-500 hover:-translate-y-8 overflow-visible ${subscriptionStatus === 'plus' ? 'border-amber-500/80 shadow-[0_0_50px_-5px_rgba(245,158,11,0.4)]' : 'border-amber-500/50 shadow-[0_0_50px_-5px_rgba(245,158,11,0.2)] hover:shadow-[0_0_80px_-5px_rgba(245,158,11,0.5)]'}`}>

                    <div className="mb-8 relative">
                        <div className="inline-block mb-2">
                            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500">Plus Plan</h3>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">₹49</span>
                            <span className="text-amber-200/50 font-medium">/month</span>
                        </div>
                        <p className="text-amber-200/60 mt-4 text-sm font-medium">The ultimate experience for power users.</p>
                    </div>

                    <div className="flex-grow space-y-4 mb-8 relative">
                        <FeatureItem text="Everything in Pro & Free" highlighted />
                        <FeatureItem text="Access to Let's Talk" special />
                        <FeatureItem text="500 MB Storage Access" highlighted />
                        <FeatureItem text="More Advanced AI Access" special />
                        <FeatureItem text="Priority 24/7 Support" highlighted />
                        <FeatureItem text="Custom Themes & Export" />
                    </div>

                    {subscriptionStatus === 'plus' ? (
                        <Button
                            className="w-full bg-amber-600/20 text-amber-400 border border-amber-500/50 cursor-default hover:bg-amber-600/20"
                            disabled
                        >
                            <Check size={16} className="mr-2" />
                            Current Plan
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleUpgrade('plus')}
                            className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold border-0 shadow-[0_0_30px_-5px_rgba(245,158,11,0.6)]"
                        >
                            {/* Button Shine Effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                            <Sparkles size={18} className="mr-2" />
                            Upgrade to Plus
                        </Button>
                    )}
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
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </>
    );
}

function FeatureItem({ text, highlighted = false, special = false }: { text: string; highlighted?: boolean; special?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("p-1 rounded-full",
                special ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400" :
                    highlighted ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"
            )}>
                {special ? <Sparkles size={14} className="animate-pulse" /> : <Check size={14} strokeWidth={3} />}
            </div>
            <span className={cn("text-sm",
                special ? "font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400" :
                    highlighted ? "text-white font-medium" : "text-white/70"
            )}>{text}</span>
        </div>
    );
}
