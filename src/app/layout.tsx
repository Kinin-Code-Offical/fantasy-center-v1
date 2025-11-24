import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import CyberBackground from "@/components/CyberBackground";

export const metadata: Metadata = {
  title: "Fantasy Center",
  description: "Yahoo Fantasy Trading Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Koyu tema için arka plan rengi veriyoruz */}
      <body className="bg-[#050a05] text-[#ededed] antialiased selection:bg-[#00ff41] selection:text-black relative min-h-screen">
        <CyberBackground />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}