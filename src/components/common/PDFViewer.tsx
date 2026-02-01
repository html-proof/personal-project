"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";

interface PDFViewerProps {
    fileUrl: string;
    fileName?: string;
}

export default function PDFViewer({ fileUrl, fileName }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pdfDocRef = useRef<any>(null);

    useEffect(() => {
        loadPDF();
        return () => {
            if (pdfDocRef.current) {
                pdfDocRef.current.destroy();
            }
        };
    }, [fileUrl]);

    useEffect(() => {
        if (pdfDocRef.current) {
            renderPage(pageNumber);
        }
    }, [pageNumber, scale]);

    async function loadPDF() {
        try {
            setLoading(true);
            setError(null);

            // Dynamically import pdfjs-dist
            const pdfjsLib = await import('pdfjs-dist');

            // Use unpkg CDN for worker (more reliable than cdnjs)
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

            // Configure to handle CORS and various PDF sources
            const loadingTask = pdfjsLib.getDocument({
                url: fileUrl,
                withCredentials: false,
                isEvalSupported: false,
                useSystemFonts: true,
            });

            const pdf = await loadingTask.promise;

            pdfDocRef.current = pdf;
            setNumPages(pdf.numPages);
            setPageNumber(1);
            setLoading(false);

            renderPage(1);
        } catch (err: any) {
            console.error('Error loading PDF:', err);
            // Provide more helpful error message
            const errorMsg = err?.message?.includes('CORS')
                ? 'Unable to load PDF due to security restrictions'
                : 'Failed to load PDF';
            setError(errorMsg);
            setLoading(false);
        }
    }

    async function renderPage(pageNum: number) {
        if (!pdfDocRef.current || !canvasRef.current) return;

        try {
            const page = await pdfDocRef.current.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;
        } catch (err) {
            console.error('Error rendering page:', err);
        }
    }

    function changePage(offset: number) {
        const newPage = pageNumber + offset;
        if (newPage >= 1 && newPage <= numPages) {
            setPageNumber(newPage);
        }
    }

    function zoomIn() {
        setScale(prev => Math.min(prev + 0.2, 3.0));
    }

    function zoomOut() {
        setScale(prev => Math.max(prev - 0.2, 0.5));
    }

    if (loading) {
        return (
            <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "1rem",
                color: "#64748b"
            }}>
                <Loader2 size={48} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                <p>Loading PDF...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "1rem",
                color: "#ef4444",
                padding: "2rem",
                textAlign: "center"
            }}>
                <p>{error}</p>
                <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
                    Unable to display PDF in browser.
                </p>
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        padding: "0.75rem 1.5rem",
                        background: "#3b82f6",
                        color: "white",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontSize: "0.95rem",
                        fontWeight: 500
                    }}
                >
                    Open PDF in New Tab
                </a>
            </div>
        );
    }

    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#f8fafc"
        }}>
            {/* Controls */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 1rem",
                background: "white",
                borderBottom: "1px solid #e2e8f0",
                gap: "1rem",
                flexWrap: "wrap"
            }}>
                {/* Page Navigation */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                        onClick={() => changePage(-1)}
                        disabled={pageNumber <= 1}
                        style={{
                            padding: "0.5rem",
                            background: pageNumber <= 1 ? "#f1f5f9" : "#3b82f6",
                            color: pageNumber <= 1 ? "#94a3b8" : "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontSize: "0.9rem", color: "#64748b", minWidth: "80px", textAlign: "center" }}>
                        {pageNumber} / {numPages}
                    </span>
                    <button
                        onClick={() => changePage(1)}
                        disabled={pageNumber >= numPages}
                        style={{
                            padding: "0.5rem",
                            background: pageNumber >= numPages ? "#f1f5f9" : "#3b82f6",
                            color: pageNumber >= numPages ? "#94a3b8" : "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: pageNumber >= numPages ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Zoom Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                        style={{
                            padding: "0.5rem",
                            background: scale <= 0.5 ? "#f1f5f9" : "#3b82f6",
                            color: scale <= 0.5 ? "#94a3b8" : "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: scale <= 0.5 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span style={{ fontSize: "0.9rem", color: "#64748b", minWidth: "60px", textAlign: "center" }}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        disabled={scale >= 3.0}
                        style={{
                            padding: "0.5rem",
                            background: scale >= 3.0 ? "#f1f5f9" : "#3b82f6",
                            color: scale >= 3.0 ? "#94a3b8" : "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: scale >= 3.0 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <ZoomIn size={18} />
                    </button>

                    {/* External Link Button - Always visible as fallback */}
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: "0.5rem",
                            background: "#e2e8f0",
                            color: "#475569",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                            marginLeft: "0.5rem"
                        }}
                        title="Open in New Tab"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>
            </div>

            {/* PDF Canvas */}
            <div style={{
                flex: 1,
                overflow: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                padding: "1rem",
                background: "#525252"
            }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        maxWidth: "100%",
                        height: "auto",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                />
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
