"use client";

import { useState, useEffect } from "react";
import {
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    getBatches, createBatch, updateBatch, deleteBatch,
    getSemesters, createSemester, updateSemester, deleteSemester,
    getSubjects, createSubject, updateSubject, deleteSubject,
    getNotes, deleteNote
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useUndo } from "@/context/UndoContext";
import { ArrowLeft, Plus, ChevronRight, Pencil, Trash2, FileText, X } from "lucide-react";

export default function ManageStructurePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { scheduleDelete } = useUndo();

    const [departments, setDepartments] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);

    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [selectedSem, setSelectedSem] = useState<any>(null);
    const [selectedSub, setSelectedSub] = useState<any>(null);

    // Separate creation states
    const [newDeptName, setNewDeptName] = useState("");
    const [newBatchName, setNewBatchName] = useState("");
    const [newSemName, setNewSemName] = useState("");
    const [newSubName, setNewSubName] = useState("");

    const [isCreating, setIsCreating] = useState(false);

    // Edit State
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        if (!loading && !user) router.push("/auth/login");
    }, [user, loading, router]);

    useEffect(() => { loadDepartments(); }, []);
    useEffect(() => { if (selectedDept) loadBatches(selectedDept.id); }, [selectedDept]);
    useEffect(() => { if (selectedBatch) loadSemesters(selectedBatch.id); }, [selectedBatch]);
    useEffect(() => { if (selectedSem) loadSubjects(selectedSem.id); }, [selectedSem]);
    useEffect(() => { if (selectedSub) loadNotes(selectedSub.id); }, [selectedSub]);

    async function loadDepartments() {
        const depts = await getDepartments();
        setDepartments(depts);
        if (depts.length > 0 && !selectedDept) {
            // Optional: Auto-select first dept? Maybe NO, to avoid confusion?
            // Let's keep auto-select off or only if user hasn't selected anything?
            // Actually, auto-selecting can be annoying if I'm trying to create a new one.
            // Let's NOT auto-select for now to simplify.
            // if (!selectedDept) setSelectedDept(depts[0]);
        }
    }
    async function loadBatches(deptId: string) { setBatches(await getBatches(deptId)); }
    async function loadSemesters(batchId: string) { setSemesters(await getSemesters(batchId)); }
    async function loadSubjects(semId: string) { setSubjects(await getSubjects(semId)); }
    async function loadNotes(subId: string) { setNotes(await getNotes(subId)); }

    async function handleCreateDept() {
        if (!newDeptName.trim()) return;
        setIsCreating(true);
        try {
            await createDepartment(newDeptName);
            await loadDepartments();
            setNewDeptName("");
        } catch (e) { console.error(e); alert("Failed to create."); }
        finally { setIsCreating(false); }
    }

    async function handleCreateBatch() {
        if (!newBatchName.trim() || !selectedDept) return;
        setIsCreating(true);
        try {
            await createBatch(selectedDept.id, newBatchName);
            await loadBatches(selectedDept.id);
            setNewBatchName("");
        } catch (e) { console.error(e); alert("Failed to create."); }
        finally { setIsCreating(false); }
    }

    async function handleCreateSem() {
        if (!newSemName.trim() || !selectedBatch) return;
        setIsCreating(true);
        try {
            await createSemester(selectedBatch.id, newSemName);
            await loadSemesters(selectedBatch.id);
            setNewSemName("");
        } catch (e) { console.error(e); alert("Failed to create."); }
        finally { setIsCreating(false); }
    }

    async function handleCreateSub() {
        if (!newSubName.trim() || !selectedSem) return;
        setIsCreating(true);
        try {
            await createSubject(selectedSem.id, newSubName);
            await loadSubjects(selectedSem.id);
            setNewSubName("");
        } catch (e) { console.error(e); alert("Failed to create."); }
        finally { setIsCreating(false); }
    }

    async function handleUpdate() {
        if (!editName.trim() || !editingItem) return;
        try {
            if (editingItem.type === 'dept') {
                await updateDepartment(editingItem.id, editName);
                await loadDepartments();
            } else if (editingItem.type === 'batch') {
                await updateBatch(editingItem.id, editName);
                await loadBatches(selectedDept.id);
            } else if (editingItem.type === 'sem') {
                await updateSemester(editingItem.id, editName);
                await loadSemesters(selectedBatch.id);
            } else if (editingItem.type === 'sub') {
                await updateSubject(editingItem.id, editName);
                await loadSubjects(selectedSem.id);
            }
            setEditingItem(null);
            setEditName("");
        } catch (e) { console.error(e); alert("Failed to update."); }
    }

    async function handleDelete(item: any, type: 'dept' | 'batch' | 'sem' | 'sub' | 'note') {
        // Optimistic UI Update & Undo Callback setup
        let undoCallback: () => void = () => { };

        if (type === 'dept') {
            setDepartments(prev => prev.filter(d => d.id !== item.id));
            if (selectedDept?.id === item.id) setSelectedDept(null);
            undoCallback = () => {
                setDepartments(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
                // optionally restore selection if desired, but might be confusing
            };

            scheduleDelete(item.id, async () => {
                await deleteDepartment(item.id);
            }, `Department '${item.name}'`, undoCallback);

        } else if (type === 'batch') {
            setBatches(prev => prev.filter(b => b.id !== item.id));
            if (selectedBatch?.id === item.id) setSelectedBatch(null);
            undoCallback = () => {
                setBatches(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
            };

            scheduleDelete(item.id, async () => {
                await deleteBatch(item.id);
            }, `Batch '${item.name}'`, undoCallback);

        } else if (type === 'sem') {
            setSemesters(prev => prev.filter(s => s.id !== item.id));
            if (selectedSem?.id === item.id) setSelectedSem(null);
            undoCallback = () => {
                setSemesters(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
            };

            scheduleDelete(item.id, async () => {
                await deleteSemester(item.id);
            }, `Semester '${item.name}'`, undoCallback);

        } else if (type === 'sub') {
            setSubjects(prev => prev.filter(s => s.id !== item.id));
            if (selectedSub?.id === item.id) setSelectedSub(null);
            undoCallback = () => {
                setSubjects(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
            };

            scheduleDelete(item.id, async () => {
                await deleteSubject(item.id);
            }, `Subject '${item.name}'`, undoCallback);

        } else if (type === 'note') {
            setNotes(prev => prev.filter(n => n.id !== item.id));
            undoCallback = () => {
                setNotes(prev => [item, ...prev]); // Prepend assuming desc order
            };

            scheduleDelete(item.id, async () => {
                await deleteNote(item.id);
            }, `Note '${item.title}'`, undoCallback);
        }
    }

    const startEdit = (item: any, type: string) => {
        setEditingItem({ ...item, type });
        setEditName(item.name);
    };

    if (loading || !user) return null;

    return (
        <div className="container">
            <button onClick={() => router.back()} className="btn btn-outline" style={{ marginBottom: "2rem", border: "none", paddingLeft: 0 }}>
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem" }}>Manage Structure & Content</h1>

            {/* Edit Modal / Overlay */}
            {editingItem && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="card" style={{ width: "400px" }}>
                        <h3>Edit {editingItem.type === 'dept' ? 'Department' : editingItem.type === 'batch' ? 'Batch' : editingItem.type === 'sem' ? 'Semester' : 'Subject'}</h3>
                        <input
                            value={editName} onChange={e => setEditName(e.target.value)}
                            className="form-input" style={{ width: "100%", padding: "0.5rem", marginTop: "1rem", marginBottom: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
                        />
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                            <button onClick={() => setEditingItem(null)} className="btn btn-outline">Cancel</button>
                            <button onClick={handleUpdate} className="btn btn-primary">Save</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>

                {/* 1. Departments */}
                <div className="card">
                    <h3 style={{ marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>Departments</h3>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                        <input className="form-input" placeholder="New Dept..."
                            value={newDeptName} onChange={e => setNewDeptName(e.target.value)}
                            style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }} />
                        <button className="btn btn-primary" onClick={handleCreateDept} disabled={!newDeptName.trim() || isCreating} style={{ padding: "0.5rem" }}><Plus size={20} /></button>
                    </div>
                    <ul style={{ listStyle: "none" }}>
                        {departments.map(d => (
                            <li key={d.id} className="list-item" style={{
                                padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.25rem", cursor: "pointer",
                                background: selectedDept?.id === d.id ? "var(--primary)" : "transparent", color: selectedDept?.id === d.id ? "white" : "inherit",
                                display: "flex", justifyContent: "space-between", alignItems: "center"
                            }} onClick={() => { setSelectedDept(d); setSelectedSem(null); setSelectedSub(null); }}>
                                <span>{d.name}</span>
                                {selectedDept?.id !== d.id && (
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <button onClick={(e) => { e.stopPropagation(); startEdit(d, 'dept'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Pencil size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(d, 'dept'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Trash2 size={14} /></button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 2. Batches */}
                {selectedDept && (
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                            <h3>Batches</h3>
                            <button onClick={() => setSelectedDept(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                            <input className="form-input" placeholder="New Batch..."
                                value={newBatchName} onChange={e => setNewBatchName(e.target.value)}
                                style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }} />
                            <button className="btn btn-primary" onClick={handleCreateBatch} disabled={!newBatchName.trim() || isCreating} style={{ padding: "0.5rem" }}><Plus size={20} /></button>
                        </div>
                        <ul style={{ listStyle: "none" }}>
                            {batches.map(b => (
                                <li key={b.id} style={{
                                    padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.25rem", cursor: "pointer",
                                    background: selectedBatch?.id === b.id ? "var(--primary)" : "transparent", color: selectedBatch?.id === b.id ? "white" : "inherit",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }} onClick={() => { setSelectedBatch(b); setSelectedSem(null); setSelectedSub(null); }}>
                                    <span>{b.name}</span>
                                    {selectedBatch?.id !== b.id && (
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button onClick={(e) => { e.stopPropagation(); startEdit(b, 'batch'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Pencil size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(b, 'batch'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. Semesters */}
                {selectedBatch && (
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                            <h3>Semesters</h3>
                            <button onClick={() => setSelectedBatch(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                            <input className="form-input" placeholder="New Sem..."
                                value={newSemName} onChange={e => setNewSemName(e.target.value)}
                                style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }} />
                            <button className="btn btn-primary" onClick={handleCreateSem} disabled={!newSemName.trim() || isCreating} style={{ padding: "0.5rem" }}><Plus size={20} /></button>
                        </div>
                        <ul style={{ listStyle: "none" }}>
                            {semesters.map(s => (
                                <li key={s.id} style={{
                                    padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.25rem", cursor: "pointer",
                                    background: selectedSem?.id === s.id ? "var(--primary)" : "transparent", color: selectedSem?.id === s.id ? "white" : "inherit",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }} onClick={() => { setSelectedSem(s); setSelectedSub(null); }}>
                                    <span>{s.name}</span>
                                    {selectedSem?.id !== s.id && (
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button onClick={(e) => { e.stopPropagation(); startEdit(s, 'sem'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Pencil size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(s, 'sem'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. Subjects */}
                {selectedSem && (
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                            <h3>Subjects</h3>
                            <button onClick={() => setSelectedSem(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                            <input className="form-input" placeholder="New Sub..."
                                value={newSubName} onChange={e => setNewSubName(e.target.value)}
                                style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }} />
                            <button className="btn btn-primary" onClick={handleCreateSub} disabled={!newSubName.trim() || isCreating} style={{ padding: "0.5rem" }}><Plus size={20} /></button>
                        </div>
                        <ul style={{ listStyle: "none" }}>
                            {subjects.map(s => (
                                <li key={s.id} style={{
                                    padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.25rem", cursor: "pointer",
                                    background: selectedSub?.id === s.id ? "var(--primary)" : "transparent", color: selectedSub?.id === s.id ? "white" : "inherit",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }} onClick={() => { setSelectedSub(s); }}>
                                    <span>{s.name}</span>
                                    {selectedSub?.id !== s.id && (
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button onClick={(e) => { e.stopPropagation(); startEdit(s, 'sub'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Pencil size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(s, 'sub'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 4. Notes (Drill-down final level) */}
                {selectedSub && (
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                            <h3>Notes</h3>
                            <button onClick={() => setSelectedSub(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Managing notes for <strong>{selectedSub.name}</strong></p>

                        <ul style={{ listStyle: "none" }}>
                            {notes.length === 0 && <li style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No notes here. Use Dashboard to upload.</li>}
                            {notes.map(n => (
                                <li key={n.id} style={{
                                    padding: "0.5rem", borderBottom: "1px solid var(--border)",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FileText size={16} color="var(--primary)" />
                                        <span style={{ fontSize: "0.95rem" }}>{n.title}</span>
                                    </div>
                                    <button onClick={() => handleDelete(n, 'note')} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }} title="Delete Note">
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>
        </div>
    );
}
