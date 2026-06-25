import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | No 1 Note Taking App | OrbitX Notes",
    description: "Log in to OrbitX Notes, the No 1 note taking app. Access your secure workspace, chat with your notes, and supercharge your productivity.",
    keywords: ["OrbitX login", "note creation for students", "best note taking app for students","note writing for students", "chat with notes", "note taking app", "note taking website", "note taking ai", "note taking app login", "access notes", "best note taking website", "No 1 note app", "secure notes login"],
    alternates: {
        canonical: "https://www.orbitx-notes.in/login",
    },
    openGraph: {
        title: "Login | No 1 Note Taking App | OrbitX",
        description: "Log in to OrbitX Notes, the No 1 note taking app.",
        url: "https://www.orbitx-notes.in/login",
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
