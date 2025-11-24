import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import CyberBackground from "@/components/CyberBackground";
import NextTopLoader from 'nextjs-toploader';

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
      <body className="bg-[#050a05] text-[#ededed] antialiased selection:bg-[#00ff41] selection:text-black min-h-screen overflow-y-auto md:h-screen md:overflow-hidden md:fixed md:w-full">
        <NextTopLoader
          color="#22c55e"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #22c55e, 0 0 5px #22c55e"
        />
        <CyberBackground />
        <Providers>
          <div className="flex flex-col min-h-screen md:h-full">
             <main className="flex-1 relative w-full h-full">
                {children}
             </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}