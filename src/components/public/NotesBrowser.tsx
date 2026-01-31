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
    // const [batches, setBatches] = useState<any[]>([]); // Batch removed
    // const [selectedBatch, setSelectedBatch] = useState<any>(null); // Batch removed
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
            // const batchId = searchParams.get("batch"); // Batch removed
            const semId = searchParams.get("sem");
            const subId = searchParams.get("sub");
            const folderId = searchParams.get("folder");

            // Sync Dept
            if (deptId && selectedDept?.id !== deptId) {
                const dept = departments.find(d => d.id === deptId);
                if (dept) {
                    setSelectedDept(dept);
                    const s = await getSemesters(dept.id); // Fetch sems directly
                    setSemesters(s);
                }
            } else if (!deptId && selectedDept) {
                setSelectedDept(null);
                setSemesters([]);
                return;
            }

            // Sync Semester (Check against department sems, not batch)
            if (semId && selectedSem?.id !== semId) {
                const sem = await getSemesters(deptId!).then(res => res.find(s => s.id === semId));
                if (sem) {
                    setSelectedSem(sem);
                    const realSubjects = await getSubjects(sem.id);
                    setSubjects(realSubjects);
                }
            } else if (!semId && selectedSem) {
                setSelectedSem(null);
                setSubjects([]);
                return;
            }

            // Sync Subject (Load Content)
            if (subId && selectedSub?.id !== subId) {
                const sub = await getSubjects(semId!).then(res => res.find(s => s.id === subId));

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

    // Auto-scroll to content when Subject is selected
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

    // handleBatchClick removed

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

    const handleShare = async (url: string, title: string) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: `Check out this material: ${title}`,
                    url: url,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert("Link copied to clipboard!");
            } catch (err) {
                console.error("Failed to copy", err);
            }
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

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename; // This forces download with the specific name
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback: just open in new tab if programmatic download fails (e.g. CORS)
            window.open(url, '_blank');
        }
    };

    return (
        <div className={styles.browser}>
            {/* Header Area with Search */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <h2 style={{ fontSize: "2rem", color: "var(--text-main)", margin: 0 }}>Browse Files</h2>

                {/* Always show search if we are deep enough or just generally accessible? 
                    User request implies simple drill down. Let's keep search available if dept is selected or global?
                    Existing logic required selectedDept. Converting to behave globally or per-dept if selected.
                 */}
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

            {/* Breadcrumb Navigation - Shows the current path (Dept > Sem > Sub > Folder) */}
            {selectedDept && !isSearching && (
                <div className={styles.breadcrumbs}>
                    <button
                        onClick={() => updateUrl({ dept: null, sem: null, sub: null, folder: null })}
                        className={styles.breadcrumbItem}
                    >
                        Home
                    </button>

                    <ChevronRight size={14} className={styles.breadcrumbSeparator} />

                    <button
                        onClick={() => updateUrl({ sem: null, sub: null, folder: null })}
                        className={`${styles.breadcrumbItem} ${!selectedSem ? styles.breadcrumbActive : ''}`}
                    >
                        {selectedDept.name}
                    </button>

                    {selectedSem && (
                        <>
                            <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                            <button
                                onClick={() => updateUrl({ sub: null, folder: null })}
                                className={`${styles.breadcrumbItem} ${!selectedSub ? styles.breadcrumbActive : ''}`}
                            >
                                {selectedSem.name}
                            </button>
                        </>
                    )}

                    {selectedSub && (
                        <>
                            <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                            <button
                                onClick={() => updateUrl({ folder: null })}
                                className={`${styles.breadcrumbItem} ${!selectedFolder ? styles.breadcrumbActive : ''}`}
                            >
                                {selectedSub.name}
                            </button>
                        </>
                    )}

                    {selectedFolder && (
                        <>
                            <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                            <span className={`${styles.breadcrumbItem} ${styles.breadcrumbActive}`}>
                                {selectedFolder.name}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Drill Down Views */}
            <div className={styles.drillDownContainer}>

                {/* Search Results Overlay */}
                {isSearching ? (
                    <div className={styles.notesSection}>
                        <div className={styles.headerBar}>
                            <button onClick={clearSearch} className={styles.backBtn} title="Back">
                                <ArrowLeft size={24} />
                            </button>
                            <h3 className={styles.headerTitle}>Search Results</h3>
                        </div>

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
                                                <button onClick={(e) => { e.stopPropagation(); handleDownload(note.fileUrl, note.title); }} className={styles.btn} title="Download"><Download size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleShare(note.fileUrl, note.title); }} className={styles.btn} title="Share Link"><Share2 size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Level 0: Department Selection */}
                        {!selectedDept && (
                            <div className="view-transition">
                                <h3 className={styles.colTitle}>Select Department</h3>
                                <div className={styles.listGroup}>
                                    {departments.map(d => (
                                        <div
                                            key={d.id}
                                            onClick={() => handleDeptClick(d)}
                                            className={styles.listItem}
                                        >
                                            <span>{d.name}</span>
                                            <ChevronRight className={styles.listItemIcon} size={20} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Level 1: Semester Selection */}
                        {selectedDept && !selectedSem && (
                            <div className="view-transition">
                                <div className={styles.headerBar}>
                                    <button onClick={() => updateUrl({ dept: null })} className={styles.backBtn} title="Back to Departments">
                                        <ArrowLeft size={24} />
                                    </button>
                                    <h3 className={styles.headerTitle}>{selectedDept.name}</h3>
                                </div>
                                <h4 style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>Select Semester</h4>
                                <div className={styles.listGroup}>
                                    {semesters.length === 0 && <p className={styles.empty}>No semesters found.</p>}
                                    {semesters.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => handleSemClick(s)}
                                            className={styles.listItem}
                                        >
                                            <span>{s.name}</span>
                                            <ChevronRight className={styles.listItemIcon} size={20} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Level 2: Subject Selection */}
                        {selectedDept && selectedSem && !selectedSub && (
                            <div className="view-transition">
                                <div className={styles.headerBar}>
                                    <button onClick={() => updateUrl({ sem: null })} className={styles.backBtn} title="Back to Semesters">
                                        <ArrowLeft size={24} />
                                    </button>
                                    <h3 className={styles.headerTitle}>{selectedSem.name}</h3>
                                </div>
                                <h4 style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>Select Subject</h4>
                                <div className={styles.listGroup}>
                                    {subjects.length === 0 && <p className={styles.empty}>No subjects found.</p>}
                                    {subjects.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => handleSubClick(s)}
                                            className={styles.listItem}
                                        >
                                            <span>{s.name}</span>
                                            <ChevronRight className={styles.listItemIcon} size={20} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Level 3: Content (Folders/Notes) */}
                        {selectedSub && (
                            <div className="view-transition" id="notes-content">
                                <div className={styles.headerBar}>
                                    <button
                                        onClick={() => {
                                            if (selectedFolder) {
                                                updateUrl({ folder: null });
                                            } else {
                                                updateUrl({ sub: null });
                                            }
                                        }}
                                        className={styles.backBtn}
                                        title={selectedFolder ? "Back to Subject" : "Back to Subjects"}
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                    <h3 className={styles.headerTitle}>
                                        {selectedFolder ? selectedFolder.name : selectedSub.name}
                                    </h3>
                                </div>

                                {loading ? <div style={{ padding: "2rem", textAlign: "center" }}><p>Loading content...</p></div> : (
                                    <>
                                        {/* Folders */}
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
                                                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                                                        >
                                                            <Folder size={24} className="text-primary" fill="currentColor" fillOpacity={0.2} />
                                                            <span style={{ fontWeight: 600 }}>{folder.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        <div>
                                            {filteredNotes.length === 0 ? (
                                                <p className="text-muted" style={{ fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
                                                    {selectedFolder ? "This folder is empty." : (folders.length === 0 ? "No files uploaded to this subject yet." : "No files in the root of this subject.")}
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
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(note.fileUrl, note.title); }} className={styles.btn} title="Download"><Download size={18} /></button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleShare(note.fileUrl, note.title); }} className={styles.btn} title="Share Link"><Share2 size={18} /></button>
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
                    </>
                )}
            </div>

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
