"use client";

import { useState, useEffect } from "react";
import { UploadCloud, File, Film, Image as ImageIcon, CheckCircle, XCircle, Trash2, FileSpreadsheet, Presentation } from "lucide-react";
import {
    getDepartments,
    getBatches,
    getSemesters,
    getSubjects,
    getFolders,
    createFolder,
    createNote,
    getNotes,
    moveNotesBulk
} from "@/lib/firebase/firestore";
import { FolderPlus, Folder } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import { useAuth } from "@/lib/firebase/auth";
import { useToast } from "@/context/ToastContext";
import { CONFIG, isAllowedFileType, sanitizeInput } from "@/lib/config";
import CreateFolderModal from "./CreateFolderModal";
import styles from "./UploadFlow.module.css";

export default function UploadFlow() {
    const { user } = useAuth();
    const { addToast } = useToast();


    const [departments, setDepartments] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedDept, setSelectedDept] = useState("");
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedSem, setSelectedSem] = useState("");
    const [selectedSub, setSelectedSub] = useState("");
    const [selectedFolder, setSelectedFolder] = useState("");

    const isSelectionComplete = selectedDept && selectedBatch && selectedSem;

    const [folders, setFolders] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Derived state for the modal
    const currentSubjectName = subjects.find(s => s.id === selectedSub)?.name || "Subject";
    const availableOrphanFiles = notes.filter(n => !n.folderId).map(n => ({ id: n.id, title: n.title }));

    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<{ [key: string]: string }>({});

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

    useEffect(() => {
        if (!selectedSub) {
            setFolders([]);
            setNotes([]);
            return;
        }
        async function loadContent() {
            const [f, n] = await Promise.all([
                getFolders(selectedSub),
                getNotes(selectedSub)
            ]);
            setFolders(f);
            setNotes(n);
        }
        loadContent();
    }, [selectedSub]);

    const handleCreateFolder = async (name: string, selectedFileIds: string[], _selectedFolderIds: string[]) => {
        try {
            // 1. Create the folder
            const ref = await createFolder({
                subjectId: selectedSub || "general",
                semesterId: selectedSem,
                batchId: selectedBatch,
                departmentId: selectedDept,
                name: sanitizeInput(name),
                createdBy: user?.uid
            });

            // 2. Move selected files (notes) into the new folder
            if (selectedFileIds.length > 0) {
                await moveNotesBulk(selectedFileIds, ref.id);
            }

            // 3. Refresh content
            if (selectedSub) {
                const [f, n] = await Promise.all([
                    getFolders(selectedSub),
                    getNotes(selectedSub)
                ]);
                setFolders(f);
                setNotes(n);
            }

            // 4. Select the new folder
            setSelectedFolder(ref.id);
            setIsCreateModalOpen(false);
            addToast(`Folder '${name}' created and selected`, "success");

        } catch (error) {
            console.error("Failed to create folder", error);
            addToast("Failed to create folder", "error");
        }
    };

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
        if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv")) return <FileSpreadsheet size={32} color="#16a34a" />;
        if (type.includes("powerpoint") || type.includes("presentation")) return <Presentation size={32} color="#f97316" />;
        return <UploadCloud size={32} />;
    };

    const handleSubmit = async () => {
        if (!selectedDept || !selectedBatch || !selectedSem || files.length === 0 || !user) return;

        setUploading(true);
        const newProgress: any = {};

        const folderMap = new Map<string, string>();

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
            for (const folderName of Array.from(neededFolders)) {
                const existing = folders.find(f => f.name === folderName);
                if (existing) {
                    folderMap.set(folderName, existing.id);
                } else {
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

            if (neededFolders.size > 0) {
                const f = await getFolders(selectedSub);
                setFolders(f);
            }

            await Promise.all(files.map(async (file) => {
                newProgress[file.name] = "uploading";
                setProgress({ ...newProgress });

                try {
                    let targetFolderId = selectedFolder || null;
                    if (!targetFolderId && file.webkitRelativePath) {
                        const topFolder = file.webkitRelativePath.split('/')[0];
                        if (folderMap.has(topFolder)) {
                            targetFolderId = folderMap.get(topFolder) || null;
                        }
                    }

                    const uniqueId = Math.random().toString(36).substring(2, 10);
                    const path = `uploads/${user.uid}/${Date.now()}_${uniqueId}_${file.name}`;
                    const url = await uploadFile(file, path);

                    await createNote({
                        departmentId: selectedDept,
                        batchId: selectedBatch,
                        semesterId: selectedSem,
                        subjectId: selectedSub || "general",
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

            <div className={styles.section}>
                <h3 className={styles.stepTitle}>Select Destination</h3>
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

                </div>
            </div>

            <div className={styles.section} style={{
                opacity: isSelectionComplete ? 1 : 0.5,
                pointerEvents: isSelectionComplete ? "auto" : "none",
                transition: "opacity 0.3s"
            }}>

                {!isSelectionComplete && <p style={{ color: "var(--primary)", fontWeight: 500, marginBottom: "1rem" }}>Please select Department, Batch, and Semester to enable upload options.</p>}

                <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Target Folder (Optional)</label>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn-text"
                            style={{ color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: "none", border: "none" }}
                        >
                            + Create New Folder
                        </button>
                    </div>

                    <select
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        className={styles.select}
                        style={{ width: "100%", background: "var(--surface)", color: "var(--text-main)" }}
                    >
                        <option value="">General Notes (Root)</option>
                        {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        {selectedFolder
                            ? "Files will be uploaded into this folder."
                            : "Files will be uploaded to 'General Notes' unless they are inside a folder you drag-and-drop."}
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
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

                <div
                    className={styles.dropzone}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary)"; }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border)"; }}
                    onDrop={handleDrop}
                    style={{ padding: "3rem", background: "var(--surface)", border: "2px dashed var(--border)", borderRadius: "12px", textAlign: "center" }}
                >
                    <p style={{ fontWeight: 500, color: "var(--text-muted)" }}>Or visually drag & drop files or folders here</p>
                </div>

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

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateFolder}
                currentLocationName={currentSubjectName}
                availableFiles={availableOrphanFiles}
                availableFolders={[]} // Folders intentionally excluded based on previous simplification
            />
        </div>
    );
}
