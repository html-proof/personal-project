"use client";

import { useEffect, useState } from "react";
import {
    getDepartments,
    getBatches,
    getSemesters,
    getSubjects,
    getNotes
} from "@/lib/firebase/firestore";
import { getAllNotes, getNoteStatistics, findOrphanedNotes } from "@/lib/firebase/migrations";

export default function DBDiagnosticPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string>("");
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [semesters, setSemesters] = useState<any[]>([]);
    const [selectedSemId, setSelectedSemId] = useState<string>("");
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubId, setSelectedSubId] = useState<string>("");
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    // Global diagnostics
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [statistics, setStatistics] = useState<any>(null);
    const [orphanedNotes, setOrphanedNotes] = useState<any[]>([]);
    const [showGlobalView, setShowGlobalView] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    async function loadDepartments() {
        try {
            setLoading(true);
            const data = await getDepartments();
            console.log("Departments loaded:", data);
            setDepartments(data);
        } catch (err: any) {
            console.error("Error loading departments:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadGlobalStatistics() {
        try {
            setLoading(true);
            setError("");
            const [stats, orphaned, all] = await Promise.all([
                getNoteStatistics(),
                findOrphanedNotes(),
                getAllNotes()
            ]);
            setStatistics(stats);
            setOrphanedNotes(orphaned);
            setAllNotes(all);
            setShowGlobalView(true);
        } catch (err: any) {
            console.error("Error loading statistics:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadBatches(deptId: string) {
        try {
            setLoading(true);
            setError("");
            console.log("Loading batches for department:", deptId);
            const data = await getBatches(deptId);
            console.log("Batches loaded:", data);
            setBatches(data);
            if (data.length === 0) {
                setError(`No batches found for department ID: ${deptId}`);
            }
        } catch (err: any) {
            console.error("Error loading batches:", err);
            setError(err.message);
            setBatches([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadSemesters(batchId: string) {
        try {
            setLoading(true);
            setError("");
            console.log("Loading semesters for batch:", batchId);
            const data = await getSemesters(batchId);
            console.log("Semesters loaded:", data);
            setSemesters(data);
            if (data.length === 0) {
                setError(`No semesters found for batch ID: ${batchId}`);
            }
        } catch (err: any) {
            console.error("Error loading semesters:", err);
            setError(err.message);
            setSemesters([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadSubjects(semId: string) {
        try {
            setLoading(true);
            setError("");
            console.log("Loading subjects for semester:", semId);
            const data = await getSubjects(semId);
            console.log("Subjects loaded:", data);
            setSubjects(data);
            if (data.length === 0) {
                setError(`No subjects found for semester ID: ${semId}`);
            }
        } catch (err: any) {
            console.error("Error loading subjects:", err);
            setError(err.message);
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadNotes(subId: string) {
        try {
            setLoading(true);
            setError("");
            console.log("Loading notes for subject:", subId);
            const data = await getNotes(subId);
            console.log("Notes loaded:", data);
            setNotes(data);
            if (data.length === 0) {
                setError(`No notes found for subject ID: ${subId}`);
            }
        } catch (err: any) {
            console.error("Error loading notes:", err);
            setError(err.message);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>🔍 Firebase Database Diagnostic</h1>
                <button
                    onClick={loadGlobalStatistics}
                    style={{
                        padding: "0.75rem 1.5rem",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600"
                    }}
                >
                    📊 Show Global Statistics
                </button>
            </div>

            {error && (
                <div style={{
                    background: "#fee",
                    border: "1px solid #fcc",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    color: "#c00"
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {loading && <p>Loading...</p>}

            {/* Global Statistics Panel */}
            {showGlobalView && statistics && (
                <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h2>📊 Global Database Statistics</h2>
                        <button
                            onClick={() => setShowGlobalView(false)}
                            style={{
                                padding: "0.5rem 1rem",
                                background: "#6b7280",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }}
                        >
                            Hide
                        </button>
                    </div>

                    {/* Statistics Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                        <div style={{ background: "#eff6ff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                            <h3 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#1e40af" }}>{statistics.total}</h3>
                            <p style={{ color: "#3b82f6", fontWeight: "600" }}>Total Notes</p>
                        </div>
                        <div style={{ background: "#d1fae5", padding: "1.5rem", borderRadius: "8px", border: "1px solid #6ee7b7" }}>
                            <h3 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#065f46" }}>{statistics.withSubject}</h3>
                            <p style={{ color: "#10b981", fontWeight: "600" }}>With Subject</p>
                        </div>
                        <div style={{ background: "#fee2e2", padding: "1.5rem", borderRadius: "8px", border: "1px solid #fca5a5" }}>
                            <h3 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#991b1b" }}>{statistics.orphaned}</h3>
                            <p style={{ color: "#ef4444", fontWeight: "600" }}>Orphaned (No Subject)</p>
                        </div>
                        <div style={{ background: "#fef3c7", padding: "1.5rem", borderRadius: "8px", border: "1px solid #fcd34d" }}>
                            <h3 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#92400e" }}>{statistics.invalid}</h3>
                            <p style={{ color: "#f59e0b", fontWeight: "600" }}>Invalid Structure</p>
                        </div>
                    </div>

                    {/* Orphaned Notes Details */}
                    {orphanedNotes.length > 0 && (
                        <div style={{ background: "#fee2e2", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
                            <h3 style={{ color: "#991b1b", marginBottom: "1rem" }}>⚠️ Orphaned Notes ({orphanedNotes.length})</h3>
                            <p style={{ marginBottom: "1rem", color: "#7f1d1d" }}>
                                These files exist but are missing critical metadata. Students cannot see them.
                            </p>
                            <div style={{ maxHeight: "300px", overflow: "auto" }}>
                                {orphanedNotes.map((note, idx) => (
                                    <div key={note.id} style={{ background: "white", padding: "1rem", marginBottom: "0.5rem", borderRadius: "6px" }}>
                                        <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>{idx + 1}. {note.title}</p>
                                        <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                            ID: {note.id}<br />
                                            Missing: {!note.subjectId && "subjectId "}
                                            {!note.departmentId && "departmentId "}
                                            {!note.batchId && "batchId "}
                                            {!note.semesterId && "semesterId"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Notes */}
                    <div style={{ background: "#f9fafb", padding: "1.5rem", borderRadius: "8px" }}>
                        <h3 style={{ marginBottom: "1rem" }}>📄 All Notes in Database ({allNotes.length})</h3>
                        <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "6px", overflow: "auto", maxHeight: "400px", fontSize: "0.85rem" }}>
                            {JSON.stringify(allNotes, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            <div style={{ display: "grid", gap: "2rem" }}>
                {/* Departments */}
                <div>
                    <h2>Departments ({departments.length})</h2>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {departments.map(d => (
                            <button
                                key={d.id}
                                onClick={() => {
                                    setSelectedDeptId(d.id);
                                    loadBatches(d.id);
                                    setBatches([]);
                                    setSemesters([]);
                                    setSubjects([]);
                                    setNotes([]);
                                }}
                                style={{
                                    padding: "0.5rem 1rem",
                                    background: selectedDeptId === d.id ? "#3b82f6" : "#e5e7eb",
                                    color: selectedDeptId === d.id ? "white" : "black",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                }}
                            >
                                {d.name} (ID: {d.id})
                            </button>
                        ))}
                    </div>
                    <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "6px", marginTop: "1rem", overflow: "auto" }}>
                        {JSON.stringify(departments, null, 2)}
                    </pre>
                </div>

                {/* Batches */}
                {selectedDeptId && (
                    <div>
                        <h2>Batches for {selectedDeptId} ({batches.length})</h2>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {batches.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => {
                                        setSelectedBatchId(b.id);
                                        loadSemesters(b.id);
                                        setSemesters([]);
                                        setSubjects([]);
                                        setNotes([]);
                                    }}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        background: selectedBatchId === b.id ? "#3b82f6" : "#e5e7eb",
                                        color: selectedBatchId === b.id ? "white" : "black",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    {b.name} (ID: {b.id})
                                </button>
                            ))}
                        </div>
                        <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "6px", marginTop: "1rem", overflow: "auto" }}>
                            {JSON.stringify(batches, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Semesters */}
                {selectedBatchId && (
                    <div>
                        <h2>Semesters for {selectedBatchId} ({semesters.length})</h2>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {semesters.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        setSelectedSemId(s.id);
                                        loadSubjects(s.id);
                                        setSubjects([]);
                                        setNotes([]);
                                    }}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        background: selectedSemId === s.id ? "#3b82f6" : "#e5e7eb",
                                        color: selectedSemId === s.id ? "white" : "black",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    {s.name} (ID: {s.id})
                                </button>
                            ))}
                        </div>
                        <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "6px", marginTop: "1rem", overflow: "auto" }}>
                            {JSON.stringify(semesters, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Subjects */}
                {selectedSemId && (
                    <div>
                        <h2>Subjects for {selectedSemId} ({subjects.length})</h2>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {subjects.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        setSelectedSubId(s.id);
                                        loadNotes(s.id);
                                        setNotes([]);
                                    }}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        background: selectedSubId === s.id ? "#3b82f6" : "#e5e7eb",
                                        color: selectedSubId === s.id ? "white" : "black",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    {s.name} (ID: {s.id})
                                </button>
                            ))}
                        </div>
                        <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "6px", marginTop: "1rem", overflow: "auto" }}>
                            {JSON.stringify(subjects, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Notes */}
                {selectedSubId && (
                    <div>
                        <h2>Notes for {selectedSubId} ({notes.length})</h2>
                        <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "6px", marginTop: "1rem", overflow: "auto" }}>
                            {JSON.stringify(notes, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
