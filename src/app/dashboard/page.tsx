"use client";

import { useAuth } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import UploadFlow from "@/components/dashboard/UploadFlow";
import MyNotes from "@/components/dashboard/MyNotes";
import { Home } from "lucide-react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/auth/login");
            } else if (!user.emailVerified) {
                router.push("/auth/verify-email");
            }
        }
    }, [user, loading, router]);

    if (loading) return <div className="container" style={{ textAlign: "center", marginTop: "4rem" }}>Loading dashboard...</div>;
    if (!user) return null;
    return (
        <div className="container">
            <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "700" }}>CEP Teacher Dashboard</h1>
                    <p style={{ color: "var(--text-muted)" }}>Manage your notes and uploads.</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-outline" onClick={() => router.push("/")} title="Go to Home">
                        <Home size={20} />
                    </button>
                    <button className="btn btn-outline" onClick={() => router.push("/dashboard/manage")}>
                        Manage Structure
                    </button>
                </div>
            </header>

            <section>
                <UploadFlow />
            </section>

            <MyNotes />
        </div>
    );
}
