"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/firebase/auth";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            await resetPassword(email);
            setMessage("Password reset email sent! Check your inbox.");
        } catch (err: any) {
            setError("Failed to send reset email. Check if the address is correct.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "0 1.5rem" }}>
            <div className="card">
                <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
                    Reset Password
                </h2>
                <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {message && (
                    <div style={{ background: "#dcfce7", color: "#166534", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.9rem" }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.9rem" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleReset}>
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Email</label>
                        <div style={{ position: "relative" }}>
                            <Mail size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                                    borderRadius: "var(--radius)",
                                    border: "1px solid var(--border)",
                                    fontFamily: "inherit"
                                }}
                                placeholder="teacher@university.edu"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>
            </div>
        </div>
    );
}
