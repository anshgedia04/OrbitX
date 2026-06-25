import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Shield, Zap, Rocket } from 'lucide-react';
import { StarBackground } from '@/components/ui/StarBackground';

export const metadata: Metadata = {
    title: "OrbitX Notes - No 1 Note Taking App & Note Taking AI",
    description: "OrbitX is the best note taking app and website. Capture your thoughts instantly, organize with ease, and chat with your notes using our powerful AI assistant.",
    keywords: ["No 1 note taking app", "note creation for students", "best note taking app for students","note writing for students", "chat with notes", "note taking app", "note taking website", "note taking ai", "best note taking app", "best note taking website", "note taking", "note taking ai", "chat with notes", "OrbitX Notes"],
    alternates: {
        canonical: "https://www.orbitx-notes.in",
    },
    openGraph: {
        title: "OrbitX Notes - No 1 Note Taking App",
        description: "OrbitX is the best note taking app and website. Capture your thoughts and chat with your notes using our powerful AI.",
        url: "https://www.orbitx-notes.in",
        siteName: "OrbitX Notes",
        images: [
            {
                url: "https://www.orbitx-notes.in/OrbitX%20AI.png",
                width: 1200,
                height: 630,
                alt: "OrbitX Notes Dashboard - The best note taking app",
            }
        ],
        type: "website",
    }
};

import LandingClient from '@/components/landing/LandingClient';

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

export default function LandingPage() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <LandingClient />
        </>
    );
}
