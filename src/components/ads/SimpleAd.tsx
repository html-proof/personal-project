"use client";

import { useEffect, useRef } from "react";

interface SimpleAdProps {
    adSlot: string;
    adFormat?: string;
    fullWidthResponsive?: boolean;
}

/**
 * Simplified Ad Component for Next.js
 * Use this on individual pages, NOT in layout.tsx
 */
export default function SimpleAd({
    adSlot,
    adFormat = "auto",
    fullWidthResponsive = true
}: SimpleAdProps) {
    const adRef = useRef<HTMLModElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;

        try {
            // Push ad after a delay to ensure DOM is ready
            setTimeout(() => {
                if (window && adRef.current) {
                    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                    (window as any).adsbygoogle.push({});
                    initialized.current = true;
                }
            }, 500);
        } catch (err) {
            // Silently fail
            console.error("AdSense Error:", err);
        }
    }, []);

    return (
        <div style={{
            minHeight: "100px",
            margin: "20px 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client="ca-pub-6253589071371136"
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive={fullWidthResponsive.toString()}
            />
        </div>
    );
}
