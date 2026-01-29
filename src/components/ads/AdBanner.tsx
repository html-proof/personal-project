"use client";

import { useEffect, useState, useRef } from "react";

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
    const containerRef = useRef<HTMLDivElement>(null);
    const adPushedRef = useRef(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || adPushedRef.current) return;

        let attempts = 0;
        const maxAttempts = 10;

        const tryInitAd = () => {
            attempts++;

            // Check if container has valid width
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;

                if (width > 0) {
                    // Container has valid width, initialize ad
                    try {
                        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                        (window as any).adsbygoogle.push({});
                        adPushedRef.current = true;
                        console.log(`AdSense initialized successfully with width: ${width}px`);
                    } catch (err) {
                        console.error("AdSense initialization error:", err);
                    }
                } else if (attempts < maxAttempts) {
                    // Width is 0, retry after delay
                    console.log(`Container width is 0, retrying... (attempt ${attempts}/${maxAttempts})`);
                    setTimeout(tryInitAd, 500);
                } else {
                    console.error("Failed to initialize AdSense: container width remained 0 after max attempts");
                }
            }
        };

        // Start trying after initial delay
        const timer = setTimeout(tryInitAd, 1000);

        return () => clearTimeout(timer);
    }, [isMounted]);

    if (!isMounted) {
        return (
            <div style={{
                minHeight: "100px",
                width: "100%",
                maxWidth: "1200px",
                margin: "20px auto",
                background: "#f3f4f6"
            }} />
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                overflow: "hidden",
                minHeight: "100px",
                width: "100%",
                maxWidth: "1200px",
                textAlign: "center",
                margin: "20px auto",
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
