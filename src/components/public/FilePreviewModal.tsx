"use client";

import { X, Download, FileText, Printer, Share2 } from "lucide-react";
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

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: file.title,
                    text: `Check out this material: ${file.title}`,
                    url: file.fileUrl,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(file.fileUrl);
                alert("Link copied to clipboard!");
            } catch (err) {
                console.error("Failed to copy", err);
            }
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(file.fileUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback
            window.open(file.fileUrl, '_blank');
        }
    };

    const handlePrint = async () => {
        try {
            // content fetch logic similar to download to ensure we have the data
            const response = await fetch(file.fileUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            if (isImage) {
                // Use iframe for image to avoid popout
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);

                const doc = iframe.contentWindow?.document;
                if (doc) {
                    doc.open();
                    doc.write(`
                        <html>
                            <head><title>Print ${file.title}</title></head>
                            <body style="margin:0; display:flex; justify-content:center; align-items:center;">
                                <img src="${blobUrl}" style="max-width:100%; max-height:100vh;" onload="window.print();" />
                            </body>
                        </html>
                    `);
                    doc.close();

                    // Cleanup after print dialog closes (approximate) or simple timeout
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        window.URL.revokeObjectURL(blobUrl);
                    }, 5000);
                }
            } else if (isPdf) {
                // For PDF, use iframe with blob url
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                iframe.src = blobUrl;

                iframe.onload = () => {
                    try {
                        iframe.contentWindow?.print();
                    } catch (e) {
                        console.error("Printing failed", e);
                        // Fallback to window print if iframe print fails
                        window.print();
                    } finally {
                        // Cleanup
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                            window.URL.revokeObjectURL(blobUrl);
                        }, 2000);
                    }
                };
                document.body.appendChild(iframe);
            } else {
                // For office docs or others, we can't print the blob directly via iframe easily.
                // Fallback: Print the current window (the preview modal)
                window.print();
                window.URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.error("Printing failed:", error);
            // Last resort fallback
            window.print();
        }
    };

    const isImage = file.fileType.startsWith("image/");
    const isVideo = file.fileType.startsWith("video/");
    const isPdf = file.fileType.includes("pdf");
    const isOfficeDoc =
        file.fileType.includes("msword") ||
        file.fileType.includes("wordprocessingml") ||
        file.fileType.includes("ms-excel") ||
        file.fileType.includes("spreadsheetml") ||
        file.fileType.includes("ms-powerpoint") ||
        file.fileType.includes("presentationml");

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
                    <button
                        onClick={handlePrint}
                        className="btn-icon"
                        title="Print"
                        style={{ background: "none", border: "none", color: "white", padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <Printer size={20} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="btn-icon"
                        title="Download"
                        style={{ background: "none", border: "none", color: "white", padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <Download size={20} />
                    </button>
                    <button
                        onClick={handleShare}
                        style={{ background: "none", border: "none", color: "white", padding: "0.5rem", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                        title="Share"
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <Share2 size={20} />
                    </button>
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
                    padding: "0.5rem",
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
                        maxWidth: "100%",
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

                    {isOfficeDoc && (
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`}
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

                    {!isImage && !isVideo && !isPdf && !isOfficeDoc && (
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
                            <button onClick={handleDownload} className="btn btn-primary">
                                Download File
                            </button>
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
