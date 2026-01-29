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
    const [adLoaded, setAdLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const adInitialized = useRef(false); // Keep adInitialized to prevent multiple pushes

    useEffect(() => {
        if (adInitialized.current) return;

        // Check for available width before pushing
        if (!containerRef.current || containerRef.current.offsetWidth === 0) {
            // Retry logic could be improved with ResizeObserver but simple timeout for now
            const timer = setTimeout(() => {
                if (adInitialized.current) return;
                try {
                    if (containerRef.current && containerRef.current.offsetWidth > 0) {
                        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                        (window as any).adsbygoogle.push({});
                        setAdLoaded(true);
                        adInitialized.current = true;
                    }
                } catch (e) {
                    console.error("AdSense retry error:", e);
                }
            }, 1000); // 1s delay
            return () => clearTimeout(timer);
        }

        try {
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            (window as any).adsbygoogle.push({});
            setAdLoaded(true);
            adInitialized.current = true;
        } catch (err) {
            console.error("AdSense error:", err);
        }
    }, []);

    return (
        <div
            ref={containerRef}
            className="ad-container"
            style={{ overflow: "hidden", minHeight: "100px", width: "100%", textAlign: "center", margin: "20px 0" }}
        >
            <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client="ca-pub-6253589071371136"
                data-ad-slot={dataAdSlot}
                data-ad-format={dataAdFormat}
                data-full-width-responsive={dataFullWidthResponsive?.toString()}
            ></ins>
        </div>
    );
};

export default AdBanner;
