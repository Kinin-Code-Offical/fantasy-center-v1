import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Yahoo ve dış kaynaklı tüm resimlere izin verir
      },
    ],
  },
};

export default nextConfig;