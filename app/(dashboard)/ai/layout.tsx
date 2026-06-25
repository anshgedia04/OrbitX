import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Note Taking AI & Chat With Notes | OrbitX AI",
    description: "Experience the No 1 note taking app with OrbitX AI. Chat with your notes, organize thoughts instantly, and unlock the ultimate note taking AI assistant.",
    keywords: ["note taking ai", "chat with notes", "note creation for students", "best note taking app for students","note writing for students", "chat with notes", "note taking app", "note taking website", "note taking ai", "best note taking app", "No 1 note taking website", "ai notebook", "smart note taking"],
    alternates: {
        canonical: "https://www.orbitx-notes.in/ai",
    },
    openGraph: {
        title: "Note Taking AI & Chat With Notes | OrbitX AI",
        description: "Chat with your notes and organize your thoughts instantly using the best note taking AI assistant.",
        url: "https://www.orbitx-notes.in/ai",
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
