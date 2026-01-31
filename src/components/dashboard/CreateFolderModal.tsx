"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, FileText, Folder, ChevronDown, ChevronRight } from "lucide-react";
import styles from "./CreateFolderModal.module.css";

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, selectedFileIds: string[], selectedFolderIds: string[]) => void;
    currentLocationName: string;
    availableFiles: any[]; // Files that can be moved into the new folder
    availableFolders: any[]; // Folders that can be moved into the new folder
}

export default function CreateFolderModal({
    isOpen,
    onClose,
    onCreate,
    currentLocationName,
    availableFiles,
    availableFolders
}: CreateFolderModalProps) {
    const [folderName, setFolderName] = useState("");
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFolderName("");
            // Teacher-First: Auto-detect and pre-select existing items
            const allFileIds = availableFiles.map(f => f.id);
            setSelectedFileIds(allFileIds);
            setSelectedFolderIds([]);

            // Auto-expand if there are items to organize
            setIsExpanded(allFileIds.length > 0);
        }
    }, [isOpen, availableFiles]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) return;
        onCreate(folderName.trim(), selectedFileIds, selectedFolderIds);
        onCreate(folderName.trim(), selectedFileIds, selectedFolderIds);
        // State reset handled by useEffect on next open, but good to clear here too
        setFolderName("");
        setSelectedFileIds([]);
        setSelectedFolderIds([]);
    };

    const toggleFileSelection = (id: string) => {
        setSelectedFileIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const toggleFolderSelection = (id: string) => {
        setSelectedFolderIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Create New Folder</h3>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.content}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                            📍 You are creating a folder in:
                        </label>
                        <div style={{ padding: "0.75rem", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "6px", fontSize: "0.9rem", color: "var(--success)", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Folder size={16} />
                            {currentLocationName || "Home (Files)"}
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Folder Name</label>
                        <input
                            className={styles.input}
                            placeholder="e.g., Unit 1 Notes"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {(availableFiles.length > 0) && (
                        <div className={styles.inputGroup}>
                            <button
                                type="button"
                                className={styles.accordionHeader}
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <span>Organize existing files into this folder?</span>
                            </button>

                            {isExpanded && (
                                <>
                                    <div className={styles.hintText}>
                                        We found files here. Uncheck any you <strong>don't</strong> want to move.
                                    </div>
                                    <div className={styles.fileList}>
                                        {availableFiles.map(file => (
                                            <div
                                                key={file.id}
                                                className={styles.fileItem}
                                                onClick={() => toggleFileSelection(file.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFileIds.includes(file.id)}
                                                    onChange={() => { }} // dummy, handled by parent div click
                                                    style={{ cursor: "pointer" }}
                                                />
                                                <FileText size={16} color="#6b7280" />
                                                <span className={styles.itemLabel}>{file.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                                        {selectedFileIds.length} item{selectedFileIds.length !== 1 ? 's' : ''} selected
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </form>

                <div className={styles.footer}>
                    <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        className={styles.createBtn}
                        disabled={!folderName.trim()}
                    >
                        Create Folder
                    </button>
                </div>
            </div >
        </div >
    );
}
