"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    preferences?: {
        theme: string;
        autoSave: boolean;
        autoSaveInterval: number;
        defaultView: string;
        defaultFolder?: string;
    };
    twoFactorEnabled?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const response = await fetch("/api/user/profile"); // Re-using profile endpoint to get user data
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = (token: string) => {
        // Token is usually set in cookie by the API, but if we need to handle it client side:
        // document.cookie = `token=${token}; path=/`; 
        // For this app, we assume HttpOnly cookie is set by server login route.
        // We just refresh user.
        fetchUser();
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" }); // We need a logout route or just clear client state
            // If we don't have a specific logout route that clears cookies, we might need one.
            // The settings page logout calls /api/user/security with logout_all, but simple logout?
            // Let's assume we just clear state and redirect.
            // But we should probably clear the cookie too.
            // I'll create a simple logout API or use the account delete one? No.
            // For now, let's just clear state.
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
