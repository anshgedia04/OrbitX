import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Tell Next.js to NOT bundle firebase-admin — it must run natively on the server.
    // Without this, webpack tries to bundle native Node.js modules and fails.
    serverExternalPackages: ["firebase-admin"],

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    output: "standalone",
};

export default nextConfig;
