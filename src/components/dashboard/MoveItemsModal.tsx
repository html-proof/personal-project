"use client";

import { useState, useEffect } from "react";
import { getFolders, getSubjects, getSemesters, getBatches, getDepartments } from "@/lib/firebase/firestore";
import { X, Folder, ChevronRight, Home } from "lucide-react";
import styles from "./MoveItemsModal.module.css";

interface MoveItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (targetFolderId: string | null) => void;
    itemCount: number;
}

export default function MoveItemsModal({ isOpen, onClose, onMove, itemCount }: MoveItemsModalProps) {
    const [departments, setDepartments] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);

    const [selectedDept, setSelectedDept] = useState("");
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedSem, setSelectedSem] = useState("");
    const [selectedSub, setSelectedSub] = useState("");

    useEffect(() => {
        if (isOpen) {
            loadDeps();
        }
    }, [isOpen]);

    const loadDeps = async () => {
        const data = await getDepartments();
        setDepartments(data);
    };

    useEffect(() => {
        if (selectedDept) {
            getBatches(selectedDept).then(setBatches);
        } else {
            setBatches([]);
        }
    }, [selectedDept]);

    useEffect(() => {
        if (selectedBatch) {
            getSemesters(selectedBatch).then(setSemesters);
        } else {
            setSemesters([]);
        }
    }, [selectedBatch]);

    useEffect(() => {
        if (selectedSem) {
            getSubjects(selectedSem).then(setSubjects);
        } else {
            setSubjects([]);
        }
    }, [selectedSem]);

    useEffect(() => {
        if (selectedSub) {
            getFolders(selectedSub).then(setFolders);
        } else {
            setFolders([]);
        }
    }, [selectedSub]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Move {itemCount} item{itemCount !== 1 ? 's' : ''} to...</h3>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.selectionGrid}>
                        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className={styles.select}>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className={styles.select} disabled={!selectedDept}>
                            <option value="">Select Batch</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <select value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)} className={styles.select} disabled={!selectedBatch}>
                            <option value="">Select Semester</option>
                            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)} className={styles.select} disabled={!selectedSem}>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className={styles.folderList}>
                        <button
                            className={styles.folderItem}
                            onClick={() => onMove(null)}
                            disabled={!selectedSub}
                        >
                            <Home size={18} />
                            <span>Main Directory (No Folder)</span>
                        </button>
                        {folders.map(folder => (
                            <button
                                key={folder.id}
                                className={styles.folderItem}
                                onClick={() => onMove(folder.id)}
                            >
                                <Folder size={18} />
                                <span>{folder.name}</span>
                            </button>
                        ))}
                        {selectedSub && folders.length === 0 && (
                            <p className={styles.empty}>No folders in this subject.</p>
                        )}
                        {!selectedSub && (
                            <p className={styles.hint}>Please select a subject to see target folders.</p>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className="btn btn-outline">Cancel</button>
                </div>
            </div>
        </div>
    );
}
