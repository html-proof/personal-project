import { auth } from "./config";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    User,
    sendPasswordResetEmail,
    sendEmailVerification
} from "firebase/auth";
import { useEffect, useState } from "react";

// Auth Hook
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return { user, loading };
}

// Sign In
export const signIn = (email: string, pass: string) => {
    if (!email.endsWith("@cep.ac.in")) {
        throw new Error("Access denied.");
    }
    return signInWithEmailAndPassword(auth, email, pass);
};

// Sign Up (for initial seeding or admin use)
export const signUp = async (name: string, email: string, pass: string) => {
    if (!email.endsWith("@cep.ac.in")) {
        throw new Error("Access denied.");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
    return userCredential;
};

// Sign Out
export const signOut = () => firebaseSignOut(auth);

// Password Reset
export const resetPassword = (email: string) =>
    sendPasswordResetEmail(auth, email);
