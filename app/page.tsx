import Link from 'next/link';
import { FileText, Shield, Zap, Rocket } from 'lucide-react';
import { StarBackground } from '@/components/ui/StarBackground';

export default function LandingPage() {
    return (
        <div className="min-h-screen text-white selection:bg-purple-500/30 font-sans overflow-hidden relative">
       
            <StarBackground />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">OrbitX</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-32 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-purple-400 mb-4 animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        Now available for everyone
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight">
                        Capture thoughts in <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-600">hyperspace</span>
                    </h1>

                    <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        The minimal, lightning-fast note taking app designed for focus.
                        Secure, synchronized, and beautifully dark.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href="/signup"
                            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-200"
                        >
                            Get Started for Free
                        </Link>
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl font-bold text-white hover:bg-white/10 transition-all duration-200"
                        >
                            Live Demo
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Zap className="w-6 h-6 text-yellow-400" />,
                            title: "Lightning Fast",
                            desc: "Built for speed with instant sync and offline capabilities."
                        },
                        {
                            icon: <Shield className="w-6 h-6 text-green-400" />,
                            title: "Secure by Design",
                            desc: "End-to-end encryption keeps your thoughts private and safe."
                        },
                        {
                            icon: <FileText className="w-6 h-6 text-blue-400" />,
                            title: "Markdown Support",
                            desc: "Write beautifully with full Markdown support and code highlighting."
                        }
                    ].map((feature, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-white/60">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black py-12 mt-20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-white/40 text-sm">
                        © {new Date().getFullYear()} OrbitX Notes. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-white/60">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
