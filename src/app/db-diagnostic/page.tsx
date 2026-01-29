"use client";

import { useEffect, useState } from "react";
import {
    getDepartments,
    getBatches,
    getSemesters,
    getSubjects,
    getNotes
} from "@/lib/firebase/firestore";

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
            <h1 style={{ marginBottom: "2rem" }}>🔍 Firebase Database Diagnostic</h1>

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
