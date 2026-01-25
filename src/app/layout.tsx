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
        icon: "/logo.png",
    },
};

import { ThemeProvider } from "@/context/ThemeContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ThemeProvider>
                    <Navbar />
                    <main style={{ padding: "2rem 0" }}>{children}</main>
                </ThemeProvider>
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8558633671852701"
                    crossOrigin="anonymous"
                />
            </body>
        </html>
    );
}
