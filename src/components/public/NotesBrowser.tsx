"use client";

import { useState, useEffect } from "react";
import { getDepartments, getSemesters, getSubjects, getNotes, searchNotes } from "@/lib/firebase/firestore";
import { ChevronRight, File, Film, Image as ImageIcon, Download, Eye, Share2, Search, X } from "lucide-react";
import styles from "./NotesBrowser.module.css";

export default function NotesBrowser() {
    // ... State ... (Same as before)
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [selectedSem, setSelectedSem] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    async function loadDepartments() {
        const data = await getDepartments();
        setDepartments(data);
        if (data.length > 0) {
            handleDeptClick(data[0]);
        }
    }

    async function handleDeptClick(dept: any) {
        if (selectedDept?.id === dept.id && !isSearching) return;

        setSelectedDept(dept);
        setSelectedSem(null);
        setSelectedSub(null);
        setSearchQuery("");
        setIsSearching(false);
        setSemesters(await getSemesters(dept.id));
    }

    async function handleSemClick(sem: any) {
        if (selectedSem?.id === sem.id) {
            setSelectedSem(null); setSelectedSub(null);
            return;
        }
        setSelectedSem(sem);
        setSelectedSub(null);
        setSubjects(await getSubjects(sem.id));
    }

    async function handleSubClick(sub: any) {
        if (selectedSub?.id === sub.id) {
            setSelectedSub(null);
            return;
        }
        setSelectedSub(sub);
        setLoading(true);
        setNotes(await getNotes(sub.id));
        setLoading(false);
    }

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

    // ... Methods (handleShare, getPreview) ...
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
                                        <div key={note.id} className={styles.noteCard}>
                                            <div className={styles.preview}>
                                                {getPreview(note)}
                                            </div>
                                            <div className={styles.noteContent}>
                                                <h4 className={styles.noteName} title={note.title}>{note.title}</h4>
                                                <p className={styles.noteMeta}>{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                                <div className={styles.actions}>
                                                    <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.btn} title="View"><Eye size={18} /></a>
                                                    <a href={note.fileUrl} download target="_blank" rel="noopener noreferrer" className={styles.btn} title="Download"><Download size={18} /></a>
                                                    <button onClick={() => handleShare(note.fileUrl)} className={styles.btn} title="Share Link"><Share2 size={18} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {/* Semesters */}
                            <div className={`card ${!selectedDept ? styles.disabled : ''}`}>
                                <h3 className={styles.colTitle}>Semesters</h3>
                                {selectedDept && (
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

            {/* Notes List (Standard Browsing) */}
            {!isSearching && selectedSub && (
                <div className={styles.notesSection}>
                    <h3 className={styles.notesTitle}>
                        Notes for {selectedSub.name}
                    </h3>
                    {loading ? <p>Loading notes...</p> : notes.length === 0 ? <p>No notes uploaded yet.</p> : (
                        <div className={styles.notesGrid}>
                            {notes.map(note => (
                                <div key={note.id} className={styles.noteCard}>
                                    <div className={styles.preview}>
                                        {getPreview(note)}
                                    </div>
                                    <div className={styles.noteContent}>
                                        <h4 className={styles.noteName} title={note.title}>{note.title}</h4>
                                        <p className={styles.noteMeta}>{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                        <div className={styles.actions}>
                                            <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.btn} title="View"><Eye size={18} /></a>
                                            <a href={note.fileUrl} download target="_blank" rel="noopener noreferrer" className={styles.btn} title="Download"><Download size={18} /></a>
                                            <button onClick={() => handleShare(note.fileUrl)} className={styles.btn} title="Share Link"><Share2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
