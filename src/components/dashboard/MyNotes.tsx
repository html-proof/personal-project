"use client";

import { useEffect, useState } from "react";
import { getUserNotes, deleteNote, getUserFolders } from "@/lib/firebase/firestore"; // Added deleteNote import if we want to add delete later, but sticking to request for now
import { useAuth } from "@/lib/firebase/auth";
import { useUndo } from "@/context/UndoContext";
import { Eye, Download, Share2, FileText, Film, Image as ImageIcon, Trash2, Folder, ChevronRight, Home } from "lucide-react";
import styles from "./MyNotes.module.css";

export default function MyNotes() {
    const { user } = useAuth();
    const { scheduleDelete } = useUndo();
    const [notes, setNotes] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [currentFolder, setCurrentFolder] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadNotes();
    }, [user]);

    async function loadNotes() {
        if (!user) return;
        setLoading(true);
        try {
            const [notesData, foldersData] = await Promise.all([
                getUserNotes(user.uid),
                getUserFolders(user.uid)
            ]);
            setNotes(notesData);
            setFolders(foldersData);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    }

    const handleShare = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const handleDelete = async (id: string) => {
        // Optimistic UI Update
        const noteToDelete = notes.find(n => n.id === id);
        if (!noteToDelete) return;

        // Remove from UI immediately
        setNotes(prev => prev.filter(n => n.id !== id));

        // Define Undo Callback
        const handleUndo = () => {
            setNotes(prev => [noteToDelete, ...prev]);
        };

        // Schedule Logic
        scheduleDelete(
            id,
            async () => {
                await deleteNote(id);
            },
            `Note '${noteToDelete.title}'`,
            handleUndo
        );
    };

    const getPreview = (note: any) => {
        if (note.fileType.startsWith("image/")) {
            return <img src={note.fileUrl} alt={note.title} className={styles.previewImg} />;
        }
        if (note.fileType.startsWith("video/")) {
            return <video src={note.fileUrl} className={styles.previewVideo} controls={false} />; // Maybe muted hover? For now static
        }
        return (
            <div className={styles.previewIcon}>
                {note.fileType.includes("pdf") ? <FileText size={48} /> : <FileText size={48} />}
            </div>
        );
    };

    if (loading) return <div>Loading your files...</div>;

    // Filter content based on current view
    const visibleFolders = currentFolder
        ? [] // No subfolders for now (single level)
        : folders;

    const visibleNotes = notes.filter(n => {
        if (currentFolder) {
            return n.folderId === currentFolder.id;
        } else {
            return !n.folderId; // Show notes with no folder at root
        }
    });

    if (notes.length === 0 && folders.length === 0) return null;

    return (

        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>My Uploads</h2>
                {currentFolder && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#6b7280", marginTop: "0.5rem" }}>
                        <button
                            onClick={() => setCurrentFolder(null)}
                            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                            className="hover:text-primary"
                        >
                            <Home size={16} /> Home
                        </button>
                        <ChevronRight size={16} />
                        <span style={{ fontWeight: 600, color: "#111827" }}>{currentFolder.name}</span>
                    </div>
                )}
            </div>

            <div className={styles.grid}>
                {/* Render Folders (only at root) */}
                {visibleFolders.map(folder => (
                    <div
                        key={folder.id}
                        className={styles.card}
                        onClick={() => setCurrentFolder(folder)}
                        style={{ cursor: "pointer", borderColor: "#3b82f6" }}
                    >
                        <div className={styles.preview} style={{ background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Folder size={64} color="#3b82f6" fill="#bfdbfe" />
                        </div>
                        <div className={styles.content}>
                            <h3 className={styles.fileName}>{folder.name}</h3>
                            <p className={styles.fileMeta}>Folder • {notes.filter(n => n.folderId === folder.id).length} items</p>
                        </div>
                    </div>
                ))}

                {/* Render Files */}
                {visibleNotes.map(note => (
                    <div key={note.id} className={styles.card}>
                        <div className={styles.preview}>
                            {getPreview(note)}
                            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                                {/* Optional: Badge or Type indicator */}
                            </div>
                        </div>
                        <div className={styles.content}>
                            <h3 className={styles.fileName} title={note.title}>{note.title}</h3>
                            <p className={styles.fileMeta}>{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</p>

                            <div className={styles.actions}>
                                <a
                                    href={note.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.btn}
                                    title="View"
                                >
                                    <Eye size={18} />
                                </a>
                                <a
                                    href={note.fileUrl}
                                    download // Note: This might not work for cross-origin without config
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.btn}
                                    title="Download"
                                >
                                    <Download size={18} />
                                </a>
                                <button
                                    onClick={() => handleShare(note.fileUrl)}
                                    className={styles.btn}
                                    title="Share Link"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className={`${styles.btn}`}
                                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
