import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login",
    description: "Access your OrbitX Notes workspace",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
