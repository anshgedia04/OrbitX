import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import companyLogo from "@/public/companyLogo.png";
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
  keywords: ["note taking", "note creation for students", "best note taking app for students","note writing for students", "chat with notes", "note taking app", "note taking website", "note taking ai", "AI assistant", "workspace", "productivity", "markdown editor", "OrbitX", "hyperspace notes"],
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
  icons: {
    icon: "@/public/companyLogo.png",
  },
};

import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "OrbitX Notes",
      url: "https://www.orbitx-notes.in",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.orbitx-notes.in/notes?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "OrbitX Team",
      url: "https://www.orbitx-notes.in",
      logo: "https://www.orbitx-notes.in/companyLogo.png",
      sameAs: [
        "https://twitter.com/OrbitXNotes",
        "https://github.com/OrbitX"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "OrbitX Notes",
      operatingSystem: "Any",
      applicationCategory: "BusinessApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      }
    }
  ];

  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="lvxnk7Lbsu8CznYYLSCQljwOidcwRJL5SmjyiI5Zk5c" />
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
