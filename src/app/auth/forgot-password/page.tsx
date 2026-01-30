"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/firebase/auth";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { isAllowedEmail } from "@/lib/config";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validate email domain
        if (!isAllowedEmail(email)) {
            addToast("Please enter a valid email address.", "error");
            setLoading(false);
            return;
        }

        try {
            // Standard Security Practice:
            // We blindly send the reset request. Firebase handles existence checks internally.
            // If the user exists, they get an email. If not, nothing happens.
            // We always show success to prevent email enumeration attacks and ensure valid users aren't blocked by API protections.
            await resetPassword(email);

            addToast("If an account exists with this email, a password reset link has been sent.", "success");
            setEmail(""); // Clear form
        } catch (err: any) {
            console.error("Error in handleReset:", err);
            addToast("Something went wrong. Please try again later.", "error");
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
                                placeholder="Email"
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
