"use client";

import { useState } from "react";
import { signIn } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!email.endsWith("@cep.ac.in")) {
            setError("Access denied. Only @cep.ac.in emails are allowed.");
            setLoading(false);
            return;
        }





        try {
            await signIn(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Invalid email or password.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "0 1.5rem" }}>
            <div className="card">
                <h2 style={{ marginBottom: "1.5rem", textAlign: "center", fontSize: "1.5rem" }}>
                    CEP Teacher Login
                </h2>

                {error && (
                    <div style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        marginBottom: "1rem",
                        fontSize: "0.9rem"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Email</label>
                        <div style={{ position: "relative" }}>
                            <Mail size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-field"
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                                    borderRadius: "var(--radius)",
                                    border: "1px solid var(--border)",
                                    background: "var(--surface)",
                                    color: "var(--text-main)",
                                    fontFamily: "inherit"
                                }}
                                placeholder="teacher@university.edu"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Password</label>
                        <div style={{ position: "relative" }}>
                            <Lock size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 2.5rem 0.75rem 2.5rem",
                                    borderRadius: "var(--radius)",
                                    border: "1px solid var(--border)",
                                    background: "var(--surface)",
                                    color: "var(--text-main)",
                                    fontFamily: "inherit"
                                }}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "12px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--text-muted)",
                                    padding: 0
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    <Link href="/auth/forgot-password" style={{ textDecoration: "underline", display: "block", marginBottom: "0.5rem" }}>Forgot Password?</Link>
                    Don't have an account? <Link href="/auth/signup" style={{ textDecoration: "underline" }}>Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
