"use client";

import React from 'react';
import Image from 'next/image';
import companyLogo from '@/public/companyLogo.png';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Rocket, Sparkles, Shield, Cpu, Lock, FileText, ChevronRight, Check, Zap, Server, ChevronDown } from 'lucide-react';
import { StarBackground } from '@/components/ui/StarBackground';
import { FAQSection } from '@/components/landing/FAQSection';
import ReviewCards from '@/components/landing/ReviewCards'

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
};

const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.1 }
};

function TypewriterText({ text, showCursor = true, speed = 40, onComplete }: { text: string, showCursor?: boolean, speed?: number, onComplete?: () => void }) {
    const [currentText, setCurrentText] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(true);
    
    React.useEffect(() => {
        setCurrentText("");
        setIsTyping(true);
        let currentIndex = 0;
        let timeout: NodeJS.Timeout;

        const startTyping = () => {
            if (currentIndex < text.length) {
                setCurrentText(text.slice(0, currentIndex + 1));
                currentIndex++;
                timeout = setTimeout(startTyping, speed + Math.random() * 20); // natural typing speed
            } else {
                setIsTyping(false);
                if (onComplete) onComplete();
            }
        };

        timeout = setTimeout(startTyping, 100);
        return () => clearTimeout(timeout);
    }, [text]); // re-run if text changes, but we'll use a key to remount

    return (
        <span>
            {currentText}
            {(isTyping || showCursor) && <span className="animate-pulse text-purple-400 font-bold ml-1">|</span>}
        </span>
    );
}

function MockupAnimation() {
    const [step, setStep] = React.useState(-5);

    React.useEffect(() => {
        let t: NodeJS.Timeout;
        if (step === -5) t = setTimeout(() => setStep(-4), 500);
        else if (step === -4) t = setTimeout(() => setStep(-3), 800);
        else if (step === -3) t = setTimeout(() => setStep(-2), 400);
        else if (step === -2) t = setTimeout(() => setStep(-1), 800);
        else if (step === -1) t = setTimeout(() => setStep(0), 600);
        else if (step === 6) t = setTimeout(() => setStep(-5), 5000);
        return () => clearTimeout(t);
    }, [step]);

    return (
        <div className="relative rounded-xl border border-white/10 bg-[#0a0a0f] overflow-hidden shadow-2xl shadow-purple-500/10 backdrop-blur-xl aspect-[16/10] sm:aspect-video flex flex-col font-sans">
            {/* Mockup Topbar */}
            <div className="h-12 border-b border-white/5 bg-[#0f111a] flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-2 w-20">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-md border border-white/5 text-[11px] text-white/40 font-medium tracking-wide">
                        <Lock className="w-3 h-3" /> end-to-end encrypted
                    </div>
                </div>
                <div className="w-20" /> {/* Balancer */}
            </div>
            
            {/* Mockup Content */}
            <div className="flex flex-1 overflow-hidden text-sm bg-[#12121A]">
                {/* Sidebar */}
                <div className="w-48 border-r border-white/5 bg-[#0f111a] p-4 space-y-1 hidden md:block shrink-0">
                    <div className="text-white/40 font-bold mb-4 text-[10px] tracking-widest px-2">WORKSPACE</div>
                    <div className="flex items-center gap-3 text-white/90 bg-white/5 px-2 py-2 rounded-lg border border-white/5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 fill-blue-400/20"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                        <span className="font-medium text-sm">Personal</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/50 px-2 py-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                        <span className="font-medium text-sm">Work Projects</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/50 px-2 py-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                        <span className="font-medium text-sm">Ideas</span>
                    </div>
                </div>
                
                {/* Main Editor (Chat UI) */}
                <div className="flex-1 p-6 sm:p-10 relative overflow-hidden flex flex-col bg-[#12121A]">
                    <div className="flex-1 flex flex-col justify-end space-y-6 overflow-hidden pb-4">
                        {/* User Q1 */}
                        {step >= 0 && (
                            <div className="bg-white/5 self-end px-4 py-3 rounded-2xl rounded-tr-sm text-white max-w-[85%] sm:max-w-[75%] border border-white/5 shadow-lg shadow-black/20">
                                <TypewriterText key="u1" text="What is the core protocol?" speed={20} showCursor={step === 0} onComplete={() => setStep(1)} />
                            </div>
                        )}
                        
                        {/* AI A1 */}
                        {step >= 1 && (
                            <div className="bg-purple-500/10 self-start px-4 py-3 rounded-2xl rounded-tl-sm text-purple-100 max-w-[90%] sm:max-w-[85%] border border-purple-500/20 shadow-xl shadow-purple-500/5">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-[11px] font-bold text-purple-300">OrbitX AI</span>
                                </div>
                                <div className="leading-relaxed text-xs">
                                    <TypewriterText key="a1" text="The core protocol is Orbit Sync v2.0. It enables seamless end-to-end encrypted transfers across all your connected nodes in real-time." speed={25} showCursor={step === 1} onComplete={() => setTimeout(() => setStep(2), 600)} />
                                </div>
                            </div>
                        )}
                        
                        {/* User Q2 */}
                        {step >= 2 && (
                            <div className="bg-white/5 self-end px-4 py-3 rounded-2xl rounded-tr-sm text-white max-w-[85%] sm:max-w-[75%] border border-white/5 shadow-lg shadow-black/20">
                                <TypewriterText key="u2" text="Can you write a JS snippet for it?" speed={20} showCursor={step === 2} onComplete={() => setStep(3)} />
                            </div>
                        )}
                        
                        {/* AI A2 */}
                        {step >= 3 && (
                            <div className="bg-[#1a1b26] self-start px-4 py-3 rounded-2xl rounded-tl-sm text-purple-100 max-w-[95%] sm:max-w-[85%] border border-white/10 shadow-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                                <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-1.5 font-sans">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-[11px] font-bold text-purple-300">OrbitX AI</span>
                                    </div>
                                    <span className="text-[9px] text-white/40 uppercase tracking-widest">typescript</span>
                                </div>
                                <TypewriterText key="a2" text={"const sync = new OrbitSync({\n  secure: true,\n  nodes: 'auto'\n});\nawait sync.init();"} speed={25} showCursor={step === 3} onComplete={() => setTimeout(() => setStep(4), 600)} />
                            </div>
                        )}

                        {/* User Q3 */}
                        {step >= 4 && (
                            <div className="bg-white/5 self-end px-4 py-3 rounded-2xl rounded-tr-sm text-white max-w-[85%] sm:max-w-[75%] border border-white/5 shadow-lg shadow-black/20">
                                <TypewriterText key="u3" text="Awesome! Does it work offline?" speed={20} showCursor={step === 4} onComplete={() => setStep(5)} />
                            </div>
                        )}
                        
                        {/* AI A3 */}
                        {step >= 5 && (
                            <div className="bg-purple-500/10 self-start px-4 py-3 rounded-2xl rounded-tl-sm text-purple-100 max-w-[90%] sm:max-w-[85%] border border-purple-500/20 shadow-xl shadow-purple-500/5">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-[11px] font-bold text-purple-300">OrbitX AI</span>
                                </div>
                                <div className="leading-relaxed text-xs">
                                    <TypewriterText key="a3" text="Yes! OrbitX includes a powerful offline-first architecture. All changes sync automatically when connectivity is restored." speed={25} showCursor={step === 5} onComplete={() => setStep(6)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Model Selector Button & Dropdown */}
                    <div className="absolute bottom-4 right-4 z-20">
                        <AnimatePresence>
                            {step >= -3 && step < -1 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-2 right-0 w-48 bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1.5"
                                >
                                    {['Claude Opus 4.8', 'Gemini 3.1 Pro', 'OrbitX AI', 'Kimi 2.7'].map((model) => (
                                        <div 
                                            key={model} 
                                            className={`px-4 py-2.5 text-[13px] text-white/70 hover:bg-white/5 cursor-pointer flex items-center justify-between ${model === 'Gemini 3.1 Pro' && step >= -2 ? "bg-white/10 text-white" : ""}`}
                                        >
                                            {model}
                                            {model === 'Gemini 3.1 Pro' && step === -1 && <Check className="w-4 h-4 text-purple-400" />}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button aria-label="Select AI Model" className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#1a1b26] border border-white/10 text-[13px] font-medium text-white/90 hover:bg-white/10 transition-colors shadow-lg">
                            <Cpu className="w-4 h-4 text-purple-400" />
                            {step >= -1 ? "Gemini 3.1 Pro" : "OrbitX AI"}
                            <ChevronDown className="w-4 h-4 opacity-50" />
                        </button>
                    </div>

                    {/* Fake Cursor Animation */}
                    <motion.div
                        className="absolute z-50 pointer-events-none"
                        animate={{
                            right: step <= -5 ? -40 : step === -4 || step === -3 ? 24 : step === -2 || step === -1 ? 40 : -40,
                            bottom: step <= -5 ? -40 : step === -4 || step === -3 ? 24 : step === -2 || step === -1 ? 95 : -40,
                            opacity: step <= -5 || step >= 0 ? 0 : 1,
                            scale: step === -3 || step === -1 ? 0.8 : 1
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 150,
                            damping: 20,
                            scale: { duration: 0.1 }
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg text-white">
                            <path d="M4 4l5.9 14.8c.2.5.9.6 1.3.1l2.8-3.9c.1-.2.3-.3.5-.3l4.6 1.4c.5.1 1-.3.9-.9L4 4z" fill="currentColor" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                        </svg>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default function LandingClient() {
    return (
        <div className="min-h-screen text-white selection:bg-purple-500/30 font-sans overflow-hidden relative">
            <StarBackground />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <Image src={companyLogo} alt="OrbitX Logo" priority className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">OrbitX</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Log in
                        </Link>
                        <Link href="/signup" className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-gray-100 hover:scale-105 transition-all">
                            Sign up free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-40 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-sm text-purple-300 font-medium mb-6"
                    >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                         V2.0.1 is available for everyone
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter"
                    >
                        Your thoughts,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                            supercharged by AI.
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed font-light"
                    >
                        OrbitX is the ultimate secure second brain. End-to-end encrypted notes, real-time AI contextual chats, and lightning-fast markdown editing.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
                    >
                        <Link href="/signup" className="group relative w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                            Get Started
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all text-white">
                            View Live Demo
                        </Link>
                    </motion.div>
                </div>
            </main>

            {/* Dashboard Mockup Showcase */}
            <motion.section 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-6xl mx-auto px-6 mb-32"
            >
                <MockupAnimation />
            </motion.section>

            {/* Features Bento Grid */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need to think better.</h2>
                    <p className="text-white/50 text-lg">Powerful features built right in, securely and beautifully.</p>
                </div>

                <motion.div 
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="whileInView"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {/* Feature 1: AI */}
                    <motion.div variants={fadeInUp} className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full group-hover:bg-purple-500/30 transition-all" />
                        <Cpu className="w-10 h-10 text-purple-400 mb-6" />
                        <h3 className="text-2xl font-bold mb-3">AI Second Brain</h3>
                        <p className="text-white/60 text-lg max-w-md">Process your notes with advanced AI models like Gemini Pro, Llama 3, and Claude. Ask questions, generate summaries, and brainstorm directly within your workspace.</p>
                    </motion.div>

                    {/* Feature 2: E2EE Chat */}
                    <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10">
                        <Shield className="w-10 h-10 text-green-400 mb-6" />
                        <h3 className="text-2xl font-bold mb-3">Secure "Let's Talk"</h3>
                        <p className="text-white/60">Real-time E2EE chat with your friends and AI. Your conversations are encrypted and fully private.</p>
                    </motion.div>

                    {/* Feature 3: Markdown */}
                    <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10">
                        <FileText className="w-10 h-10 text-blue-400 mb-6" />
                        <h3 className="text-2xl font-bold mb-3">Rich Editor</h3>
                        <p className="text-white/60">Full Markdown support with live previews, KaTeX math rendering, and advanced code highlighting.</p>
                    </motion.div>

                    {/* Feature 4: Sync & Storage */}
                    <motion.div variants={fadeInUp} className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all" />
                        <Server className="w-10 h-10 text-blue-400 mb-6" />
                        <h3 className="text-2xl font-bold mb-3">Hyperspace Sync</h3>
                        <p className="text-white/60 text-lg max-w-md">Enjoy up to 500MB of storage with our Plus plan. Your notes sync instantly across all devices so you never miss a beat.</p>
                    </motion.div>
                </motion.div>
            </section>

            {/* Pricing Preview Section */}
            <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Choose your hyperspace.</h2>
                    <p className="text-white/50 text-lg">Simple, transparent pricing for everyone.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Free Plan */}
                    <div className="p-8 rounded-3xl border border-white/10 bg-white/5 flex flex-col">
                        <h3 className="text-xl font-bold mb-2">Free</h3>
                        <p className="text-4xl font-black mb-6">₹0<span className="text-lg text-white/40 font-normal">/mo</span></p>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-white/70">
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-400" /> 40MB Storage</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-400" /> Basic Markdown Editor</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-400" /> Standard Support</li>
                        </ul>
                        <Link href="/signup" className="w-full py-3 text-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Get Free</Link>
                    </div>

                    {/* Plus Plan */}
                    <div className="p-8 rounded-3xl border border-purple-500/30 bg-purple-500/5 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-purple-500/10">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-xs font-bold tracking-wider">RECOMMENDED</div>
                        <h3 className="text-xl font-bold mb-2 text-purple-300">Plus Plan</h3>
                        <p className="text-4xl font-black mb-6">₹49<span className="text-lg text-white/40 font-normal">/mo</span></p>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-white/80">
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /> 500MB Storage Capacity</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /> AI Note Processing</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /> Access to "Let's Talk" E2EE Chat</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /> OrbitX AI Chatbot</li>
                        </ul>
                        <Link href="/signup" className="w-full py-3 text-center rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 hover:opacity-90 transition-opacity font-bold shadow-lg shadow-purple-500/25">Upgrade to Plus</Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-8 rounded-3xl border border-white/10 bg-white/5 flex flex-col">
                        <h3 className="text-xl font-bold mb-2">Pro Plan</h3>
                        <p className="text-4xl font-black mb-6">₹19<span className="text-lg text-white/40 font-normal">/mo</span></p>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-white/70">
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" /> 100MB Storage</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" /> AI Note Processing</li>
                            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" /> OrbitX AI Chatbot</li>
                            <li className="flex items-center gap-3 opacity-50"><Lock className="w-4 h-4" /> No E2EE Let's Talk Chat</li>
                        </ul>
                        <Link href="/signup" className="w-full py-3 text-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Get Pro</Link>
                    </div>
                </div>
            </section>

            {/* Review section */}
            <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Loved by Students across India.</h2>
                    <p className="text-white/50 text-lg">See why students, developers, and researchers trust OrbitX as their second brain.</p>
                </div>
                <ReviewCards/>
            </section>

            {/* FAQ Section */}
            <FAQSection />

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black/50 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-400" />
                        <span className="font-bold text-lg tracking-tight">OrbitX</span>
                    </div>
                    <p className="text-white/40 text-sm">
                        © {new Date().getFullYear()} OrbitX Notes. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-white/50">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
