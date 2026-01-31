"use client";

import { useState, useEffect } from "react";
import {
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    // getBatches, createBatch, updateBatch, deleteBatch, // Batches removed
    getSemesters, createSemester, updateSemester, deleteSemester,
    getSubjects, createSubject, updateSubject, deleteSubject,
    getFolders, createFolder, updateFolder, deleteFolder,
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
    // const [batches, setBatches] = useState<any[]>([]); // Removed
    const [semesters, setSemesters] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);

    const [selectedDept, setSelectedDept] = useState<any>(null);
    // const [selectedBatch, setSelectedBatch] = useState<any>(null); // Removed
    const [selectedSem, setSelectedSem] = useState<any>(null);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [selectedFolder, setSelectedFolder] = useState<any>(null);

    // Separate creation states
    const [newDeptName, setNewDeptName] = useState("");
    // const [newBatchName, setNewBatchName] = useState(""); // Removed
    const [newSemName, setNewSemName] = useState("");
    const [newSubName, setNewSubName] = useState("");
    const [newFolderName, setNewFolderName] = useState("");

    const [isCreating, setIsCreating] = useState(false);

    // Edit State
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        if (!loading && !user) router.push("/auth/login");
    }, [user, loading, router]);

    useEffect(() => { loadDepartments(); }, []);
    useEffect(() => { loadDepartments(); }, []);
    useEffect(() => { if (selectedDept) loadSemesters(selectedDept.id); }, [selectedDept]);
    // useEffect(() => { if (selectedBatch) loadSemesters(selectedBatch.id); }, [selectedBatch]); // Removed
    useEffect(() => { if (selectedSem) loadSubjects(selectedSem.id); }, [selectedSem]);
    useEffect(() => { if (selectedSub) loadFolders(selectedSub.id); }, [selectedSub]);
    useEffect(() => { if (selectedSub) loadNotes(selectedSub.id); }, [selectedSub, selectedFolder]); // Reload notes when folder changes

    async function loadDepartments() {
        const depts = await getDepartments();
        setDepartments(depts);
    }
    // async function loadBatches(deptId: string) { setBatches(await getBatches(deptId)); }
    async function loadSemesters(deptId: string) { setSemesters(await getSemesters(deptId)); }
    async function loadSubjects(semId: string) { setSubjects(await getSubjects(semId)); }
    async function loadFolders(subId: string) { setFolders(await getFolders(subId)); }
    // async function loadNotes(subId: string) { setNotes(await getNotes(subId)); } // Replaced by filtering logic below or refined fetch 
    // Actually, getNotes gets ALL notes for subject. We can filter on client side or fetch by folder.
    // Let's stick to getNotes(subId) for simplicity and filter in UI for now, OR better:
    // If we want to see "General Notes" vs "Folder Notes", we might want to fetch all and filter.
    // BUT the notes list in this Manage view is for "Managing content".
    // Let's show ALL notes for the subject, but indicate which folder they are in, OR follow the drill down.
    // Let's follow drill down: Select Folder -> Show Notes in Folder. Select NULL Folder -> Show General Notes?
    // User requested "Folders" column. So:
    // Dept -> Batch -> Sem -> Sub -> [Folders List] -> [Notes List (filtered by selected folder)]
    async function loadNotes(subId: string) {
        // Fetch all notes for the subject to be safe, then we filter in UI or here?
        // Let's just use getNotes(subId) and filter by selectedFolder in render/state.
        // Wait, if I delete a folder, what happens to notes?
        // For now, simple fetch.
        const allNotes: any[] = await getNotes(subId);
        if (selectedFolder) {
            setNotes(allNotes.filter(n => n.folderId === selectedFolder.id));
        } else {
            // Show ONLY general notes (no folder) when no folder selected? 
            // OR show ALL notes if no folder selected?
            // "Manage Structure" usually implies drill down. 
            // Let's show General Notes (folderId is null) when 'General' is implicitly selected?
            // Actually, let's treat "No Folder Selected" as "Viewing General Notes" implies strict hierarchy.
            // Let's try: When Subject selected -> Show Folders AND "General Notes" pseudo-folder?
            // Or just: If File has no folder, it shows up when NO folder is selected.
            setNotes(allNotes.filter(n => !n.folderId));
        }
    }

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

    // Batch functions removed
    /*
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
    */

    async function handleCreateSem() {
        if (!newSemName.trim() || !selectedDept) return;
        setIsCreating(true);
        try {
            await createSemester(selectedDept.id, newSemName);
            await loadSemesters(selectedDept.id);
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

    async function handleCreateFolder() {
        if (!newFolderName.trim() || !selectedSub) return;
        setIsCreating(true);
        try {
            await createFolder({
                departmentId: selectedDept.id,
                batchId: null, // Batch removed
                semesterId: selectedSem.id,
                subjectId: selectedSub.id,
                name: newFolderName
            });
            await loadFolders(selectedSub.id);
            setNewFolderName("");
        } catch (e) { console.error(e); alert("Failed to create."); }
        finally { setIsCreating(false); }
    }

    async function handleUpdate() {
        if (!editName.trim() || !editingItem) return;
        try {
            if (editingItem.type === 'dept') {
                await updateDepartment(editingItem.id, editName);
                await loadDepartments();
                /*
                } else if (editingItem.type === 'batch') {
                    await updateBatch(editingItem.id, editName);
                    await loadBatches(selectedDept.id);
                */
            } else if (editingItem.type === 'sem') {
                await updateSemester(editingItem.id, editName);
                await loadSemesters(selectedDept.id);
            } else if (editingItem.type === 'sub') {
                await updateSubject(editingItem.id, editName);
                await loadSubjects(selectedSem.id);
            } else if (editingItem.type === 'folder') {
                await updateFolder(editingItem.id, editName);
                await loadFolders(selectedSub.id);
            }
            setEditingItem(null);
            setEditName("");
        } catch (e) { console.error(e); alert("Failed to update."); }
    }

    async function handleDelete(item: any, type: 'dept' | 'batch' | 'sem' | 'sub' | 'folder' | 'note') {
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

            /*
            } else if (type === 'batch') {
                // Batch logic removed
            */
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

        } else if (type === 'folder') {
            setFolders(prev => prev.filter(f => f.id !== item.id));
            if (selectedFolder?.id === item.id) setSelectedFolder(null);
            undoCallback = () => {
                setFolders(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
            };
            scheduleDelete(item.id, async () => {
                await deleteFolder(item.id);
            }, `Folder '${item.name}'`, undoCallback);

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
                        <h3>Edit {editingItem.type === 'dept' ? 'Department' : editingItem.type === 'sem' ? 'Semester' : editingItem.type === 'sub' ? 'Subject' : 'Folder'}</h3>
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
                            }} onClick={() => { setSelectedDept(d); setSelectedSem(null); setSelectedSub(null); setSelectedFolder(null); }}>
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

                {/* 2. Batches Removed */}

                {/* 3. Semesters */}
                {selectedDept && (
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                            <h3>Semesters</h3>
                            <button onClick={() => setSelectedDept(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
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
                                }} onClick={() => { setSelectedSem(s); setSelectedSub(null); setSelectedFolder(null); }}>
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
                {/* 4. Folders */}
                {selectedSub && (
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                            <h3>Folders</h3>
                            <button onClick={() => setSelectedSub(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                            <input className="form-input" placeholder="New Folder..."
                                value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }} />
                            <button className="btn btn-primary" onClick={handleCreateFolder} disabled={!newFolderName.trim() || isCreating} style={{ padding: "0.5rem" }}><Plus size={20} /></button>
                        </div>
                        <ul style={{ listStyle: "none" }}>
                            <li
                                style={{
                                    padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.25rem", cursor: "pointer",
                                    background: !selectedFolder ? "var(--primary)" : "transparent", color: !selectedFolder ? "white" : "inherit",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }}
                                onClick={() => setSelectedFolder(null)}
                            >
                                <span>Files / All</span>
                            </li>
                            {folders.map(f => (
                                <li key={f.id} style={{
                                    padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.25rem", cursor: "pointer",
                                    background: selectedFolder?.id === f.id ? "var(--primary)" : "transparent", color: selectedFolder?.id === f.id ? "white" : "inherit",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                }} onClick={() => setSelectedFolder(f)}>
                                    <span>{f.name}</span>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <button onClick={(e) => { e.stopPropagation(); startEdit(f, 'folder'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Pencil size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(f, 'folder'); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Trash2 size={14} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 5. Notes (Filtered by Folder) */}
                {selectedSub && (
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                            <h3>
                                {selectedFolder ? `Notes in ${selectedFolder.name}` : 'Files'}
                            </h3>
                            {selectedFolder && (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button onClick={() => startEdit(selectedFolder, 'folder')} className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "auto" }}>
                                        <Pencil size={14} /> Rename Folder
                                    </button>
                                    <button onClick={() => handleDelete(selectedFolder, 'folder')} className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "auto", color: "var(--danger)", borderColor: "var(--danger)" }}>
                                        <Trash2 size={14} /> Delete Folder
                                    </button>
                                </div>
                            )}
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                            Managing notes for <strong>{selectedSub.name}</strong> {selectedFolder ? ` > ${selectedFolder.name}` : ''}
                        </p>

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
