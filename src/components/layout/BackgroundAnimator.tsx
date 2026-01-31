"use client";

import { useEffect, useState } from "react";
import styles from "./BackgroundAnimator.module.css";

const DAY_EMOJIS = ["☀️", "☁️", "🐦", "🦋", "🎈", "🍦", "🌼", "🪁"];
const NIGHT_EMOJIS = ["🌙", "⭐", "🦉", "👻", "💤", "🕯️", "🌌", "🦇"];
const FUNNY_EMOJIS = ["🤪", "👯‍♂️", "👾", "🚀", "🍕", "🦄", "🌈", "😹", "🍌", "🌵"];

export default function BackgroundAnimator() {
    const [items, setItems] = useState<{ id: number; emoji: string; left: string; duration: string; size: string }[]>([]);
    const [clicks, setClicks] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);
    const [theme, setTheme] = useState<"day" | "night">("day");

    useEffect(() => {
        const hour = new Date().getHours();
        setTheme(hour >= 6 && hour < 18 ? "day" : "night");

        const interval = setInterval(() => {
            spawnItem();
        }, 3000); // New item every 3 seconds

        return () => clearInterval(interval);
    }, [theme]); // Re-run if theme changes (though theme only set once mostly)

    const spawnItem = () => {
        const id = Date.now();
        const emojiList = Math.random() > 0.8 ? FUNNY_EMOJIS : (theme === "day" ? DAY_EMOJIS : NIGHT_EMOJIS);
        const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
        const left = Math.random() * 95 + "%";
        const duration = (Math.random() * 10 + 10) + "s"; // 10-20s
        const size = (Math.random() * 1.5 + 1) + "rem";

        setItems(prev => [...prev.slice(-15), { id, emoji, left, duration, size }]); // Keep last 15

        // Remove after duration (approx cleanup)
        setTimeout(() => {
            setItems(prev => prev.filter(i => i.id !== id));
        }, 21000);
    };

    const handleClick = (e: React.MouseEvent) => {
        // Only trigger if clicking on the background container directly (not intercepted by children)
        // But since this component is z-index -1, it won't receive clicks if content is above.
        // We will just let it be a visual layer. 
        // IF the user wants interactivity, we'd need a transparent overlay.
        // Let's add a subtle transparent overlay that passes clicks BUT captures empty space clicks?
        // Hard to distinguish.
        // I'll stick to passive animations for now.
    };

    return (
        <div className={styles.container}>
            {items.map(item => (
                <div
                    key={item.id}
                    className={styles.animItem}
                    style={{
                        left: item.left,
                        animationDuration: item.duration,
                        fontSize: item.size
                    }}
                >
                    {item.emoji}
                </div>
            ))}
        </div>
    );
}
