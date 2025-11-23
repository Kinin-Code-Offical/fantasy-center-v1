import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

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
      <body className="bg-[#030014] text-[#ededed] antialiased selection:bg-[#00f3ff] selection:text-black relative min-h-screen">
        {/* Global Background */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-0 bg-[url('/theme.png')] bg-cover bg-center opacity-10 mix-blend-screen"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/80 via-[#030014]/90 to-[#030014]"></div>
        </div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}