import { auth } from "./config";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    User,
    sendPasswordResetEmail,
    sendEmailVerification,
    fetchSignInMethodsForEmail
} from "firebase/auth";
import { useEffect, useState } from "react";
import { isAllowedEmail } from "../config";

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
export const signIn = async (email: string, pass: string) => {
    if (!isAllowedEmail(email)) {
        throw new Error("ACCESS_DENIED");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);

    // Check if email is verified
    if (!userCredential.user.emailVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
    }

    return userCredential;
};

// Sign Up (for initial seeding or admin use)
export const signUp = async (name: string, email: string, pass: string) => {

    if (!isAllowedEmail(email)) {
        throw new Error("ACCESS_DENIED");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
    return userCredential;
};

// Sign Out
export const signOut = () => firebaseSignOut(auth);

// Check if email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return methods.length > 0;
    } catch (error) {
        console.error("Error checking email:", error);
        return false;
    }
};

// Password Reset
export const resetPassword = (email: string) =>
    sendPasswordResetEmail(auth, email);
