"use client";

import { useState } from "react";
import { signUp } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, UserPlus, User, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");





        // Secure Domain Validation
        if (!email.endsWith("@cep.ac.in")) {
            setError("Access Denied. You are not authorized to access this application.");
            setLoading(false);
            return;
        }

        try {
            await signUp(name, email, password);
            router.push("/auth/verify-email");
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError("Email already in use.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Failed to create account. Try again.");
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "0 1.5rem" }}>
                <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                    <div style={{
                        width: "60px", height: "60px", background: "#dcfce7", color: "#166534",
                        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.5rem"
                    }}>
                        <Mail size={32} />
                    </div>
                    <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>Check your inbox</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                        We've sent a verification link to <strong>{email}</strong>. <br />
                        Please verify your email to continue.
                    </p>
                    <Link href="/auth/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
                        Proceed to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "0 1.5rem" }}>
            <div className="card">
                <h2 style={{ marginBottom: "1.5rem", textAlign: "center", fontSize: "1.5rem" }}>
                    CEP Teacher Signup
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

                <form onSubmit={handleSignup}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Full Name</label>
                        <div style={{ position: "relative" }}>
                            <User size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                                    borderRadius: "var(--radius)",
                                    border: "1px solid var(--border)",
                                    background: "var(--surface)",
                                    color: "var(--text-main)",
                                    fontFamily: "inherit"
                                }}
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
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
                                minLength={6}
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
                        <UserPlus size={18} style={{ marginRight: "0.5rem" }} />
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    Already have an account? <Link href="/auth/login" style={{ textDecoration: "underline" }}>Login</Link>
                </p>
            </div>
        </div>
    );
}
