import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const uploadFile = async (file: File, path: string) => {
    const fileRef = ref(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
};

export const deleteFile = async (path: string) => {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
};
