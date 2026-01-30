"use client";

import { X, Download, FileText, ExternalLink } from "lucide-react";
import { useEffect } from "react";

interface FilePreviewModalProps {
    file: {
        title: string;
        fileUrl: string;
        fileType: string;
    };
    onClose: () => void;
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
    // Prevent scrolling on body when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const isImage = file.fileType.startsWith("image/");
    const isVideo = file.fileType.startsWith("video/");
    const isPdf = file.fileType.includes("pdf");

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                animation: "fadeIn 0.2s ease-in-out"
            }}
            onClick={onClose}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem 1.5rem",
                    color: "white",
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(4px)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <FileText size={20} />
                    <span style={{ fontWeight: 500, fontSize: "1.1rem" }}>{file.title}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title="Open in new tab"
                        style={{ color: "white", padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <ExternalLink size={20} />
                    </a>
                    <a
                        href={file.fileUrl}
                        download
                        className="btn-icon"
                        title="Download"
                        style={{ color: "white", padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <Download size={20} />
                    </a>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", color: "white", padding: "0.5rem", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                    overflow: "hidden"
                }}
                onClick={onClose}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        maxWidth: isPdf ? "1000px" : "auto"
                    }}
                >
                    {isImage && (
                        <img
                            src={file.fileUrl}
                            alt={file.title}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "90vh",
                                objectFit: "contain",
                                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                                borderRadius: "4px"
                            }}
                        />
                    )}

                    {isVideo && (
                        <video
                            src={file.fileUrl}
                            controls
                            autoPlay
                            style={{
                                maxWidth: "100%",
                                maxHeight: "90vh",
                                borderRadius: "4px",
                                boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                            }}
                        />
                    )}

                    {isPdf && (
                        <iframe
                            src={file.fileUrl}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                                background: "white",
                                borderRadius: "8px",
                                boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                            }}
                        />
                    )}

                    {!isImage && !isVideo && !isPdf && (
                        <div style={{
                            background: "var(--surface)",
                            padding: "3rem",
                            borderRadius: "12px",
                            textAlign: "center",
                            color: "var(--text-main)"
                        }}>
                            <FileText size={64} style={{ marginBottom: "1rem", color: "var(--primary)" }} />
                            <h3 style={{ marginBottom: "0.5rem" }}>Preview not available</h3>
                            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                                This file type cannot be previewed directly.
                            </p>
                            <a href={file.fileUrl} download className="btn btn-primary">
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
