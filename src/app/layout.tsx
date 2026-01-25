import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Navbar from "@/components/layout/Navbar";
import AdBanner from "@/components/ads/AdBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "College of Engineering Poonjar",
    description: "University E-Learning Portal",
    icons: {
        icon: "/logo.png",
    },
    other: {
        "google-adsense-account": "ca-pub-6253589071371136",
    },
};

import { ThemeProvider } from "@/context/ThemeContext";

import DisableDevTools from "@/components/common/DisableDevTools";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <DisableDevTools />
                <ThemeProvider>
                    <Navbar />
                    <main style={{ padding: "2rem 0" }}>{children}</main>
                    {/* Placeholder Ad Slot - Replace '1234567890' with actual Ad Unit ID */}
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {/* <AdBanner dataAdSlot="1234567890" /> */}
                    </div>
                </ThemeProvider>
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6253589071371136"
                    crossOrigin="anonymous"
                />
            </body>
        </html>
    );
}
