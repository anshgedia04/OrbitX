import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Shield, Zap, Rocket } from 'lucide-react';
import { StarBackground } from '@/components/ui/StarBackground';

export const metadata: Metadata = {
    title: "OrbitX Notes - Hyperspace Productivity",
    description: "The minimal, lightning-fast note taking app designed for focus. Secure, synchronized, and beautifully dark.",
    alternates: {
        canonical: "https://www.orbitx-notes.in",
    },
    openGraph: {
        title: "OrbitX Notes - Hyperspace Productivity",
        description: "The minimal, lightning-fast note taking app designed for focus.",
        url: "https://www.orbitx-notes.in",
        siteName: "OrbitX Notes",
        images: [
            {
                url: "https://www.orbitx-notes.in/OrbitX%20AI.png",
                width: 1200,
                height: 630,
                alt: "OrbitX Notes Dashboard",
            }
        ],
        type: "website",
    }
};

import LandingClient from '@/components/landing/LandingClient';

export default function LandingPage() {
    return <LandingClient />;
}
