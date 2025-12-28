import React from "react";
import { Shield } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0A0E27] text-white font-sans selection:bg-purple-500/30">
            {/* Admin Header */}
            <header className="border-b border-white/10 bg-[#0A0E27]/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500/20 p-2 rounded-lg">
                            <Shield className="w-5 h-5 text-red-500" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight">OrbitX <span className="text-white/40 font-normal">Admin Console</span></h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60">
                            sumitagedia365@gmail.com
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
