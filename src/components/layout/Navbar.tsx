"use client";

import { useState, useEffect } from "react";
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

    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) { // Scroll Down > 100px
                    setIsVisible(false);
                } else { // Scroll Up
                    setIsVisible(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        window.addEventListener('scroll', controlNavbar);

        return () => {
            window.removeEventListener('scroll', controlNavbar);
        };
    }, [lastScrollY]);

    return (
        <nav
            className={styles.nav}
            style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.3s ease-in-out'
            }}
        >
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
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '1rem' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user.displayName || user.email?.split('@')[0]}</span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Teacher</span>
                                    </div>
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
        </nav >
    );
}
