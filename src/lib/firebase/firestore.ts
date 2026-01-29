import { db } from "./config";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    serverTimestamp,
    orderBy
} from "firebase/firestore";

// --- Collections ---
const DEPARTMENTS = "departments";
const BATCHES = "batches";
const SEMESTERS = "semesters";
const SUBJECTS = "subjects";
const NOTES = "notes";
const FOLDERS = "folders";

// --- Departments ---
export const getDepartments = async () => {
    const q = query(collection(db, DEPARTMENTS), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createDepartment = (name: string) =>
    addDoc(collection(db, DEPARTMENTS), { name, createdAt: serverTimestamp() });

export const updateDepartment = (id: string, name: string) =>
    updateDoc(doc(db, DEPARTMENTS, id), { name });

export const deleteDepartment = (id: string) => deleteDoc(doc(db, DEPARTMENTS, id));

// --- Batches ---
export const getBatches = async (departmentId: string) => {
    const q = query(collection(db, BATCHES), where("departmentId", "==", departmentId));
    const snapshot = await getDocs(q);
    // Client-side sort to avoid composite index requirement
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
};

export const createBatch = (departmentId: string, name: string) =>
    addDoc(collection(db, BATCHES), { departmentId, name, createdAt: serverTimestamp() });

export const updateBatch = (id: string, name: string) =>
    updateDoc(doc(db, BATCHES, id), { name });

export const deleteBatch = (id: string) => deleteDoc(doc(db, BATCHES, id));

// --- Semesters ---
export const getSemesters = async (batchId: string) => {
    const q = query(collection(db, SEMESTERS), where("batchId", "==", batchId));
    const snapshot = await getDocs(q);
    // Sort manually or add composite index
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name));
};

export const createSemester = (batchId: string, name: string) =>
    addDoc(collection(db, SEMESTERS), { batchId, name, createdAt: serverTimestamp() });

export const updateSemester = (id: string, name: string) =>
    updateDoc(doc(db, SEMESTERS, id), { name });

export const deleteSemester = (id: string) => deleteDoc(doc(db, SEMESTERS, id));

// --- Subjects ---
export const getSubjects = async (semesterId: string) => {
    const q = query(collection(db, SUBJECTS), where("semesterId", "==", semesterId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name));
};

export const createSubject = (semesterId: string, name: string) =>
    addDoc(collection(db, SUBJECTS), { semesterId, name, createdAt: serverTimestamp() });

export const updateSubject = (id: string, name: string) =>
    updateDoc(doc(db, SUBJECTS, id), { name });

export const deleteSubject = (id: string) => deleteDoc(doc(db, SUBJECTS, id));

// --- Folders ---
export const getFolders = async (subjectId: string) => {
    const q = query(collection(db, FOLDERS), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
};

export const createFolder = (data: any) =>
    addDoc(collection(db, FOLDERS), { ...data, createdAt: serverTimestamp() });

export const updateFolder = (id: string, name: string) =>
    updateDoc(doc(db, FOLDERS, id), { name });

export const moveFolder = (id: string, subjectId: string) =>
    updateDoc(doc(db, FOLDERS, id), { subjectId });

export const deleteFolder = (id: string) => deleteDoc(doc(db, FOLDERS, id));

export const getUserFolders = async (userId: string) => {
    const q = query(collection(db, FOLDERS), where("createdBy", "==", userId), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// --- Notes ---
export const getNotes = async (subjectId: string) => {
    const q = query(collection(db, NOTES), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
            const tA = a.createdAt?.seconds || 0;
            const tB = b.createdAt?.seconds || 0;
            return tB - tA; // Descending
        });
};



export const createNote = (data: any) =>
    addDoc(collection(db, NOTES), { ...data, createdAt: serverTimestamp() });

export const updateNote = (id: string, updates: any) =>
    updateDoc(doc(db, NOTES, id), updates);

export const deleteNote = (id: string) => deleteDoc(doc(db, NOTES, id));

export const getFolderNotes = async (folderId: string) => {
    const q = query(collection(db, NOTES), where("folderId", "==", folderId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
            const tA = a.createdAt?.seconds || 0;
            const tB = b.createdAt?.seconds || 0;
            return tB - tA; // Descending
        });
};

export const moveNote = (id: string, folderId: string | null) =>
    updateDoc(doc(db, NOTES, id), { folderId });

export const moveNotesBulk = async (ids: string[], folderId: string | null) => {
    const promises = ids.map(id => updateDoc(doc(db, NOTES, id), { folderId }));
    return Promise.all(promises);
};

export const deleteNotesBulk = async (ids: string[]) => {
    const promises = ids.map(id => deleteDoc(doc(db, NOTES, id)));
    return Promise.all(promises);
};

export const getUserNotes = async (userId: string) => {
    const q = query(collection(db, NOTES), where("uploadedBy", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
            const tA = a.createdAt?.seconds || 0;
            const tB = b.createdAt?.seconds || 0;
            return tB - tA; // Descending
        });
};

export const searchNotes = async (departmentId: string, searchTerm: string) => {
    // Simple prefix search using startAt/endAt pattern or >= and <= pattern
    // Note: This requires an index on [departmentId, title]
    const q = query(
        collection(db, NOTES),
        where("departmentId", "==", departmentId),
        where("title", ">=", searchTerm),
        where("title", "<=", searchTerm + "\uf8ff")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};
