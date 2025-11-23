/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // <--- MÜHENDİSLİK DOKUNUŞU BURADA
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s.yimg.com", // Yahoo profil ve takım resimleri buradan gelir
      },
      {
        protocol: "https",
        hostname: "*.yahoo.com",
      },
    ],
  },
};

export default nextConfig;