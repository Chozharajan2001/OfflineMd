import type { NextConfig } from "next";

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

export default nextConfig;
