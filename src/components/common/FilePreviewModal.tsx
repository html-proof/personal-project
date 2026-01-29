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

    const isImage = fileType.includes("image");
    const isVideo = fileType.includes("video");
    const isPDF = fileType.includes("pdf");
    // Simple check for office files based on type or extension if needed, 
    // but usually these have specific mime types or we can imply from extension in name.
    // Common Office Mime Types:
    // application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
    // application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    // application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation
    const isOffice =
        fileType.includes("word") ||
        fileType.includes("excel") ||
        fileType.includes("spreadsheet") ||
        fileType.includes("powerpoint") ||
        fileType.includes("presentation") ||
        fileName.endsWith(".doc") || fileName.endsWith(".docx") ||
        fileName.endsWith(".xls") || fileName.endsWith(".xlsx") ||
        fileName.endsWith(".ppt") || fileName.endsWith(".pptx");

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
                        <iframe src={fileUrl} style={{ width: "100%", height: "100%", border: "none" }} />
                    )}

                    {isOffice && (
                        <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                            style={{ width: "100%", height: "100%", border: "none" }}
                        />
                    )}

                    {!isImage && !isVideo && !isPDF && !isOffice && (
                        <div style={{ textAlign: "center", color: "#64748b" }}>
                            <p style={{ marginBottom: "1rem" }}>Preview not available for this file type.</p>
                            <a href={fileUrl} download className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "#2563eb", color: "white", borderRadius: "6px", textDecoration: "none" }}>
                                <Download size={18} /> Download to View
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
