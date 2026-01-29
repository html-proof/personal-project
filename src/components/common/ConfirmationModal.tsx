"use client";

import { X, AlertTriangle } from "lucide-react";
import styles from "./ConfirmationModal.module.css";
import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {isDanger && <AlertTriangle className={styles.iconDanger} size={24} />}
                        <h3 className={styles.title}>{title}</h3>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <p className={styles.message}>{message}</p>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className="btn btn-outline">
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                        style={isDanger ? { backgroundColor: "#dc2626", color: "white", borderColor: "#dc2626" } : {}}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
