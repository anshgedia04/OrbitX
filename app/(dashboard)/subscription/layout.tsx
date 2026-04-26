import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pro Upgrade",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
