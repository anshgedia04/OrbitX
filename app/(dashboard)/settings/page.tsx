"use client";

import React, { useState, useEffect } from "react";
import { User, Settings, Shield, HardDrive, Save, LogOut, Trash2, Download, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "account" | "security">("profile");
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [profileForm, setProfileForm] = useState({ name: "", email: "", avatar: "" });
    const [preferencesForm, setPreferencesForm] = useState({
        theme: "system",
        autoSave: true,
        autoSaveInterval: 30,
        defaultView: "grid"
    });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || "",
                email: user.email || "",
                avatar: user.avatar || ""
            });
            if (user.preferences) {
                setPreferencesForm({
                    theme: user.preferences.theme || "system",
                    autoSave: user.preferences.autoSave ?? true,
                    autoSaveInterval: user.preferences.autoSaveInterval || 30,
                    defaultView: user.preferences.defaultView || "grid"
                });
            }
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileForm),
            });
            if (!response.ok) throw new Error("Failed to update profile");
            showToast("Profile updated successfully", "success");
            // Ideally refresh user context here
        } catch (error) {
            showToast("Failed to update profile", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreferencesUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch("/api/user/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preferencesForm),
            });
            if (!response.ok) throw new Error("Failed to update preferences");
            showToast("Preferences saved", "success");
        } catch (error) {
            showToast("Failed to update preferences", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch("/api/user/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "change_password", ...passwordForm }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to change password");

            showToast("Password changed successfully", "success");
            setPasswordForm({ currentPassword: "", newPassword: "" });
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoutAll = async () => {
        if (!confirm("Are you sure you want to log out from all devices?")) return;
        setIsLoading(true);
        try {
            await fetch("/api/user/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "logout_all" }),
            });
            logout();
            router.push("/login");
        } catch (error) {
            showToast("Failed to logout", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            const response = await fetch("/api/user/account");
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `orbitx-export-${new Date().toISOString()}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast("Data exported successfully", "success");
        } catch (error) {
            showToast("Failed to export data", "error");
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = prompt("Type 'DELETE' to confirm account deletion. This action is irreversible.");
        if (confirmed !== "DELETE") return;

        setIsLoading(true);
        try {
            await fetch("/api/user/account", { method: "DELETE" });
            logout();
            router.push("/signup");
            showToast("Account deleted", "success");
        } catch (error) {
            showToast("Failed to delete account", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "preferences", label: "Preferences", icon: Settings },
        { id: "security", label: "Security", icon: Shield },
        { id: "account", label: "Account", icon: HardDrive },
    ] as const;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                                    ? "bg-primary text-white"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                    {activeTab === "profile" && (
                        <form onSubmit={handleProfileUpdate} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                                    {profileForm.name.charAt(0).toUpperCase()}
                                </div>
                                <Button type="button" variant="secondary" size="sm">Change Avatar</Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-end">
                                <Button type="submit" disabled={isLoading} leftIcon={<Save size={16} />}>
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {activeTab === "preferences" && (
                        <form onSubmit={handlePreferencesUpdate} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-semibold text-white mb-4">App Preferences</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm text-white/60 mb-3">Theme</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { value: "light", label: "Light", icon: Sun },
                                            { value: "dark", label: "Dark", icon: Moon },
                                            { value: "system", label: "System", icon: Monitor },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setPreferencesForm({ ...preferencesForm, theme: option.value })}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${preferencesForm.theme === option.value
                                                        ? "bg-primary/20 border-primary text-white"
                                                        : "bg-black/20 border-white/10 text-white/60 hover:bg-white/5"
                                                    }`}
                                            >
                                                <option.icon size={24} />
                                                <span className="text-sm">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Default View</label>
                                    <select
                                        value={preferencesForm.defaultView}
                                        onChange={(e) => setPreferencesForm({ ...preferencesForm, defaultView: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="grid">Grid View</option>
                                        <option value="list">List View</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
                                    <div>
                                        <h3 className="font-medium text-white">Auto-save</h3>
                                        <p className="text-xs text-white/50">Automatically save changes while editing</p>
                                    </div>
                                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="absolute w-6 h-6 opacity-0 cursor-pointer"
                                            checked={preferencesForm.autoSave}
                                            onChange={(e) => setPreferencesForm({ ...preferencesForm, autoSave: e.target.checked })}
                                        />
                                        <div className={`block w-12 h-6 rounded-full transition-colors ${preferencesForm.autoSave ? "bg-primary" : "bg-white/20"}`} />
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferencesForm.autoSave ? "translate-x-6" : "translate-x-0"}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-end">
                                <Button type="submit" disabled={isLoading} leftIcon={<Save size={16} />}>
                                    {isLoading ? "Saving..." : "Save Preferences"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <Button type="submit" disabled={isLoading} variant="secondary">Update Password</Button>
                                </form>
                            </div>

                            <div className="pt-8 border-t border-white/10">
                                <h2 className="text-xl font-semibold text-white mb-4">Session Management</h2>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-white">Active Sessions</h3>
                                        <p className="text-sm text-white/50">Log out from all other devices</p>
                                    </div>
                                    <Button onClick={handleLogoutAll} variant="secondary" leftIcon={<LogOut size={16} />}>
                                        Logout All
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "account" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-4">Data Management</h2>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium text-white">Export Data</h3>
                                        <p className="text-sm text-white/50">Download a copy of all your notes and folders</p>
                                    </div>
                                    <Button onClick={handleExportData} variant="secondary" leftIcon={<Download size={16} />}>
                                        Export JSON
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/10">
                                <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
                                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-red-400">Delete Account</h3>
                                        <p className="text-sm text-red-400/60">Permanently delete your account and all data</p>
                                    </div>
                                    <Button onClick={handleDeleteAccount} variant="danger" leftIcon={<Trash2 size={16} />}>
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
