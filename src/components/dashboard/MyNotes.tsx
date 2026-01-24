"use client";

import { useEffect, useState } from "react";
import { getUserNotes, deleteNote } from "@/lib/firebase/firestore"; // Added deleteNote import if we want to add delete later, but sticking to request for now
import { useAuth } from "@/lib/firebase/auth";
import { Eye, Download, Share2, FileText, Film, Image as ImageIcon, Trash2 } from "lucide-react";
import styles from "./MyNotes.module.css";

export default function MyNotes() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadNotes();
    }, [user]);

    async function loadNotes() {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserNotes(user.uid);
            setNotes(data);
        } catch (error) {
            console.error("Failed to load notes", error);
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
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            // Note: Ideally we should also delete from Storage, but for now we just remove the Firestore record
            await deleteNote(id);
            setNotes(notes.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete");
        }
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
    if (notes.length === 0) return null;

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>My Uploads</h2>
            <div className={styles.grid}>
                {notes.map(note => (
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
