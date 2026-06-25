import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Notes | No 1 Note Taking App | OrbitX Notes",
    description: "Start writing in the best note taking app. Capture your ideas instantly with our distraction-free, AI-powered note taking website.",
    keywords: ["No 1 note taking app", "note creation for students", "best note taking app for students","note writing for students", "chat with notes", "note taking app", "note taking website", "note taking ai", "best note taking website", "note taking", "create notes online", "fast note taking"],
    alternates: {
        canonical: "https://www.orbitx-notes.in/notes/new",
    },
    openGraph: {
        title: "Create Notes | No 1 Note Taking App | OrbitX",
        description: "Capture your ideas instantly with our distraction-free, AI-powered note taking website.",
        url: "https://www.orbitx-notes.in/notes/new",
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
