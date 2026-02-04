"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Github } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { LoginSchema } from "@/lib/validations";

type LoginFormValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(LoginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = Array.isArray(result.error)
                    ? result.error.map((e: any) => e.message).join(", ")
                    : result.error || "Login failed";
                throw new Error(errorMessage);
            }

            showToast("Welcome back!", "success");

            localStorage.setItem("token", result.token);
            localStorage.setItem("refreshToken", result.refreshToken);

            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full border-white/20 shadow-[0_0_50px_rgba(66,153,225,0.2)]">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary mb-4 shadow-lg shadow-secondary/30">
                    <LogIn className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Welcome Back
                </h1>
                <p className="text-white/50 text-sm mt-2">
                    Enter your coordinates to continue
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-white/60 hover:text-white transition-colors">
                            <input type="checkbox" className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary" />
                            Remember me
                        </label>
                        <Link href="/forgot-password" className="text-accent hover:text-accent/80 transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={isLoading}
                    variant="secondary"
                >
                    {isLoading ? "Authenticating..." : "Log In"}
                </Button>
            </form>

            <div className="my-6 flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-xs text-white/30 uppercase font-medium">Or continue with</span>
                <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    className="w-full"
                    leftIcon={<FcGoogle size={18} />}
                    onClick={() => window.location.href = "/api/auth/google"}
                >
                    Google
                </Button>
            </div>


            <div className="mt-6 text-center text-sm text-white/50">
                Don't have an account?{" "}
                <Link href="/signup" className="text-accent hover:text-accent/80 transition-colors font-medium">
                    Sign up
                </Link>
            </div>
        </Card>
    );
}
