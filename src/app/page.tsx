"use client";

import { Suspense } from "react";
import Link from "next/link";
import NotesBrowser from "@/components/public/NotesBrowser";
import DynamicBackground from "@/components/layout/DynamicBackground";
import { ArrowDown, BookOpen, Layers, Users } from "lucide-react";

export default function Home() {
    const scrollToBrowse = () => {
        const element = document.getElementById('browse');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <main className="hero-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <DynamicBackground />

            {/* 1. Hero Section - Compact */}
            <section style={{
                padding: "4rem 1rem 2rem",
                textAlign: "center",
                position: "relative"
            }}>
                <div className="animate-fade-in">
                    <span style={{
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "var(--primary)",
                        marginBottom: "0.5rem",
                        display: "block"
                    }}>
                        Welcome to College of Engineering Poonjar
                    </span>
                    <h1 style={{
                        fontSize: "clamp(2.5rem, 5vw, 4rem)",
                        fontWeight: "800",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        marginBottom: "1rem",
                        color: "var(--text-main)"
                    }}>
                        <span className="animate-fade-in-left" style={{ display: "inline-block" }}>
                            Elevating Academic Excellence
                        </span>
                        <br />
                        <span className="animate-gradient animate-fade-in-right delay-200" style={{
                            background: "linear-gradient(135deg, var(--primary) 0%, #a855f7 50%, var(--primary) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            display: "inline-block"
                        }}>
                            Through Digital Innovation.
                        </span>
                    </h1>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
                        <button onClick={scrollToBrowse} className="btn btn-primary">
                            Explore Resources
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. Compact Features / Stats Grid */}
            <section style={{ padding: "0 1rem 3rem" }}>
                <div className="container">
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "1.5rem",
                    }}>
                        <FeatureCard
                            icon={<BookOpen size={24} color="var(--primary)" />}
                            title="Academic Excellence"
                            desc="Comprehensive study materials meticulously curated by expert faculty to align strictly with your curriculum standards."
                        />
                        <FeatureCard
                            icon={<Layers size={24} color="#a855f7" />} /* Purple */
                            title="Streamlined Navigation"
                            desc="Intuitively structured content hierarchy enabling instant access to department-specific resources and semester archives."
                        />
                        <FeatureCard
                            icon={<Users size={24} color="#ec4899" />} /* Pink */
                            title="Faculty-Verified"
                            desc="Trustworthy learning assets maintained directly by academic departments ensuring content accuracy and educational relevance."
                        />
                    </div>
                </div>

            </section>

            {/* 
                Google AdSense is incompatible with Next.js SSR
                Alternative solutions:
                1. Use a different ad network (Media.net, Carbon Ads)
                2. Implement ads after full deployment (not in dev mode)
                3. Use static banner ads instead of dynamic AdSense
            */}

            {/* 3. Main Browser Area */}
            <div id="browse" style={{ padding: "2rem 1rem 4rem", background: "linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, var(--bg-gradient-end) 100%)" }}>
                <div className="container">
                    <Suspense fallback={<div className="text-center p-4">Loading browser...</div>}>
                        <NotesBrowser />
                    </Suspense>
                </div>
            </div>

        </main>
    );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="card animate-fade-in delay-200" style={{
            padding: "2rem",
            border: "1px solid var(--border)",
            background: "var(--glass-surface)",
            backdropFilter: "blur(10px)",
            textAlign: "left",
            transition: "transform 0.2s"
        }}>
            <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "var(--bg-gradient-start)", borderRadius: "var(--radius)", width: "fit-content" }}>
                {icon}
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>{title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{desc}</p>
        </div>
    );
}
