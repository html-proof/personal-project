"use client";

import { useState } from "react";
import { resetPassword, checkEmailExists } from "@/lib/firebase/auth";
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
            // Smart Fallback Flow:
            // 1. We TRY to check if the user exists
            const emailExists = await checkEmailExists(email);

            // 2. We sending the reset email in BOTH cases
            // (This ensures valid users are NEVER blocked, even if Firebase hides them)
            await resetPassword(email);

            // 3. We show the appropriate message
            if (emailExists) {
                // If we explicitly found them (Protection OFF)
                addToast("Password reset link has been sent to your email.", "success");
            } else {
                // If we couldn't find them (Protection ON or User Missing)
                // We show a safe message and didn't block the email sending!
                addToast("If an account exists with this email, a password reset link has been sent.", "success");
            }

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
