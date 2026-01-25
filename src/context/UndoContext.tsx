"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";

type DeleteAction = () => Promise<void>;

interface UndoContextType {
    scheduleDelete: (id: string, action: DeleteAction, description: string, onUndo?: () => void) => void;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);

export function UndoProvider({ children }: { children: React.ReactNode }) {
    const [pendingItem, setPendingItem] = useState<{
        id: string;
        description: string;
        action: DeleteAction;
        onUndo?: () => void;
        expiry: number;
    } | null>(null);

    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Force execute if pending item exists on unmount/reload
    useEffect(() => {
        const handleUnload = () => {
            if (pendingItem) {
                pendingItem.action(); // Try to fire before close (unreliable but best effort)
            }
        };
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [pendingItem]);

    const scheduleDelete = (id: string, action: DeleteAction, description: string, onUndo?: () => void) => {
        // If there's already a pending item, force execute it immediately to clear queue
        if (pendingItem) {
            executeNow();
        }

        const DURATION = 30000; // 30 seconds
        const expiry = Date.now() + DURATION;

        setPendingItem({ id, description, action, onUndo, expiry });
        setTimeLeft(30);

        // Set final execution timer
        timerRef.current = setTimeout(() => {
            executeNow();
        }, DURATION);

        // Set countdown interval
        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const executeNow = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        // We get the *current* pending item from ref or closure? 
        // Better to rely on state in the render cycle or ref for stability.
        // But inside setTimeout closure 'pendingItem' might be stale if we don't use a Ref for the item itself.
        // However, since we clear existing ones before adding new, the closure for the specific timeout should hold the correct action.

        // Actually, let's just use the state setter to ensure we are operating on the right thing, 
        // but the Action needs to be called.
        // The robust way for the timeout closure:

        setPendingItem(current => {
            if (current) {
                current.action().catch(err => console.error("Final deletion failed", err));
            }
            return null;
        });
    };

    const handleUndo = () => {
        if (!pendingItem) return;

        // Clear timers
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Call undo callback
        if (pendingItem.onUndo) pendingItem.onUndo();

        // Clear state
        setPendingItem(null);
    };

    return (
        <UndoContext.Provider value={{ scheduleDelete }}>
            {children}
            {pendingItem && (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    background: "#1f2937",
                    color: "white",
                    padding: "1rem 1.5rem",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    zIndex: 9999,
                    animation: "slideIn 0.3s ease-out"
                }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>{pendingItem.description} deleted</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Completing in {timeLeft}s</p>
                    </div>
                    <button
                        onClick={handleUndo}
                        style={{
                            background: "var(--primary)",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: 600
                        }}
                    >
                        UNDO
                    </button>
                    {/* Progress Bar */}
                    <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        height: "4px",
                        background: "var(--primary)",
                        width: `${(timeLeft / 30) * 100}%`,
                        transition: "width 1s linear",
                        borderRadius: "0 0 0 8px"
                    }} />
                </div>
            )}
            <style jsx global>{`
                @keyframes slideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </UndoContext.Provider>
    );
}

export const useUndo = () => {
    const context = useContext(UndoContext);
    if (!context) throw new Error("useUndo must be used within an UndoProvider");
    return context;
};
