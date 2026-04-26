import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Join the Mission",
    description: "Create your OrbitX Notes account and enter hyperspace.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
