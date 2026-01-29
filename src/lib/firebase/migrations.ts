import { db } from "./config";
import {
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    doc
} from "firebase/firestore";

const NOTES = "notes";

/**
 * Get ALL notes in the database (no filtering)
 * Useful for diagnostics and identifying orphaned data
 */
export const getAllNotes = async () => {
    const snapshot = await getDocs(collection(db, NOTES));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
};

/**
 * Get notes that are missing critical metadata fields
 */
export const findOrphanedNotes = async () => {
    const allNotes = await getAllNotes();
    return allNotes.filter((note: any) =>
        !note.subjectId ||
        !note.departmentId ||
        !note.batchId ||
        !note.semesterId
    );
};

/**
 * Validate note structure
 */
export const validateNoteStructure = (note: any) => {
    const requiredFields = ['subjectId', 'departmentId', 'batchId', 'semesterId', 'title', 'fileUrl', 'fileType'];
    const missingFields = requiredFields.filter(field => !note[field]);

    return {
        valid: missingFields.length === 0,
        missingFields,
        note
    };
};

/**
 * Get notes grouped by subject
 */
export const getNotesBySubject = async () => {
    const allNotes = await getAllNotes();
    const grouped = new Map<string, any[]>();

    allNotes.forEach((note: any) => {
        const subjectId = note.subjectId || 'orphaned';
        if (!grouped.has(subjectId)) {
            grouped.set(subjectId, []);
        }
        grouped.get(subjectId)!.push(note);
    });

    return Object.fromEntries(grouped);
};

/**
 * Repair note metadata by updating missing fields
 */
export const repairNoteMetadata = async (noteId: string, metadata: {
    subjectId?: string;
    departmentId?: string;
    batchId?: string;
    semesterId?: string;
}) => {
    const noteRef = doc(db, NOTES, noteId);
    await updateDoc(noteRef, metadata);
    return { noteId, updated: metadata };
};

/**
 * Get detailed statistics about notes
 */
export const getNoteStatistics = async () => {
    const allNotes = await getAllNotes();
    const orphaned = allNotes.filter((n: any) => !n.subjectId);
    const withSubject = allNotes.filter((n: any) => n.subjectId);

    const validationResults = allNotes.map(validateNoteStructure);
    const invalid = validationResults.filter(r => !r.valid);

    return {
        total: allNotes.length,
        withSubject: withSubject.length,
        orphaned: orphaned.length,
        invalid: invalid.length,
        invalidNotes: invalid
    };
};
