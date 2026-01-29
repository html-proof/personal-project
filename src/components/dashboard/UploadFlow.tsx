"use client";

import { useState, useEffect } from "react";
import { UploadCloud, File, Film, Image as ImageIcon, CheckCircle, XCircle, Trash2 } from "lucide-react";
import {
    getDepartments,
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
import styles from "./UploadFlow.module.css";

export default function UploadFlow() {
    const { user } = useAuth();
    const { addToast } = useToast();

    // Selection State
    const [departments, setDepartments] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSem, setSelectedSem] = useState("");
    const [selectedSub, setSelectedSub] = useState("");
    const [selectedFolder, setSelectedFolder] = useState("");

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

    // Load Semesters when Dept changes
    useEffect(() => {
        if (!selectedDept) {
            setSemesters([]);
            return;
        }
        async function loadSems() {
            const sems = await getSemesters(selectedDept);
            setSemesters(sems);
        }
        loadSems();
    }, [selectedDept]);

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

    // Load Folders when Subject changes
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
        if (!newFolderName.trim() || !selectedSub) return;
        try {
            await createFolder({
                subjectId: selectedSub,
                departmentId: selectedDept, // Denormalize for easier querying if needed
                name: newFolderName.trim(),
                createdBy: user?.uid
            });
            setNewFolderName("");
            setIsCreatingFolder(false);
            // Reload folders
            const f = await getFolders(selectedSub);
            setFolders(f);
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
        const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        newFiles.forEach(file => {
            if (file.size <= MAX_SIZE) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            addToast(`Skipped files larger than 50MB: ${invalidFiles.join(", ")}`, "warning");
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
        if (!selectedDept || !selectedSem || !selectedSub || files.length === 0 || !user) return;

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
                        subjectId: selectedSub,
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
                        semesterId: selectedSem,
                        subjectId: selectedSub,
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
                <div className={styles.grid}>
                    <select
                        value={selectedDept}
                        onChange={(e) => { setSelectedDept(e.target.value); setSelectedSem(""); setSelectedSub(""); }}
                        className={styles.select}
                    >
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>

                    <select
                        value={selectedSem}
                        onChange={(e) => { setSelectedSem(e.target.value); setSelectedSub(""); }}
                        className={styles.select}
                        disabled={!selectedDept}
                    >
                        <option value="">Select Semester</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <select
                        value={selectedSub}
                        onChange={(e) => setSelectedSub(e.target.value)}
                        className={styles.select}
                        disabled={!selectedSem}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {/* Folder Selection (Flexible/Optional) */}
                {selectedSub && (
                    <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                                Select Folder (Optional)
                            </label>
                            <select
                                value={selectedFolder}
                                onChange={(e) => setSelectedFolder(e.target.value)}
                                className={styles.select}
                                style={{ width: "100%" }}
                            >
                                <option value="">General Notes (No Folder)</option>
                                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                            {!isCreatingFolder ? (
                                <button
                                    onClick={() => setIsCreatingFolder(true)}
                                    className="btn btn-outline"
                                    style={{ height: "42px", display: "flex", alignItems: "center", gap: "0.5rem" }}
                                >
                                    <FolderPlus size={18} /> Create Folder
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <input
                                        type="text"
                                        placeholder="Folder Name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        className={styles.input}
                                        style={{ height: "42px", padding: "0 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}
                                    />
                                    <button onClick={handleCreateFolder} className="btn btn-primary" style={{ height: "42px" }}>Save</button>
                                    <button onClick={() => setIsCreatingFolder(false)} className="btn btn-ghost" style={{ height: "42px" }}>Cancel</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Upload Zone */}
            <div className={styles.section}>
                <h3 className={styles.stepTitle}>2. Upload Files</h3>

                <div
                    className={styles.dropzone}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("fileInput")?.click()}
                >
                    <p className={styles.dropText}>
                        Drag & drop files here <span onClick={(e) => { e.stopPropagation(); document.getElementById("fileInput")?.click() }}>upload file</span> or <span onClick={(e) => { e.stopPropagation(); document.getElementById("folderInput")?.click() }}>upload folder</span> (up to 50MB)
                    </p>
                    <input
                        type="file"
                        id="fileInput"
                        hidden
                        multiple // Enable multiple files
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
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.75rem" }}>
                        {files.map((f, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: "1rem",
                                background: "#f9fafb", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb"
                            }}>
                                {getFileIcon(f.type)}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 500, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</p>
                                    <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>{(f.size / 1024 / 1024).toFixed(2)} MB</p>
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
            </div>

            {/* 3. Submit */}
            <div className={styles.actions}>
                <button
                    className={`btn btn-primary ${styles.submitBtn}`}
                    onClick={handleSubmit}
                    disabled={files.length === 0 || !selectedSub || uploading}
                >
                    {uploading ? 'Uploading Files...' : `✅ Upload ${files.length > 0 ? files.length : ''} Files`}
                </button>
            </div>
        </div >
    );
}
