import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | Best Note Taking App | OrbitX Notes",
    description: "Join the No 1 note taking app today. Create your free OrbitX Notes account to capture ideas, organize thoughts, and access our cutting-edge note taking AI.",
    keywords: ["OrbitX signup", "note creation for students", "best note taking app for students","note writing for students", "chat with notes", "note taking app", "note taking website", "note taking ai", "create notes account", "best note taking app registration", "No 1 note taking app", "free note taking website", "smart notes signup"],
    alternates: {
        canonical: "https://www.orbitx-notes.in/signup",
    },
    openGraph: {
        title: "Sign Up | Best Note Taking App | OrbitX",
        description: "Join the No 1 note taking app today and start organizing your thoughts.",
        url: "https://www.orbitx-notes.in/signup",
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
