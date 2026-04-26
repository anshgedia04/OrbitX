import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | OrbitX Notes",
    default: "OrbitX Notes - The Ultimate AI-Powered Workspace",
  },
  description: "Capture thoughts in hyperspace. The minimal, lightning-fast note taking app designed for focus and productivity. Powered by cutting-edge AI models.",
  keywords: ["note taking", "AI assistant", "workspace", "productivity", "markdown editor", "OrbitX", "hyperspace notes"],
  authors: [{ name: "OrbitX Team" }],
  creator: "OrbitX Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.orbitx-notes.in",
    title: "OrbitX Notes - The Ultimate AI-Powered Workspace",
    description: "Capture thoughts in hyperspace. The minimal, lightning-fast note taking app designed for focus and productivity.",
    siteName: "OrbitX Notes",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrbitX Notes - The Ultimate AI-Powered Workspace",
    description: "Capture thoughts in hyperspace. The minimal, lightning-fast note taking app designed for focus.",
  },
};

import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OrbitX Notes",
    url: "https://www.orbitx-notes.in",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.orbitx-notes.in/notes?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
