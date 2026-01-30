"use client";

import { useState, useEffect } from "react";
import { UploadCloud, File, Film, Image as ImageIcon, CheckCircle, XCircle, Trash2 } from "lucide-react";
import {
    getDepartments,
    getBatches,
    getSemesters,
    getSubjects,
    getFolders,
    createFolder,
    createNote
} from "@/lib/firebase/firestore";
import { FolderPlus, Folder } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import { useAuth } from "@/lib/firebase/auth";
import { useToast } from "@/context/ToastContext";
import { CONFIG, isAllowedFileType, sanitizeInput } from "@/lib/config";
import styles from "./UploadFlow.module.css";

export default function UploadFlow() {
    const { user } = useAuth();
    const { addToast } = useToast();

    // Selection State
    const [departments, setDepartments] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedDept, setSelectedDept] = useState("");
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedSem, setSelectedSem] = useState("");
    const [selectedSub, setSelectedSub] = useState("");
    const [selectedFolder, setSelectedFolder] = useState("");

    // Selection Completeness Check
    const isSelectionComplete = selectedDept && selectedBatch && selectedSem;

    // Folder State
    const [folders, setFolders] = useState<any[]>([]);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Files State (Array)
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<{ [key: string]: string }>({}); // Track status per file name

    // Load Departments on mount
    useEffect(() => {
        async function loadDepts() {
            const depts = await getDepartments();
            setDepartments(depts);
            if (depts.length > 0) {
                setSelectedDept(depts[0].id);
            }
        }
        loadDepts();
    }, []);

    // Load Batches when Dept changes
    useEffect(() => {
        if (!selectedDept) {
            setBatches([]);
            return;
        }
        async function loadBatches() {
            const b = await getBatches(selectedDept);
            setBatches(b);
        }
        loadBatches();
    }, [selectedDept]);

    // Load Semesters when Batch changes
    useEffect(() => {
        if (!selectedBatch) {
            setSemesters([]);
            return;
        }
        async function loadSems() {
            const sems = await getSemesters(selectedBatch);
            setSemesters(sems);
        }
        loadSems();
    }, [selectedBatch]);

    // Load Subjects when Sem changes
    useEffect(() => {
        if (!selectedSem) {
            setSubjects([]);
            return;
        }
        async function loadSubs() {
            const subs = await getSubjects(selectedSem);
            setSubjects(subs);
        }
        loadSubs();
    }, [selectedSem]);

    // Load Folders when Semester changes (Previously Subject) - Now optional?
    // If we removed Subject selection, we should load folders based on Semester?
    // Current backend expects subjectId. If selectedSub is empty, folders won't load.
    // We'll leave this effectively disabled for now unless we update backend to fetch by Semester.
    // Or we simply check validation.
    useEffect(() => {
        if (!selectedSub) {
            setFolders([]);
            return;
        }
        async function loadFolders() {
            const f = await getFolders(selectedSub);
            setFolders(f);
        }
        loadFolders();
    }, [selectedSub]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return; // Removed selectedSub check
        try {
            const ref = await createFolder({
                subjectId: selectedSub || "general", // Fallback or empty? Schema might require string.
                semesterId: selectedSem,
                batchId: selectedBatch,
                departmentId: selectedDept,
                name: sanitizeInput(newFolderName.trim()),
                createdBy: user?.uid
            });
            setNewFolderName("");
            setIsCreatingFolder(false);

            // Reload folders and select the new one
            if (selectedSub) {
                const f = await getFolders(selectedSub);
                setFolders(f);
            }
            // Auto-select the new folder
            setSelectedFolder(ref.id);
            addToast(`Folder '${newFolderName}' created and selected`, "success");

        } catch (error) {
            console.error("Failed to create folder", error);
            addToast("Failed to create folder", "error");
        }
    };

    // Handle Drag & Drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) addFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (newFiles: File[]) => {
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];
        const unsupportedFiles: string[] = [];

        newFiles.forEach(file => {
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                invalidFiles.push(file.name);
            } else if (!isAllowedFileType(file.type)) {
                unsupportedFiles.push(file.name);
            } else {
                validFiles.push(file);
            }
        });

        if (invalidFiles.length > 0) {
            addToast(`Files larger than 50MB were skipped: ${invalidFiles.join(", ")}`, "warning");
        }

        if (unsupportedFiles.length > 0) {
            addToast(`Unsupported file types were skipped: ${unsupportedFiles.join(", ")}`, "warning");
        }

        setFiles(prev => [...prev, ...validFiles]);
        if (validFiles.length > 0) {
            addToast("Your files are chosen, please check them once before uploading.", "info");
        }
    };

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Folder name detection if needed, or just add all files
            // Logic to preserve folder structure is in handleSubmit using webkitRelativePath
            addFiles(newFiles);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (type: string) => {
        if (type.includes("pdf")) return <File size={32} className={styles.iconDoc} />;
        if (type.includes("video")) return <Film size={32} className={styles.iconVid} />;
        if (type.includes("image")) return <ImageIcon size={32} className={styles.iconImg} />;
        return <UploadCloud size={32} />;
    };

    const handleSubmit = async () => {
        if (!selectedDept || !selectedBatch || !selectedSem || files.length === 0 || !user) return; // Removed selectedSub check

        setUploading(true);
        const newProgress: any = {};

        // 0. Pre-process Folders from webkitRelativePath
        const folderMap = new Map<string, string>(); // Name -> ID

        // Use a set to track which folders we need to maybe create
        const neededFolders = new Set<string>();

        if (!selectedFolder) {
            files.forEach(f => {
                if (f.webkitRelativePath) {
                    const topFolder = f.webkitRelativePath.split('/')[0];
                    if (topFolder && topFolder !== f.name) {
                        neededFolders.add(topFolder);
                    }
                }
            });
        }

        try {
            // Create folders if they don't exist
            for (const folderName of Array.from(neededFolders)) {
                // Check if already exists in current loaded folders
                const existing = folders.find(f => f.name === folderName);
                if (existing) {
                    folderMap.set(folderName, existing.id);
                } else {
                    // Create it
                    const ref = await createFolder({
                        subjectId: selectedSub || "general",
                        semesterId: selectedSem,
                        batchId: selectedBatch,
                        departmentId: selectedDept,
                        name: folderName,
                        createdBy: user.uid
                    });
                    folderMap.set(folderName, ref.id);
                }
            }

            // Reload folders if we created any
            if (neededFolders.size > 0) {
                const f = await getFolders(selectedSub);
                setFolders(f);
            }

            // Upload files sequentially or parallel. Parallel is faster.
            await Promise.all(files.map(async (file) => {
                newProgress[file.name] = "uploading";
                setProgress({ ...newProgress });

                try {
                    // Determine Folder ID
                    let targetFolderId = selectedFolder || null;
                    if (!targetFolderId && file.webkitRelativePath) {
                        const topFolder = file.webkitRelativePath.split('/')[0];
                        if (folderMap.has(topFolder)) {
                            targetFolderId = folderMap.get(topFolder) || null;
                        }
                    }

                    // 1. Upload File
                    // Use timestamp to attempt uniqueness, but better to use UUID or similar if high collision risk.
                    const uniqueId = Math.random().toString(36).substring(2, 10);
                    const path = `uploads/${user.uid}/${Date.now()}_${uniqueId}_${file.name}`;
                    const url = await uploadFile(file, path);

                    // 2. Create Note Record
                    await createNote({
                        departmentId: selectedDept,
                        batchId: selectedBatch,
                        semesterId: selectedSem,
                        subjectId: selectedSub || "general", // Fallback
                        // Use webkitRelativePath for folder structure if available
                        folderId: targetFolderId,
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        fileUrl: url,
                        fileType: file.type,
                        uploadedBy: user.uid
                    });

                    newProgress[file.name] = "success";
                } catch (error) {
                    console.error(`Failed to upload ${file.name}`, error);
                    newProgress[file.name] = "error";
                }
                setProgress({ ...newProgress });
            }));

            // Determine if clear or keep based on errors.
            const hasError = Object.values(newProgress).includes("error");
            if (!hasError) {
                setTimeout(() => {
                    setFiles([]);
                    setProgress({});
                    addToast("Uploading done successful!", "success");
                    setUploading(false);
                }, 2000);
            } else {
                setUploading(false);
                addToast("Some files failed to upload.", "error");
            }

        } catch (err) {
            console.error(err);
            addToast("Upload process failed.", "error");
            setUploading(false);
        }
    };

    return (
        <div className={`card ${styles.wrapper}`}>
            <h2 className={styles.title}>Upload Note</h2>

            {/* 1. Structure Selection */}
            <div className={styles.section}>
                <h3 className={styles.stepTitle}>1. Select Structure</h3>
                {departments.length === 0 && <p className="text-danger">No departments found. Please create structure in Manage page first.</p>}

                <div className={styles.grid}>
                    <select
                        value={selectedDept}
                        onChange={(e) => { setSelectedDept(e.target.value); setSelectedBatch(""); setSelectedSem(""); setSelectedSub(""); }}
                        className={styles.select}
                    >
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>

                    <select
                        value={selectedBatch}
                        onChange={(e) => { setSelectedBatch(e.target.value); setSelectedSem(""); setSelectedSub(""); }}
                        className={styles.select}
                        disabled={!selectedDept}
                    >
                        <option value="">Select Batch</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <select
                        value={selectedSem}
                        onChange={(e) => { setSelectedSem(e.target.value); setSelectedSub(""); }}
                        className={styles.select}
                        disabled={!selectedBatch}
                    >
                        <option value="">Select Semester</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    {/* Subject Selection Removed as requested */}
                </div>
            </div>

            {/* 2. Upload Actions (Always visible, disabled if not selected) */}
            <div className={styles.section} style={{
                opacity: isSelectionComplete ? 1 : 0.5,
                pointerEvents: isSelectionComplete ? "auto" : "none",
                transition: "opacity 0.3s"
            }}>
                <h3 className={styles.stepTitle}>2. Choose Upload Method (Optional)</h3>
                {!isSelectionComplete && <p style={{ color: "var(--primary)", fontWeight: 500, marginBottom: "1rem" }}>Please select Department, Batch, and Semester to enable upload options.</p>}

                {/* Folder Selection / Creation Area - Integrated nicely */}
                <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Target Folder (Optional)</label>
                        {!isCreatingFolder && (
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="btn-text"
                                style={{ color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: "none", border: "none" }}
                            >
                                + Create New Folder
                            </button>
                        )}
                    </div>

                    {isCreatingFolder ? (
                        <div style={{ display: "flex", gap: "0.5rem", animation: "slideDown 0.2s" }}>
                            <input
                                type="text"
                                placeholder="Folder Name (e.g. Module 1)"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className={styles.input}
                                style={{ flex: 1 }}
                            />
                            <button onClick={handleCreateFolder} className="btn btn-primary" style={{ padding: "0 1rem" }}>Save</button>
                            <button onClick={() => setIsCreatingFolder(false)} className="btn btn-ghost">Cancel</button>
                        </div>
                    ) : (
                        <select
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                            className={styles.select}
                            style={{ width: "100%", background: "var(--surface)", color: "var(--text-main)" }}
                        >
                            <option value="">General Notes (Root)</option>
                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    )}
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        {selectedFolder
                            ? "Files will be uploaded into this folder."
                            : "Files will be uploaded to 'General Notes' unless they are inside a folder you drag-and-drop."}
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    {/* Option A: Upload Files */}
                    <div
                        className={styles.uploadOption}
                        onClick={() => document.getElementById("fileInput")?.click()}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                    >
                        <File size={40} color="var(--primary)" style={{ marginBottom: "1rem" }} />
                        <h4 style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-main)" }}>Upload Files</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>PDFs, Videos, Images</p>
                        <button className="btn btn-primary" style={{ pointerEvents: "none" }}>Select Files</button>
                    </div>

                    {/* Option B: Upload Folder */}
                    <div
                        className={styles.uploadOption}
                        onClick={() => document.getElementById("folderInput")?.click()}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                    >
                        <FolderPlus size={40} color="#a855f7" style={{ marginBottom: "1rem" }} />
                        <h4 style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-main)" }}>Upload Entire Folder</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Keeps nested structure</p>
                        <button className="btn btn-outline" style={{ pointerEvents: "none" }}>Select Folder</button>
                    </div>
                </div>

                {/* Hidden Inputs */}
                <input
                    type="file"
                    id="fileInput"
                    hidden
                    multiple
                    onChange={handleFileSelect}
                />
                <input
                    type="file"
                    id="folderInput"
                    hidden
                    multiple
                    {...{ webkitdirectory: "", directory: "" } as any}
                    onChange={handleFolderSelect}
                />

                {/* Drag Drop Fallback / Information */}
                <div
                    className={styles.dropzone}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border)"; }}
                    onDrop={handleDrop}
                    style={{ padding: "3rem", background: "var(--surface)", border: "2px dashed var(--border)", borderRadius: "12px", textAlign: "center" }}
                >
                    <p style={{ fontWeight: 500, color: "var(--text-muted)" }}>Or visually drag & drop files or folders here</p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.75rem" }}>
                        <h4 style={{ fontSize: "1rem", fontWeight: 600 }}>Ready to Upload ({files.length})</h4>
                        {files.map((f, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: "1rem",
                                background: "var(--surface)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)",
                                boxShadow: "var(--shadow-sm)"
                            }}>
                                {getFileIcon(f.type)}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 500, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-main)" }}>
                                        {f.webkitRelativePath || f.name}
                                    </p>
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>

                                {progress[f.name] === 'uploading' && <span style={{ fontSize: "0.8rem", color: "var(--primary)" }}>Uploading...</span>}
                                {progress[f.name] === 'success' && <CheckCircle size={20} color="#16a34a" />}
                                {progress[f.name] === 'error' && <XCircle size={20} color="#dc2626" />}

                                {!uploading && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit Button */}
                <div className={styles.actions} style={{ marginTop: "2rem" }}>
                    <button
                        className={`btn btn-primary ${styles.submitBtn}`}
                        onClick={handleSubmit}
                        disabled={files.length === 0 || uploading}
                        style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", fontWeight: 600 }}
                    >
                        {uploading ? 'Uploading Files...' : `Start Upload`}
                    </button>
                </div>
            </div>
        </div >
    );
}
