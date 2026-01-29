"use client";

import { useEffect, useState } from "react";

interface AdBannerProps {
    dataAdSlot: string;
    dataAdFormat?: string;
    dataFullWidthResponsive?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({
    dataAdSlot,
    dataAdFormat = "auto",
    dataFullWidthResponsive = true,
}) => {
    const [isMounted, setIsMounted] = useState(false);
    const [adPushed, setAdPushed] = useState(false);

    // Step 1: Set mounted state (client-side only)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Step 2: Initialize ad after mount with delay
    useEffect(() => {
        if (!isMounted || adPushed) return;

        const timer = setTimeout(() => {
            try {
                if (typeof window !== 'undefined') {
                    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                    (window as any).adsbygoogle.push({});
                    setAdPushed(true);
                }
            } catch (err) {
                console.error("AdSense initialization error:", err);
            }
        }, 2000); // 2 second delay to ensure layout is stable

        return () => clearTimeout(timer);
    }, [isMounted, adPushed]);

    // Don't render on server side
    if (!isMounted) {
        return (
            <div style={{
                minHeight: "100px",
                width: "100%",
                margin: "20px 0",
                background: "#f3f4f6"
            }} />
        );
    }

    return (
        <div
            style={{
                overflow: "hidden",
                minHeight: "100px",
                width: "100%",
                textAlign: "center",
                margin: "20px 0",
                padding: "10px"
            }}
        >
            <ins
                className="adsbygoogle"
                style={{ display: "block", minHeight: "100px" }}
                data-ad-client="ca-pub-6253589071371136"
                data-ad-slot={dataAdSlot}
                data-ad-format={dataAdFormat}
                data-full-width-responsive={dataFullWidthResponsive?.toString()}
            ></ins>
        </div>
    );
};

export default AdBanner;
