"use client";

import { useAuth } from "@/lib/firebase/auth";
import { sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Mail, RefreshCw, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";

export default function VerifyEmailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        } else if (user?.emailVerified) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    const handleResend = async () => {
        if (!user) return;
        setSending(true);
        try {
            await sendEmailVerification(user);
            setMsg("Verification email sent! Check your inbox.");
        } catch (error: any) {
            if (error.code === 'auth/too-many-requests') {
                setMsg("Too many requests. Please wait a bit.");
            } else {
                setMsg("Failed to send email. Try again later.");
            }
        } finally {
            setSending(false);
        }
    };

    const handleRefresh = async () => {
        if (user) {
            await user.reload();
            if (user.emailVerified) {
                router.push("/dashboard");
            } else {
                setMsg("Email not verified yet. Please check your inbox.");
            }
        }
    };

    if (loading || !user) return <div className="container" style={{ marginTop: "4rem", textAlign: "center" }}>Loading...</div>;

    return (
        <div style={{ maxWidth: "500px", margin: "4rem auto", padding: "0 1.5rem" }}>
            <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{
                    width: "70px", height: "70px", background: "#dcfce7", color: "#166534",
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1.5rem"
                }}>
                    <Mail size={36} />
                </div>

                <h2 style={{ marginBottom: "1rem" }}>Verify your Email</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
                    We've sent a verification link to <strong>{user.email}</strong>.<br />
                    To access the Teacher Dashboard, please verify your email address.
                </p>

                {msg && (
                    <div style={{
                        background: msg.includes("sent") ? "#dcfce7" : "#fee2e2",
                        color: msg.includes("sent") ? "#166534" : "#991b1b",
                        padding: "0.75rem", borderRadius: "var(--radius)", marginBottom: "1.5rem", fontSize: "0.9rem"
                    }}>
                        {msg}
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <button onClick={handleRefresh} className="btn btn-primary" style={{ justifyContent: "center" }}>
                        <RefreshCw size={18} style={{ marginRight: "0.5rem" }} />
                        I have verified my email
                    </button>

                    <button onClick={handleResend} className="btn btn-outline" disabled={sending} style={{ justifyContent: "center" }}>
                        {sending ? "Sending..." : "Resend Verification Email"}
                    </button>

                    <button onClick={() => auth.signOut()} className="btn btn-outline" style={{ justifyContent: "center", border: "none", color: "var(--text-muted)" }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
