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

export const signIn = async (email: string, pass: string) => {
    if (!isAllowedEmail(email)) {
        throw new Error("ACCESS_DENIED");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);

    if (!userCredential.user.emailVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
    }

    return userCredential;
};

export const signUp = async (name: string, email: string, pass: string) => {

    if (!isAllowedEmail(email)) {
        throw new Error("ACCESS_DENIED");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
    return userCredential;
};

export const signOut = () => firebaseSignOut(auth);

export const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return methods.length > 0;
    } catch (error: any) {
        if (error.code === 'auth/invalid-email') {
            return false;
        }
        console.error("Error checking email existence:", error);
        return false;
    }
};

export const resetPassword = (email: string) =>
    sendPasswordResetEmail(auth, email);
