"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getDepartments, getBatches, getSemesters, getSubjects, getNotes, searchNotes, getFolders } from "@/lib/firebase/firestore";
import { ChevronRight, File, Film, Image as ImageIcon, Download, Eye, Share2, Search, X, Folder, ArrowLeft } from "lucide-react";
import FilePreviewModal from "./FilePreviewModal";
import styles from "./NotesBrowser.module.css";

export default function NotesBrowser() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [selectedSem, setSelectedSem] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [folders, setFolders] = useState<any[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<any>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [isSearching, setIsSearching] = useState(false);
    const [previewNote, setPreviewNote] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        loadDepartments();
    }, []);

    // Sync State with URL Params
    useEffect(() => {
        const syncState = async () => {
            if (departments.length === 0) return;

            const deptId = searchParams.get("dept");
            const batchId = searchParams.get("batch");
            const semId = searchParams.get("sem");
            const subId = searchParams.get("sub");
            const folderId = searchParams.get("folder");

            // Sync Dept
            if (deptId && selectedDept?.id !== deptId) {
                const dept = departments.find(d => d.id === deptId);
                if (dept) {
                    setSelectedDept(dept);
                    const b = await getBatches(dept.id);
                    setBatches(b);
                }
            } else if (!deptId && selectedDept) {
                // Reset if URL cleared
                setSelectedDept(null);
                setBatches([]);
                return;
            }

            // Sync Batch
            if (batchId && selectedBatch?.id !== batchId) {
                const batch = await getBatches(deptId!).then(res => res.find(b => b.id === batchId)); // Re-fetch to be safe or find in current batches if we could trust order
                if (batch) {
                    setSelectedBatch(batch);
                    const s = await getSemesters(batch.id);
                    setSemesters(s);
                }
            } else if (!batchId && selectedBatch) {
                setSelectedBatch(null);
                setSemesters([]);
                return;
            }

            // Sync Semester
            if (semId && selectedSem?.id !== semId) {
                const sem = await getSemesters(batchId!).then(res => res.find(s => s.id === semId));
                if (sem) {
                    setSelectedSem(sem);
                    const realSubjects = await getSubjects(sem.id);
                    const generalSubject = { id: "general", name: "General Materials" };
                    setSubjects([...realSubjects, generalSubject]);
                }
            } else if (!semId && selectedSem) {
                setSelectedSem(null);
                setSubjects([]);
                return;
            }

            // Sync Subject (Load Content)
            if (subId && selectedSub?.id !== subId) {
                // If "general", we fabricate the object since it won't be in DB
                let sub = subId === "general"
                    ? { id: "general", name: "General Materials" }
                    : await getSubjects(semId!).then(res => res.find(s => s.id === subId));

                if (sub) {
                    setSelectedSub(sub);
                    setLoading(true);
                    try {
                        const [fetchedNotes, fetchedFolders] = await Promise.all([
                            getNotes(sub.id),
                            getFolders(sub.id)
                        ]);
                        setNotes(fetchedNotes);
                        setFolders(fetchedFolders);
                    } catch (error) {
                        console.error("Failed to load content", error);
                    } finally {
                        setLoading(false);
                    }
                }
            } else if (!subId && selectedSub) {
                setSelectedSub(null);
                setNotes([]);
                setFolders([]);
                return;
            }

            // Sync Folder
            if (folderId && selectedFolder?.id !== folderId) {
                const folder = await getFolders(subId!).then(res => res.find(f => f.id === folderId));
                if (folder) setSelectedFolder(folder);
            } else if (!folderId && selectedFolder) {
                setSelectedFolder(null);
            }

        };

        syncState();
    }, [searchParams, departments]);

    // Auto-scroll to content when Subject or General Materials is selected
    useEffect(() => {
        if (selectedSub && !loading) {
            const element = document.getElementById("notes-content");
            if (element) {
                // Small timeout to ensure DOM render
                setTimeout(() => {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
            }
        }
    }, [selectedSub, loading]);


    async function loadDepartments() {
        const data = await getDepartments();
        setDepartments(data);
        // Default select if no URL param
        if (data.length > 0 && !searchParams.get("dept")) {
            updateUrl({ dept: data[0].id });
        }
    }

    // Helper to update URL
    const updateUrl = (params: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            if (value === null) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    };

    function handleDeptClick(dept: any) {
        if (selectedDept?.id === dept.id && !isSearching) return;
        // Reset downstream
        const newParams = new URLSearchParams();
        newParams.set("dept", dept.id);
        router.push(`${pathname}?${newParams.toString()}`, { scroll: false });

        setSearchQuery("");
        setIsSearching(false);
    }

    function handleBatchClick(batch: any) {
        if (selectedBatch?.id === batch.id) {
            updateUrl({ batch: null, sem: null, sub: null, folder: null });
            return;
        }
        updateUrl({ batch: batch.id, sem: null, sub: null, folder: null });
    }

    function handleSemClick(sem: any) {
        if (selectedSem?.id === sem.id) {
            updateUrl({ sem: null, sub: null, folder: null });
            return;
        }
        updateUrl({ sem: sem.id, sub: null, folder: null });
    }

    function handleSubClick(sub: any) {
        if (selectedSub?.id === sub.id) {
            updateUrl({ sub: null, folder: null });
            return;
        }
        updateUrl({ sub: sub.id, folder: null });
    }

    const filteredNotes = notes.filter(n => {
        if (selectedFolder) {
            return n.folderId === selectedFolder.id;
        } else {
            return !n.folderId;
        }
    });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDept || !searchQuery.trim()) return;

        setLoading(true);
        setIsSearching(true);
        try {
            const results = await searchNotes(selectedDept.id, searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setIsSearching(false);
        setSearchResults([]);
    };

    const handleShare = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const getPreview = (note: any) => {
        if (note.fileType.startsWith("image/")) {
            return <img src={note.fileUrl} alt={note.title} className={styles.previewImg} />;
        }
        if (note.fileType.startsWith("video/")) {
            return <video src={note.fileUrl} className={styles.previewVideo} controls={false} />;
        }
        return (
            <div className={styles.previewIcon}>
                <File size={48} />
            </div>
        );
    };

    return (
        <div className={styles.browser}>
            {/* Header Area with Search on the Right */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <h2 style={{ fontSize: "2rem", color: "var(--text-main)", margin: 0 }}>Browse Materials</h2>

                {selectedDept && (
                    <div className="search-container" style={{ flex: "1 1 300px", maxWidth: "400px" }}>
                        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    type="text"
                                    placeholder={`Search in ${selectedDept.name}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem 0.5rem 0.5rem 2.2rem",
                                        borderRadius: "var(--radius)",
                                        border: "1px solid var(--border)",
                                        background: "var(--surface)",
                                        color: "var(--text-main)",
                                        fontFamily: "inherit",
                                        fontSize: "0.9rem"
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        style={{
                                            position: "absolute",
                                            right: "8px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            color: "var(--text-muted)",
                                            cursor: "pointer",
                                            padding: 0
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }} disabled={!searchQuery.trim()}>
                                Search
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Department Selection */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <h3 className={styles.colTitle}>Select Department</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {departments.map(d => (
                        <button
                            key={d.id}
                            onClick={() => handleDeptClick(d)}
                            className={`btn ${selectedDept?.id === d.id ? styles.active : 'btn-outline'}`}
                            style={{
                                padding: "0.5rem 1rem",
                                border: selectedDept?.id === d.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                                background: selectedDept?.id === d.id ? "var(--primary)" : "transparent",
                                color: selectedDept?.id === d.id ? "white" : "var(--text-main)"
                            }}
                        >
                            {d.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rest of Content */}
            {selectedDept && (
                <>
                    {/* Search Results */}
                    {isSearching ? (
                        <div className={styles.notesSection}>
                            <h3 className={styles.notesTitle}>
                                Search Results
                                <button
                                    onClick={clearSearch}
                                    className="btn btn-outline"
                                    style={{ float: "right", fontSize: "0.8rem", padding: "0.25rem 0.75rem" }}
                                >
                                    Clear Search
                                </button>
                            </h3>
                            {loading ? <p>Searching...</p> : searchResults.length === 0 ? (
                                <p>No matches found.</p>
                            ) : (
                                <div className={styles.notesGrid}>
                                    {searchResults.map(note => (
                                        <div
                                            key={note.id}
                                            className={styles.noteCard}
                                            onClick={() => setPreviewNote(note)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className={styles.preview}>
                                                {getPreview(note)}
                                            </div>
                                            <div className={styles.noteContent}>
                                                <h4 className={styles.noteName} title={note.title}>{note.title}</h4>
                                                <p className={styles.noteMeta}>{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                                <div className={styles.actions}>
                                                    <button onClick={(e) => { e.stopPropagation(); setPreviewNote(note); }} className={styles.btn} title="View"><Eye size={18} /></button>
                                                    <a href={note.fileUrl} download target="_blank" rel="noopener noreferrer" className={styles.btn} title="Download" onClick={(e) => e.stopPropagation()}><Download size={18} /></a>
                                                    <button onClick={(e) => { e.stopPropagation(); handleShare(note.fileUrl); }} className={styles.btn} title="Share Link"><Share2 size={18} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {/* Batches */}
                            <div className={`card ${!selectedDept ? styles.disabled : ''}`}>
                                <h3 className={styles.colTitle}>Batches</h3>
                                {selectedDept && (
                                    <ul className={styles.list}>
                                        {batches.length === 0 && <li className={styles.empty}>No batches found.</li>}
                                        {batches.map(b => (
                                            <li
                                                key={b.id}
                                                className={`${styles.item} ${selectedBatch?.id === b.id ? styles.active : ''}`}
                                                onClick={() => handleBatchClick(b)}
                                            >
                                                {b.name} <ChevronRight size={16} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Semesters */}
                            <div className={`card ${!selectedBatch ? styles.disabled : ''}`}>
                                <h3 className={styles.colTitle}>Semesters</h3>
                                {selectedBatch && (
                                    <ul className={styles.list}>
                                        {semesters.length === 0 && <li className={styles.empty}>No semesters found.</li>}
                                        {semesters.map(s => (
                                            <li
                                                key={s.id}
                                                className={`${styles.item} ${selectedSem?.id === s.id ? styles.active : ''}`}
                                                onClick={() => handleSemClick(s)}
                                            >
                                                {s.name} <ChevronRight size={16} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {!selectedBatch && <p className={styles.hint}>Select a batch first.</p>}
                            </div>

                            {/* Subjects */}
                            <div className={`card ${!selectedSem ? styles.disabled : ''}`}>
                                <h3 className={styles.colTitle}>Subjects</h3>
                                {selectedSem && (
                                    <ul className={styles.list}>
                                        {subjects.length === 0 && <li className={styles.empty}>No subjects found.</li>}
                                        {subjects.map(s => (
                                            <li
                                                key={s.id}
                                                className={`${styles.item} ${selectedSub?.id === s.id ? styles.active : ''}`}
                                                onClick={() => handleSubClick(s)}
                                            >
                                                {s.name} <ChevronRight size={16} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {!selectedSem && <p className={styles.hint}>Select a semester first.</p>}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Content View (Folders + Notes) */}
            {!isSearching && selectedSub && (
                <div id="notes-content" className={styles.notesSection}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        {selectedFolder && (
                            <button
                                onClick={() => updateUrl({ folder: null })}
                                className="btn btn-outline"
                                style={{ padding: "0.5rem", borderRadius: "50%", border: "none" }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h3 className={styles.notesTitle} style={{ margin: 0 }}>
                            {selectedFolder ? selectedFolder.name : (selectedSub.name === "General Materials" ? "FILES" : `Materials for ${selectedSub.name}`)}
                        </h3>
                    </div>

                    {loading ? <p>Loading content...</p> : (
                        <>
                            {/* Folders Grid (Only show at root level) */}
                            {!selectedFolder && folders.length > 0 && (
                                <div style={{ marginBottom: "2rem" }}>
                                    <h4 style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Folders</h4>
                                    <div className={styles.grid} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                                        {folders.map(folder => (
                                            <div
                                                key={folder.id}
                                                className="card"
                                                onClick={() => updateUrl({ folder: folder.id })}
                                                style={{
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "1rem",
                                                    padding: "1.5rem",
                                                    background: "var(--surface)",
                                                    border: "1px solid var(--border)",
                                                    transition: "transform 0.2s, box-shadow 0.2s"
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = "translateY(-2px)";
                                                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = "none";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }}
                                            >
                                                <Folder size={24} className="text-primary" fill="currentColor" fillOpacity={0.2} />
                                                <span style={{ fontWeight: 600 }}>{folder.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes Grid */}
                            <div>
                                {!selectedFolder && folders.length > 0 && <h4 style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "1rem" }}>General Notes</h4>}
                                {filteredNotes.length === 0 ? (
                                    <p className="text-muted" style={{ fontStyle: "italic" }}>
                                        {selectedFolder ? "This folder is empty." : (folders.length === 0 ? "No materials uploaded yet." : "No general notes.")}
                                    </p>
                                ) : (
                                    <div className={styles.notesGrid}>
                                        {filteredNotes.map(note => (
                                            <div
                                                key={note.id}
                                                className={styles.noteCard}
                                                onClick={() => setPreviewNote(note)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <div className={styles.preview}>
                                                    {getPreview(note)}
                                                </div>
                                                <div className={styles.noteContent}>
                                                    <h4 className={styles.noteName} title={note.title}>{note.title}</h4>
                                                    <p className={styles.noteMeta}>{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                                    <div className={styles.actions}>
                                                        <button onClick={(e) => { e.stopPropagation(); setPreviewNote(note); }} className={styles.btn} title="View"><Eye size={18} /></button>
                                                        <a href={note.fileUrl} download target="_blank" rel="noopener noreferrer" className={styles.btn} title="Download" onClick={(e) => e.stopPropagation()}><Download size={18} /></a>
                                                        <button onClick={(e) => { e.stopPropagation(); handleShare(note.fileUrl); }} className={styles.btn} title="Share Link"><Share2 size={18} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* Preview Modal */}
            {previewNote && (
                <FilePreviewModal
                    file={previewNote}
                    onClose={() => setPreviewNote(null)}
                />
            )}
        </div>
    );
}
