"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ResetPasswordSchema } from "@/lib/validations";

// Extend schema for confirm password
const ResetFormSchema = ResetPasswordSchema.extend({
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof ResetFormSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormValues>({
        resolver: zodResolver(ResetFormSchema),
        defaultValues: {
            token: token || "",
        },
    });

    const onSubmit = async (data: ResetFormValues) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: data.token,
                    newPassword: data.newPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Reset failed");
            }

            showToast("Password reset successfully!", "success");

            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="w-full text-center p-8">
                <h2 className="text-xl font-bold text-red-400 mb-2">Invalid Link</h2>
                <p className="text-white/60 mb-6">This password reset link is invalid or missing a token.</p>
                <Link href="/forgot-password">
                    <Button variant="secondary">Request New Link</Button>
                </Link>
            </Card>
        );
    }

    return (
        <Card className="w-full border-white/20 shadow-[0_0_50px_rgba(107,70,193,0.2)]">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg shadow-primary/30">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Set New Password
                </h1>
                <p className="text-white/50 text-sm mt-2">
                    Create a strong password for your account
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input type="hidden" {...register("token")} />

                <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    {...register("newPassword")}
                    error={errors.newPassword?.message}
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    error={errors.confirmPassword?.message}
                />

                <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={isLoading}
                >
                    {isLoading ? "Updating..." : "Reset Password"}
                </Button>
            </form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
