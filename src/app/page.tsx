"use client";

import Link from "next/link";
import NotesBrowser from "@/components/public/NotesBrowser";
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

            {/* 1. Hero Section - Compact */}
            <section style={{
                padding: "3rem 2rem",
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
                        Welcome to CEP
                    </span>
                    <h1 style={{
                        fontSize: "clamp(2.5rem, 5vw, 4rem)",
                        fontWeight: "800",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        marginBottom: "1rem",
                        color: "var(--text-main)"
                    }}>
                        Smart Learning,<br />
                        <span style={{
                            background: "linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            Simplified.
                        </span>
                    </h1>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
                        <button onClick={scrollToBrowse} className="btn btn-primary">
                            Browse Materials
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. Compact Features / Stats Grid */}
            <section style={{ padding: "4rem 2rem", background: "var(--surface)" }}>
                <div className="container">
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "2rem",
                        marginTop: "-4rem", /* Overlap overlap effect if desired, but let's keep it simple tight */
                    }}>
                        <FeatureCard
                            icon={<BookOpen size={24} color="var(--primary)" />}
                            title="Curated Notes"
                            desc="Organized by Department, Semester, and Subject for easy access."
                        />
                        <FeatureCard
                            icon={<Layers size={24} color="#a855f7" />} /* Purple */
                            title="Structured Content"
                            desc="Drill down efficiently to find exactly what you need in seconds."
                        />
                        <FeatureCard
                            icon={<Users size={24} color="#ec4899" />} /* Pink */
                            title="Community Driven"
                            desc="Resources shared by trusted faculty members."
                        />
                    </div>
                </div>
            </section>

            {/* 3. Main Browser Area */}
            <div id="browse" style={{ padding: "4rem 2rem 6rem", background: "linear-gradient(to bottom, var(--surface) 0%, var(--bg-gradient-end) 100%)" }}>
                <div className="container">
                    <NotesBrowser />
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
            background: "rgba(255,255,255,0.5)", /* Slightly transparent on light */
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
