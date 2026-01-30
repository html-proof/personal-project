import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "College of Engineering Poonjar",
    description: "University E-Learning Portal",
    icons: {
        icon: "/icon-192.png",
        apple: "/icon-192.png",
    },
    manifest: "/manifest.json",
    themeColor: "#2563eb",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "CEP Notes",
    },
    other: {
        "google-adsense-account": "ca-pub-6253589071371136",
    },
};

import DisableDevTools from "@/components/common/DisableDevTools";
import { UndoProvider } from "@/context/UndoContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
// import InstallPrompt from "@/components/common/InstallPrompt";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const AmpAutoAds = 'amp-auto-ads' as any;

    return (
        <html lang="en">
            <head>
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6253589071371136"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />
                <Script
                    async
                    custom-element="amp-auto-ads"
                    src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js"
                    strategy="afterInteractive"
                />
            </head>
            <body className={inter.className}>
                <AmpAutoAds type="adsense"
                    data-ad-client="ca-pub-6253589071371136">
                </AmpAutoAds>
                <DisableDevTools />
                <ThemeProvider>
                    <UndoProvider>
                        <ToastProvider>
                            <Navbar />
                            <main style={{ padding: "2rem 0" }}>{children}</main>
                            {/* <InstallPrompt /> */}
                            {/* 
                                AdSense disabled due to incompatibility with Next.js SSR
                                See: https://github.com/vercel/next.js/discussions/38256
                                Alternative: Use page-level ads or different ad network
                            */}
                        </ToastProvider>
                    </UndoProvider>
                </ThemeProvider>

                {/* Register Service Worker */}

            </body>
        </html>
    );
}
