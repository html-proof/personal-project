"use client";

import { useEffect, useState } from "react";
import { getDepartments } from "@/lib/firebase/firestore";

export default function FirebaseTest() {
    const [status, setStatus] = useState("Testing...");
    const [departments, setDepartments] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        testFirebase();
    }, []);

    async function testFirebase() {
        try {
            console.log("🔥 Testing Firebase connection...");
            const data = await getDepartments();
            console.log("✅ Firebase connected! Departments:", data);
            setDepartments(data);
            setStatus(data.length > 0 ? "✅ Connected - Data found!" : "⚠️ Connected - No data");
        } catch (err: any) {
            console.error("❌ Firebase error:", err);
            setError(err.message);
            setStatus("❌ Connection failed");
        }
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <h1>Firebase Connection Test</h1>
            <div style={{
                padding: "1rem",
                background: status.includes("✅") ? "#d1fae5" : status.includes("⚠️") ? "#fef3c7" : "#fee2e2",
                borderRadius: "8px",
                marginBottom: "1rem"
            }}>
                <strong>Status:</strong> {status}
            </div>

            {error && (
                <div style={{ padding: "1rem", background: "#fee2e2", borderRadius: "8px", marginBottom: "1rem" }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div>
                <strong>Departments ({departments.length}):</strong>
                {departments.length > 0 ? (
                    <ul>
                        {departments.map(d => (
                            <li key={d.id}>{d.name} (ID: {d.id})</li>
                        ))}
                    </ul>
                ) : (
                    <p>No departments found. Please create some in the management page.</p>
                )}
            </div>

            <div style={{ marginTop: "2rem", padding: "1rem", background: "#f3f4f6", borderRadius: "8px" }}>
                <h3>Next Steps:</h3>
                <ol>
                    <li>If status is "Connected - No data": Go to <a href="/dashboard/manage">/dashboard/manage</a> to create departments</li>
                    <li>If status is "Connection failed": Check Firebase configuration in .env.local</li>
                    <li>Check browser console for detailed logs</li>
                </ol>
            </div>
        </div>
    );
}
