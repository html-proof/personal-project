"use client";

import { useEffect, useState } from "react";
import {
    getUserNotes,
    deleteNote,
    getUserFolders,
    updateNote,
    moveNotesBulk,
    deleteNotesBulk,
    updateFolder,
    deleteFolder
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { useUndo } from "@/context/UndoContext";
import { useToast } from "@/context/ToastContext";
import {
    Eye,
    Download,
    Share2,
    FileText,
    Film,
    Image as ImageIcon,
    Trash2,
    Folder,
    ChevronRight,
    Home,
    MoreVertical,
    Pencil,
    Check,
    X,
    Move
} from "lucide-react";
import styles from "./MyNotes.module.css";
import FilePreviewModal from "@/components/common/FilePreviewModal";
import MoveItemsModal from "./MoveItemsModal";

export default function MyNotes() {
    const { user } = useAuth();
    const { scheduleDelete } = useUndo();
    const [notes, setNotes] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [currentFolder, setCurrentFolder] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
    const { addToast } = useToast();

    // Selection & Bulk State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

    // Editing State (Rename)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [isEditingFolder, setIsEditingFolder] = useState(false);

    // UI state
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
            addToast("Link copied to clipboard!", "success");
        } catch (err) {
            console.error("Failed to copy", err);
            addToast("Failed to copy link", "error");
        }
    };

    const handleDownload = async (note: any) => {
        try {
            addToast("Downloading...", "success");
            const response = await fetch(note.fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Determine extension
            let extension = "";
            // Try to extract from URL first (remove query params)
            const urlPath = note.fileUrl.split('?')[0];
            const dotIndex = urlPath.lastIndexOf('.');
            if (dotIndex !== -1 && urlPath.length - dotIndex <= 5) { // Sanity check length
                extension = urlPath.substring(dotIndex);
            } else {
                // Fallback mime types
                const type = note.fileType || "";
                if (type.includes("pdf")) extension = ".pdf";
                else if (type.includes("image/png")) extension = ".png";
                else if (type.includes("image/jpeg") || type.includes("image/jpg")) extension = ".jpg";
                else if (type.includes("word") || type.includes("doc")) extension = ".docx";
                else if (type.includes("sheet") || type.includes("excel")) extension = ".xlsx";
                else if (type.includes("presentation") || type.includes("powerpoint")) extension = ".pptx";
                else if (type.includes("text/plain")) extension = ".txt";
            }

            // If note.title already has extension, don't duplicate
            let filename = note.title;
            if (!filename.toLowerCase().endsWith(extension.toLowerCase())) {
                filename += extension;
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed", error);
            addToast("Failed to download file", "error");
        }
    };

    const handleRename = async (id: string, isFolder: boolean) => {
        if (!editName.trim()) return;
        try {
            if (isFolder) {
                await updateFolder(id, editName.trim());
                setFolders(prev => prev.map(f => f.id === id ? { ...f, name: editName.trim() } : f));
            } else {
                await updateNote(id, { title: editName.trim() });
                setNotes(prev => prev.map(n => n.id === id ? { ...n, title: editName.trim() } : n));
            }
            addToast("Renamed successfully", "success");
        } catch (error) {
            console.error("Failed to rename", error);
            addToast("Failed to rename", "error");
        } finally {
            setEditingId(null);
            setEditName("");
        }
    };

    const handleBulkMove = async (targetFolderId: string | null) => {
        if (selectedIds.length === 0) return;
        try {
            await moveNotesBulk(selectedIds, targetFolderId);
            setNotes(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, folderId: targetFolderId } : n));
            addToast(`Moved ${selectedIds.length} items successfully`, "success");
            setSelectedIds([]);
            setIsMoveModalOpen(false);
        } catch (error) {
            console.error("Failed to move items", error);
            addToast("Failed to move items", "error");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;

        try {
            await deleteNotesBulk(selectedIds);
            setNotes(prev => prev.filter(n => !selectedIds.includes(n.id)));
            addToast(`Deleted ${selectedIds.length} items successfully`, "success");
            setSelectedIds([]);
        } catch (error) {
            console.error("Failed to delete items", error);
            addToast("Failed to delete items", "error");
        }
    };

    const handleFolderDelete = async (folder: any) => {
        const folderNotes = notes.filter(n => n.folderId === folder.id);
        if (folderNotes.length > 0) {
            const mode = confirm(`This folder contains ${folderNotes.length} items. \n\nClick OK to DELETE ALL items or Cancel to MOVE them to home first.`);
            if (mode) {
                // Delete all
                const ids = folderNotes.map(n => n.id);
                await deleteNotesBulk(ids);
                await deleteFolder(folder.id);
                setNotes(prev => prev.filter(n => !ids.includes(n.id)));
            } else {
                // Move to root
                const ids = folderNotes.map(n => n.id);
                await moveNotesBulk(ids, null);
                await deleteFolder(folder.id);
                setNotes(prev => prev.map(n => ids.includes(n.id) ? { ...n, folderId: null } : n));
            }
        } else {
            if (!confirm(`Are you sure you want to delete folder '${folder.name}'?`)) return;
            await deleteFolder(folder.id);
        }
        setFolders(prev => prev.filter(f => f.id !== folder.id));
        addToast("Folder deleted successfully", "success");
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
                        className={`${styles.card} ${editingId === folder.id ? styles.cardEditing : ''}`}
                        onClick={() => editingId !== folder.id && setCurrentFolder(folder)}
                        style={{ cursor: "pointer" }}
                    >
                        <div className={styles.preview} style={{ background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Folder size={64} color="#3b82f6" fill="#bfdbfe" />
                            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === folder.id ? null : folder.id); }}
                                    className={styles.menuBtn}
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {activeMenu === folder.id && (
                                    <div className={styles.moreMenu} onClick={e => e.stopPropagation()}>
                                        <button className={styles.menuItem} onClick={() => { setEditingId(folder.id); setEditName(folder.name); setIsEditingFolder(true); setActiveMenu(null); }}>
                                            <Pencil size={14} /> Rename
                                        </button>
                                        <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { handleFolderDelete(folder); setActiveMenu(null); }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.content}>
                            {editingId === folder.id && isEditingFolder ? (
                                <div style={{ display: "flex", gap: "0.25rem" }} onClick={e => e.stopPropagation()}>
                                    <input
                                        className={styles.editInput}
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleRename(folder.id, true)}
                                    />
                                    <button onClick={() => handleRename(folder.id, true)} className={styles.actionBtn}><Check size={14} /></button>
                                    <button onClick={() => setEditingId(null)} className={styles.actionBtn}><X size={14} /></button>
                                </div>
                            ) : (
                                <>
                                    <h3 className={styles.fileName}>{folder.name}</h3>
                                    <p className={styles.fileMeta}>Folder • {notes.filter(n => n.folderId === folder.id).length} items</p>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Render Files */}
                {visibleNotes.map(note => (
                    <div
                        key={note.id}
                        className={`${styles.card} ${selectedIds.includes(note.id) ? styles.cardSelected : ''}`}
                        onClick={() => {
                            if (editingId === note.id) return;
                            toggleSelection(note.id);
                        }}
                    >
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={selectedIds.includes(note.id)}
                            onChange={() => toggleSelection(note.id)}
                            onClick={e => e.stopPropagation()}
                        />

                        <div className={styles.preview}>
                            {getPreview(note)}
                            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === note.id ? null : note.id); }}
                                    className={styles.menuBtn}
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {activeMenu === note.id && (
                                    <div className={styles.moreMenu} onClick={e => e.stopPropagation()}>
                                        <button className={styles.menuItem} onClick={() => { setEditingId(note.id); setEditName(note.title); setIsEditingFolder(false); setActiveMenu(null); }}>
                                            <Pencil size={14} /> Rename
                                        </button>
                                        <button className={styles.menuItem} onClick={() => { setSelectedIds([note.id]); setIsMoveModalOpen(true); setActiveMenu(null); }}>
                                            <Move size={14} /> Move
                                        </button>
                                        <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { handleDelete(note.id); setActiveMenu(null); }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.content}>
                            {editingId === note.id && !isEditingFolder ? (
                                <div style={{ display: "flex", gap: "0.25rem" }} onClick={e => e.stopPropagation()}>
                                    <input
                                        className={styles.editInput}
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleRename(note.id, false)}
                                    />
                                    <button onClick={() => handleRename(note.id, false)} className={styles.actionBtn}><Check size={14} /></button>
                                    <button onClick={() => setEditingId(null)} className={styles.actionBtn}><X size={14} /></button>
                                </div>
                            ) : (
                                <>
                                    <h3 className={styles.fileName} title={note.title}>{note.title}</h3>
                                    <p className={styles.fileMeta}>{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                </>
                            )}

                            <div className={styles.actions}>
                                <button
                                    className={styles.btn}
                                    title="View"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPreviewFile({ url: note.fileUrl, name: note.title, type: note.fileType });
                                    }}
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    className={styles.btn}
                                    title="Download"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(note);
                                    }}
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleShare(note.fileUrl); }}
                                    className={styles.btn}
                                    title="Share Link"
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {
                selectedIds.length > 0 && (
                    <div className={styles.bulkBar}>
                        <div className={styles.bulkInfo}>
                            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
                        </div>
                        <div className={styles.bulkActions}>
                            <button className={styles.bulkBtn} onClick={() => setIsMoveModalOpen(true)}>
                                <Move size={18} /> Move
                            </button>
                            <button className={styles.bulkBtn} style={{ color: '#ef4444' }} onClick={handleBulkDelete}>
                                <Trash2 size={18} /> Delete
                            </button>
                            <button className={styles.bulkBtn} onClick={() => setSelectedIds([])}>
                                <X size={18} /> Cancel
                            </button>
                        </div>
                    </div>
                )
            }

            <MoveItemsModal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                onMove={handleBulkMove}
                itemCount={selectedIds.length}
            />

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                fileUrl={previewFile?.url || ""}
                fileName={previewFile?.name || ""}
                fileType={previewFile?.type || ""}
            />
        </section >
    );
}
