import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    webpack: (config, { dev }) => {
        // Avoid sporadic webpack pack-cache allocation failures on low-memory environments.
        if (dev) {
            config.cache = false;
        }
        return config;
    },
};

const withSW = withSerwist({
    swSrc: "app/sw.ts",
    swDest: "public/sw.js",
    // Disable in dev to avoid stale caches while iterating
    disable: process.env.NODE_ENV === "development",
});

export default withSW(nextConfig);
