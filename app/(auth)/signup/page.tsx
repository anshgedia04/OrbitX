"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Rocket, Check, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { SignUpSchema } from "@/lib/validations";

// Extend schema for confirm password
const SignupFormSchema = SignUpSchema.extend({
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof SignupFormSchema>;

export default function SignupPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(SignupFormSchema),
    });

    const password = watch("password");

    React.useEffect(() => {
        if (!password) {
            setPasswordStrength(0);
            return;
        }
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        setPasswordStrength(strength);
    }, [password]);

    const onSubmit = async (data: SignupFormValues) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle Zod issues array or simple error string
                const errorMessage = Array.isArray(result.error)
                    ? result.error.map((e: any) => e.message).join(", ")
                    : result.error || "Signup failed";
                throw new Error(errorMessage);
            }

            showToast("Account created successfully! Redirecting...", "success");

            // Store token (in real app, maybe use a context or cookie)
            localStorage.setItem("token", result.token);
            localStorage.setItem("refreshToken", result.refreshToken);

            setTimeout(() => {
                router.push("/");
            }, 1500);
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full border-white/20 shadow-[0_0_50px_rgba(107,70,193,0.2)]">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg shadow-primary/30">
                    <Rocket className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Join the Mission
                </h1>
                <p className="text-white/50 text-sm mt-2">
                    Start your journey with OrbitX Notes
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Full Name"
                    placeholder="John Doe"
                    {...register("name")}
                    error={errors.name?.message}
                />

                <Input
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("email")}
                    error={errors.email?.message}
                />

                <div className="space-y-2">
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        {...register("password")}
                        error={errors.password?.message}
                    />
                    {/* Strength Indicator */}
                    {password && (
                        <div className="space-y-1">
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${passwordStrength}%` }}
                                    className={`h-full transition-colors duration-300 ${passwordStrength <= 25 ? "bg-red-500" :
                                        passwordStrength <= 50 ? "bg-orange-500" :
                                            passwordStrength <= 75 ? "bg-yellow-500" : "bg-green-500"
                                        }`}
                                />
                            </div>
                            <p className="text-xs text-right text-white/40">
                                {passwordStrength <= 25 ? "Weak" :
                                    passwordStrength <= 50 ? "Fair" :
                                        passwordStrength <= 75 ? "Good" : "Strong"}
                            </p>
                        </div>
                    )}
                </div>

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
                    showRocket
                >
                    {isLoading ? "Launching..." : "Create Account"}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-white/50">
                Already have an account?{" "}
                <Link href="/login" className="text-accent hover:text-accent/80 transition-colors font-medium">
                    Log in
                </Link>
            </div>
        </Card>
    );
}
