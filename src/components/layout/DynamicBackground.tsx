"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface WeatherData {
    isDay: boolean;
    weatherCode: number;
    temp: number;
}

export default function DynamicBackground() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get approximate location via IP (No permission needed)
                const ipRes = await fetch('https://ipapi.co/json/');
                if (!ipRes.ok) throw new Error('IP Fetch failed');
                const ipData = await ipRes.json();
                const { latitude, longitude } = ipData;

                // 2. Fetch Weather from Open-Meteo
                const weatherRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code&timezone=auto`
                );
                const weatherData = await weatherRes.json();

                setWeather({
                    isDay: weatherData.current.is_day === 1,
                    weatherCode: weatherData.current.weather_code,
                    temp: weatherData.current.temperature_2m
                });

            } catch (error) {
                console.error("Background data fetch failed:", error);
                // Fallback: System time
                const hour = new Date().getHours();
                setWeather({
                    isDay: hour > 6 && hour < 18,
                    weatherCode: 0, // Clear sky
                    temp: 25
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Determine background style
    const getBackgroundStyle = () => {
        if (!weather) return { background: "linear-gradient(135deg, #f8fafc, #e2e8f0)" }; // Default Light

        const { isDay, weatherCode } = weather;
        const isRainy = weatherCode >= 51 && weatherCode <= 67 || weatherCode >= 80 && weatherCode <= 82;

        if (isRainy) return { background: "linear-gradient(to bottom, #334155, #64748b)" }; // Rainy Grey
        if (isDay) return { background: "linear-gradient(to bottom, #60a5fa, #bfdbfe)" };   // Day Blue
        return { background: "linear-gradient(to bottom, #0f172a, #1e293b)" };              // Night Dark
    };

    const isRainy = weather && (weather.weatherCode >= 51 && weather.weatherCode <= 67 || weather.weatherCode >= 80 && weather.weatherCode <= 82);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            transition: 'background 1s ease',
            ...getBackgroundStyle(),
            overflow: 'hidden'
        }}>
            {/* Celestial Bodies */}
            {!loading && weather && (
                <div className="animate-float" style={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    transition: 'all 1s ease'
                }}>
                    {weather.isDay ? (
                        !isRainy && <Sun size={80} color="#fcd34d" style={{ filter: 'drop-shadow(0 0 20px rgba(253, 224, 71, 0.5))' }} />
                    ) : (
                        <Moon size={60} color="#e2e8f0" style={{ filter: 'drop-shadow(0 0 10px rgba(226, 232, 240, 0.3))' }} />
                    )}
                </div>
            )}

            {/* Stars (Night Only) */}
            {!loading && weather && !weather.isDay && !isRainy && (
                <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    {/* Generate random stars */}
                    {[...Array(20)].map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            top: `${Math.random() * 50}%`,
                            left: `${Math.random() * 100}%`,
                            width: '2px',
                            height: '2px',
                            background: 'white',
                            opacity: Math.random(),
                            animation: `twinkle ${2 + Math.random() * 3}s infinite`
                        }} />
                    ))}
                </div>
            )}

            {/* Rain (If Rainy) */}
            {isRainy && (
                <div className="rain-container" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    {[...Array(50)].map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            top: `-20px`,
                            left: `${Math.random() * 100}%`,
                            width: '1px',
                            height: '15px',
                            background: 'rgba(255,255,255,0.4)',
                            animation: `rain ${0.5 + Math.random() * 0.5}s linear infinite`,
                            animationDelay: `${Math.random()}s`
                        }} />
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes rain {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(100vh); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

