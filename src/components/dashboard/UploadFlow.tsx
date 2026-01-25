"use client";

import { useState, useEffect } from "react";
import { UploadCloud, File, Film, Image as ImageIcon, CheckCircle, XCircle, Trash2 } from "lucide-react";
import {
    getDepartments,
    getSemesters,
    getSubjects,
    createNote
} from "@/lib/firebase/firestore";
import { uploadFile } from "@/lib/supabase/storage";
import { useAuth } from "@/lib/firebase/auth";
import styles from "./UploadFlow.module.css";

export default function UploadFlow() {
    const { user } = useAuth();

    // Selection State
    const [departments, setDepartments] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSem, setSelectedSem] = useState("");
    const [selectedSub, setSelectedSub] = useState("");

    // Files State (Array)
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<{ [key: string]: string }>({}); // Track status per file name
    const [message, setMessage] = useState("");

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
            setMessage(`Skipped files larger than 50MB: ${invalidFiles.join(", ")}`);
        } else {
            setMessage("");
        }

        setFiles(prev => [...prev, ...validFiles]);
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
        setMessage("");
        const newProgress: any = {};

        try {
            // Upload files sequentially or parallel. Parallel is faster.
            await Promise.all(files.map(async (file) => {
                newProgress[file.name] = "uploading";
                setProgress({ ...newProgress });

                try {
                    // 1. Upload File
                    // Use timestamp to attempt uniqueness, but better to use UUID or similar if high collision risk.
                    // Here Date.now is risky for parallel uploads if they start exact same ms, but JS is single threaded event loop so Date.now() might be same in loop.
                    // Let's add random string.
                    const uniqueId = Math.random().toString(36).substring(2, 10);
                    const path = `uploads/${user.uid}/${Date.now()}_${uniqueId}_${file.name}`;
                    const url = await uploadFile(file, path);

                    // 2. Create Note Record
                    await createNote({
                        departmentId: selectedDept,
                        semesterId: selectedSem,
                        subjectId: selectedSub,
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

            setMessage("All operations completed.");
            // Determine if clear or keep based on errors.
            // For now, clear updated files if all success?
            // Let's just reset files after short delay if all success basically.
            const hasError = Object.values(newProgress).includes("error");
            if (!hasError) {
                setTimeout(() => {
                    setFiles([]);
                    setProgress({});
                    setMessage("Upload complete!");
                    setUploading(false);
                }, 2000);
            } else {
                setUploading(false);
                setMessage("Some files failed to upload.");
            }

        } catch (err) {
            console.error(err);
            setMessage("Upload process failed.");
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
                    <UploadCloud size={48} className={styles.uploadIcon} />
                    <p className={styles.dropText}>Drag & drop files here or <span>browse</span></p>
                    <input
                        type="file"
                        id="fileInput"
                        hidden
                        multiple // Enable multiple files
                        onChange={handleFileSelect}
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

                {message && <p className={styles.msg} style={{ marginTop: "1rem" }}>{message}</p>}
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
        </div>
    );
}
