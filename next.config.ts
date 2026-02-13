import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = withPWA({
    experimental: {
        serverActions: true,
    },
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
});

export default nextConfig;
