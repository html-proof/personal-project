"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, signOut } from "@/lib/firebase/auth";
import { LogIn, LogOut, LayoutDashboard, Moon, Sun, Home } from "lucide-react";
import styles from "./Navbar.module.css";
import { useTheme } from "@/context/ThemeContext";

export default function Navbar() {
    const { user, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();

    return (
        <nav className={styles.nav}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/logo.png" alt="CEP Logo" style={{ height: '40px', width: 'auto' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>CEP</span>
                    </div>
                </Link>

                <div className={styles.actions}>
                    {pathname !== "/" && (
                        <Link href="/" className={styles.themeBtn} title="Go Home">
                            <Home size={20} />
                        </Link>
                    )}

                    <button
                        onClick={toggleTheme}
                        className={styles.themeBtn}
                        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    {!loading && (
                        <>
                            {user ? (
                                <>
                                    <Link href="/dashboard" className="btn btn-outline" style={{ border: 'none' }}>
                                        <LayoutDashboard size={18} /> Dashboard
                                    </Link>
                                    <button onClick={signOut} className="btn btn-primary">
                                        <LogOut size={18} /> Logout
                                    </button>
                                </>
                            ) : (
                                <Link href="/auth/login" className="btn btn-primary">
                                    <LogIn size={18} /> Teacher Login
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
