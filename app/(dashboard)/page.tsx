"use client";

import React, { useState, useEffect } from "react";
import { FileText, Folder, Flame, Calendar, Pin, Clock } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { NotesChart } from "@/components/dashboard/NotesChart";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useUIStore } from "@/store/use-ui-store";
import { cn } from "@/lib/utils";

import { formatDistanceToNow } from "date-fns";

// ... imports

// ... imports

export default function DashboardPage() {
    const { storageUsage } = useUIStore();
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]); // Dynamic data
    const [stats, setStats] = useState({
        totalNotes: 0,
        totalFolders: 0,
        favorites: 0,
        recentNotes: [] as any[]
    });
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [notesRes, foldersRes, activitiesRes, statsRes] = await Promise.all([
                    fetch("/api/notes?limit=5"),
                    fetch("/api/folders"),
                    fetch("/api/activities"),
                    fetch("/api/notes/stats")
                ]);

                const notesData = await notesRes.json();
                const foldersData = await foldersRes.json();
                const activitiesData = await activitiesRes.json();
                const statsData = await statsRes.json();

                setStats({
                    totalNotes: notesData.pagination?.total || 0,
                    totalFolders: foldersData.length || 0,
                    favorites: notesData.notes.filter((n: any) => n.isFavorite).length, // Approximation
                    recentNotes: notesData.notes || []
                });

                // Set chart data (default to empty array if fetch fails or is empty)
                if (Array.isArray(statsData)) {
                    setChartData(statsData);
                }

                // Format activities for the UI
                const formattedActivities = Array.isArray(activitiesData) ? activitiesData.map((act: any) => ({
                    id: act._id,
                    type: act.type,
                    target: act.targetTitle,
                    targetType: act.targetType,
                    timestamp: formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })
                })) : [];

                setActivities(formattedActivities);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    const statsData = [
        { label: "Total Notes", value: stats.totalNotes, icon: <FileText size={24} />, trend: { value: 12, isPositive: true }, color: "bg-primary" },
        { label: "Total Folders", value: stats.totalFolders, icon: <Folder size={24} />, trend: { value: 2, isPositive: true }, color: "bg-secondary" },
        { label: "Favorites", value: stats.favorites, icon: <Flame size={24} />, trend: { value: 1, isPositive: true }, color: "bg-orange-500" },
        { label: "This Month", value: stats.recentNotes.length, icon: <Calendar size={24} />, trend: { value: 5, isPositive: false }, color: "bg-accent" },
    ];

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-white/50">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                    <StatsCard key={index} {...stat} delay={index * 0.1} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Section */}
                <div className="lg:col-span-2 space-y-6">
                    <NotesChart data={chartData} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recent Notes (Quick Access) */}
                        <Card className="h-full">
                            <h3 className="font-bold text-lg mb-4 text-white">Recent Notes</h3>
                            <div className="space-y-3">
                                {stats.recentNotes.length > 0 ? (
                                    stats.recentNotes.map((note) => (
                                        <div key={note._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${note.isFavorite ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary'}`}>
                                                    {note.isFavorite ? <Pin size={16} /> : <FileText size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white group-hover:text-accent transition-colors truncate max-w-[150px]">{note.title}</p>
                                                    <p className="text-xs text-white/40">{new Date(note.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-white/50 text-sm">No recent notes</p>
                                )}
                            </div>
                        </Card>

                        {/* Recent Activity */}
                        <ActivityTimeline activities={activities} />
                    </div>
                </div>

                {/* Right Sidebar / Suggestions */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/20">
                        <h3 className="font-bold text-lg mb-2 text-white">Pro Tip</h3>
                        <p className="text-sm text-white/70 mb-4">
                            Use <kbd className="bg-black/30 px-1.5 py-0.5 rounded text-xs">Cmd + K</kbd> to quickly search for notes and folders.
                        </p>
                        <Button size="sm" variant="secondary" className="w-full">View Shortcuts</Button>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-lg mb-4 text-white">Storage</h3>
                        <div className="relative w-40 h-40 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/10" />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="transparent"
                                    strokeDasharray="440"
                                    strokeDashoffset={440 - (440 * Math.min((storageUsage.used / storageUsage.limit), 1))}
                                    className={cn("transition-all duration-1000 ease-out", (storageUsage.used / storageUsage.limit) > 0.9 ? "text-red-500" : "text-primary")}
                                />
                            </svg>
                            <div className="absolute text-center">
                                <span className="text-3xl font-bold text-white">{Math.round((storageUsage.used / storageUsage.limit) * 100)}%</span>
                                <p className="text-xs text-white/50">Used</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-white/70">
                                {((storageUsage.used / (1024 * 1024)).toFixed(1))} MB of {((storageUsage.limit / (1024 * 1024)).toFixed(0))} MB used
                            </p>
                            <Link href="/subscription" className="block mt-2">
                                <Button variant="ghost" size="sm" className="w-full text-accent hover:text-accent hover:bg-accent/10">Upgrade Plan</Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 pb-8 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-10 w-48 bg-white/10 rounded-lg" />
                <div className="h-6 w-32 bg-white/10 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[300px] bg-white/5 rounded-xl border border-white/10" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-64 bg-white/5 rounded-xl border border-white/10" />
                        <div className="h-64 bg-white/5 rounded-xl border border-white/10" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="h-40 bg-white/5 rounded-xl border border-white/10" />
                    <div className="h-64 bg-white/5 rounded-xl border border-white/10" />
                </div>
            </div>
        </div>
    );
}
