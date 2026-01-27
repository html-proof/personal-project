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
    const [adLoaded, setAdLoaded] = useState(false);

    useEffect(() => {
        try {
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            (window as any).adsbygoogle.push({});
            setAdLoaded(true);
        } catch (err) {
            console.error("AdSense error:", err);
        }
    }, []);

    return (
        <div className="ad-container" style={{ overflow: "hidden", minHeight: "100px", textAlign: "center", margin: "20px 0" }}>
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
