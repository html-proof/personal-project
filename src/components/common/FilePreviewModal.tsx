"use client";

import { X, ExternalLink, Download } from "lucide-react";

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
    fileType: string;
}

export default function FilePreviewModal({ isOpen, onClose, fileUrl, fileName, fileType }: FilePreviewModalProps) {
    if (!isOpen) return null;

    // 1. Robust File Type Detection
    // Prefer extension from URL as it's the most reliable source of truth
    const urlExtension = fileUrl.split('.').pop()?.toLowerCase() || "";
    const titleExtension = fileName.split('.').pop()?.toLowerCase() || "";
    const effectiveExtension = urlExtension.length > 1 && urlExtension.length < 5 ? urlExtension : titleExtension;

    // MIME type check as backup
    const mimeType = fileType || "";

    // 2. Strict Category Checks
    const isImage = mimeType.includes("image") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff"].includes(effectiveExtension);
    const isVideo = mimeType.includes("video") || ["mp4", "webm", "ogg", "mov", "avi", "mkv", "wmv"].includes(effectiveExtension);
    const isPDF = mimeType.includes("pdf") || effectiveExtension === "pdf";

    // 3. Universal Catch-All Strategy
    // If it's not media (Image/Video) and not PDF (Custom Viewer), 
    // we send IT ALL to Google Docs Viewer. 
    // Google Viewer handles Office, Text, Code, Adobe, CAD, and gives a decent fallback for others.
    const showGoogleViewer = !isImage && !isVideo && !isPDF;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "2rem"
        }} onClick={onClose}>
            <div style={{
                background: "white", borderRadius: "8px", width: "90%", height: "90%",
                maxWidth: "1200px", display: "flex", flexDirection: "column",
                position: "relative"
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: "1rem", borderBottom: "1px solid #e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{fileName}</h3>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <a href={fileUrl} target="_blank" rel="noreferrer" title="Open in new tab" style={{ color: "#64748b" }}>
                            <ExternalLink size={20} />
                        </a>
                        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, background: "#f8fafc", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isImage && (
                        <img src={fileUrl} alt={fileName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    )}

                    {isVideo && (
                        <video src={fileUrl} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
                    )}

                    {isPDF && (
                        <iframe
                            src={fileUrl}
                            style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
                            title={fileName}
                        />
                    )}

                    {showGoogleViewer && (
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                            style={{ width: "100%", height: "100%", border: "none" }}
                            title="Document Preview"
                        />
                    )}

                    {!isImage && !isVideo && !isPDF && !showGoogleViewer && (
                        <div style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                            <p style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Preview unavailable for this file.</p>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary"
                                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "#2563eb", color: "white", borderRadius: "6px", textDecoration: "none" }}
                            >
                                <Download size={18} /> Open in New Tab
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
