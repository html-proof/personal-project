"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div
                style={{
                    position: "fixed",
                    top: "1rem",
                    right: "1rem",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    pointerEvents: "none" // Allow clicks through container
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="animate-fade-in-right"
                        style={{
                            background: "var(--surface)",
                            color: "var(--text-main)",
                            padding: "0.75rem 1rem",
                            borderRadius: "var(--radius)",
                            boxShadow: "var(--shadow-lg)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            minWidth: "300px",
                            maxWidth: "400px",
                            pointerEvents: "auto", // Re-enable clicks
                            borderLeft: `4px solid ${toast.type === "success" ? "var(--success)" :
                                    toast.type === "error" ? "var(--danger)" :
                                        toast.type === "warning" ? "#f59e0b" :
                                            "var(--primary)"
                                }`
                        }}
                    >
                        {toast.type === "success" && <CheckCircle size={20} color="var(--success)" />}
                        {toast.type === "error" && <AlertTriangle size={20} color="var(--danger)" />}
                        {toast.type === "info" && <Info size={20} color="var(--primary)" />}
                        {toast.type === "warning" && <AlertTriangle size={20} color="#f59e0b" />}

                        <p style={{ flex: 1, fontSize: "0.9rem", fontWeight: 500 }}>{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
