"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function DatabaseDiagnostic() {
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        runDiagnostics();
    }, []);

    async function runDiagnostics() {
        const diagnostics: any = {};

        try {
            // Test 1: Departments
            console.log("🔍 Testing Departments...");
            const deptSnapshot = await getDocs(collection(db, "departments"));
            diagnostics.departments = {
                count: deptSnapshot.size,
                data: deptSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            };

            // Test 2: Batches
            console.log("🔍 Testing Batches...");
            try {
                const batchSnapshot = await getDocs(collection(db, "batches"));
                diagnostics.batches = {
                    count: batchSnapshot.size,
                    data: batchSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
                };
            } catch (err: any) {
                diagnostics.batches = { error: err.message, blocked: true };
            }

            // Test 3: Semesters
            console.log("🔍 Testing Semesters...");
            const semSnapshot = await getDocs(collection(db, "semesters"));
            diagnostics.semesters = {
                count: semSnapshot.size,
                data: semSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            };

            // Test 4: Subjects
            console.log("🔍 Testing Subjects...");
            const subSnapshot = await getDocs(collection(db, "subjects"));
            diagnostics.subjects = {
                count: subSnapshot.size,
                data: subSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            };

            // Test 5: Notes (uploaded files)
            console.log("🔍 Testing Notes...");
            const notesSnapshot = await getDocs(collection(db, "notes"));
            diagnostics.notes = {
                count: notesSnapshot.size,
                data: notesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            };

            // Test 6: Folders
            console.log("🔍 Testing Folders...");
            const folderSnapshot = await getDocs(collection(db, "folders"));
            diagnostics.folders = {
                count: folderSnapshot.size,
                data: folderSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            };

            setResults(diagnostics);
            console.log("✅ Diagnostics complete:", diagnostics);
        } catch (err: any) {
            console.error("❌ Diagnostic error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div style={{ padding: "2rem" }}>🔍 Running diagnostics...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
                <h1>❌ Diagnostic Error</h1>
                <div style={{ padding: "1rem", background: "#fee2e2", borderRadius: "8px" }}>
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    const totalFiles = results.notes?.count || 0;
    const hasData = Object.values(results).some((r: any) => r.count > 0);

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h1>🔬 Database Diagnostic Report</h1>

            {/* Summary */}
            <div style={{
                padding: "1.5rem",
                background: hasData ? "#d1fae5" : "#fef3c7",
                borderRadius: "8px",
                marginBottom: "2rem"
            }}>
                <h2 style={{ marginTop: 0 }}>Summary</h2>
                <p><strong>Total Uploaded Files:</strong> {totalFiles}</p>
                <p><strong>Database Status:</strong> {hasData ? "✅ Contains Data" : "⚠️ Empty Database"}</p>
            </div>

            {/* Detailed Results */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                {Object.entries(results).map(([collection, data]: [string, any]) => (
                    <div key={collection} style={{
                        padding: "1rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        background: data.blocked ? "#fee2e2" : data.count > 0 ? "#f0fdf4" : "#f9fafb"
                    }}>
                        <h3 style={{ marginTop: 0, textTransform: "capitalize" }}>{collection}</h3>

                        {data.blocked ? (
                            <div>
                                <p style={{ color: "#dc2626" }}>🚫 <strong>BLOCKED BY FIRESTORE RULES</strong></p>
                                <p style={{ fontSize: "0.9rem" }}>Error: {data.error}</p>
                                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fff", borderRadius: "4px" }}>
                                    <strong>Fix:</strong> Deploy updated firestore.rules to Firebase Console
                                </div>
                            </div>
                        ) : (
                            <>
                                <p><strong>Count:</strong> {data.count}</p>
                                {data.count > 0 && (
                                    <details>
                                        <summary style={{ cursor: "pointer", color: "#2563eb" }}>View Data</summary>
                                        <pre style={{
                                            marginTop: "0.5rem",
                                            padding: "0.5rem",
                                            background: "#f3f4f6",
                                            borderRadius: "4px",
                                            fontSize: "0.75rem",
                                            overflow: "auto",
                                            maxHeight: "200px"
                                        }}>
                                            {JSON.stringify(data.data, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Recommendations */}
            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#eff6ff", borderRadius: "8px" }}>
                <h2>📋 Recommendations</h2>

                {results.batches?.blocked && (
                    <div style={{ marginBottom: "1rem", padding: "1rem", background: "#fee2e2", borderRadius: "4px" }}>
                        <strong>🔴 CRITICAL:</strong> Batches collection is blocked by Firestore rules.
                        <br />
                        <strong>Action:</strong> Deploy updated firestore.rules via Firebase Console
                    </div>
                )}

                {!hasData && (
                    <div style={{ marginBottom: "1rem", padding: "1rem", background: "#fef3c7", borderRadius: "4px" }}>
                        <strong>⚠️ WARNING:</strong> Database is empty.
                        <br />
                        <strong>Action:</strong> Go to <a href="/dashboard/manage">/dashboard/manage</a> to create structure
                    </div>
                )}

                {totalFiles === 0 && hasData && (
                    <div style={{ marginBottom: "1rem", padding: "1rem", background: "#fef3c7", borderRadius: "4px" }}>
                        <strong>⚠️ INFO:</strong> Structure exists but no files uploaded.
                        <br />
                        <strong>Action:</strong> Go to <a href="/dashboard">/dashboard</a> to upload files
                    </div>
                )}

                {totalFiles > 0 && (
                    <div style={{ padding: "1rem", background: "#d1fae5", borderRadius: "4px" }}>
                        <strong>✅ SUCCESS:</strong> {totalFiles} files found in database!
                        <br />
                        <strong>Next:</strong> Check if they're linked to correct departments/batches/semesters
                    </div>
                )}
            </div>

            {/* Data Integrity Check */}
            {totalFiles > 0 && (
                <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "8px" }}>
                    <h2>🔍 Data Integrity Check</h2>
                    {results.notes.data.map((note: any, idx: number) => (
                        <div key={idx} style={{
                            marginBottom: "0.5rem",
                            padding: "0.75rem",
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            fontSize: "0.85rem"
                        }}>
                            <strong>{note.title}</strong>
                            <div style={{ marginTop: "0.25rem", color: "#6b7280" }}>
                                Dept: {note.departmentId || "❌ Missing"} |
                                Batch: {note.batchId || "❌ Missing"} |
                                Sem: {note.semesterId || "❌ Missing"} |
                                Subject: {note.subjectId || "❌ Missing"}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
