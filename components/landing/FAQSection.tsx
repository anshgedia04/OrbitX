"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const faqs = [
    {
        question: "Is my data really secure?",
        answer: "Yes. OrbitX uses the Web Crypto API for true End-to-End Encryption (E2EE). Your private keys never leave your device, meaning even we cannot read your notes or 'Let's Talk' chat sessions."
    },
    {
        question: "What AI models do you support?",
        answer: "Our 'AI Second Brain' supports multiple advanced models. Depending on your plan, you can seamlessly switch between Gemini 3.1 Pro, Claude Opus 4.8, our custom OrbitX AI, and more directly inside the editor."
    },
    {
        question: "Can I use OrbitX offline?",
        answer: "Absolutely. OrbitX is built with an offline-first architecture. You can create, edit, and organize your notes without an internet connection, and everything will automatically sync to Hyperspace once you're back online."
    },
    {
        question: "How do the storage limits work?",
        answer: "Free accounts get 40MB of storage. Pro gives you 100MB, and Plus unlocks 500MB. Since notes are mostly text, even 40MB can hold thousands of notes. Images and attachments will count towards this limit."
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time through your dashboard. Payments are securely processed via Razorpay."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="max-w-[800px] mx-auto px-6 py-24 border-t border-white/5">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Still have questions?</h2>
                <p className="text-white/50 text-lg">Everything you need to know about OrbitX and how it works.</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                            className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 border ${
                                isOpen 
                                ? 'bg-[#12121A] border-cyan-500/50 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]' 
                                : 'bg-[#12121A]/60 border-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)] hover:-translate-y-0.5'
                            }`}
                        >
                            {/* Accent Line when open */}
                            {isOpen && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                            )}

                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                aria-expanded={isOpen}
                                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-2xl"
                            >
                                <span className={`text-base sm:text-lg transition-colors duration-300 ${isOpen ? 'text-white font-bold' : 'text-white/80 font-medium group-hover:text-white'}`}>
                                    {faq.question}
                                </span>
                                
                                <div className={`ml-4 shrink-0 p-1.5 rounded-full transition-colors duration-300 ${isOpen ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40 group-hover:text-cyan-400 group-hover:bg-cyan-500/10'}`}>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 45 : 0 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        <Plus className="w-5 h-5" />
                                    </motion.div>
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        <div className="px-6 pb-6 text-gray-400 text-sm sm:text-base leading-relaxed pl-6">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
