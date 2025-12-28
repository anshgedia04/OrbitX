"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ForgotPasswordSchema } from "@/lib/validations";

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(ForgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to send reset link");

            setIsSent(true);
            showToast("Reset link sent to your email", "success");
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full border-white/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary mb-4 shadow-lg shadow-accent/30">
                    <KeyRound className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Reset Password
                </h1>
                <p className="text-white/50 text-sm mt-2">
                    We'll send you a link to reset your password
                </p>
            </div>

            {!isSent ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="john@example.com"
                        {...register("email")}
                        error={errors.email?.message}
                    />

                    <Button
                        type="submit"
                        className="w-full mt-6"
                        disabled={isLoading}
                        variant="primary"
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                </form>
            ) : (
                <div className="text-center space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-200 text-sm">
                        Check your email for the reset link. It may take a few minutes to arrive.
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setIsSent(false)}
                    >
                        Try another email
                    </Button>
                </div>
            )}

            <div className="mt-6 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={14} />
                    Back to Login
                </Link>
            </div>
        </Card>
    );
}
