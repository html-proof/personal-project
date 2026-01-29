// Configuration constants for the application

export const CONFIG = {
    // Authentication
    ALLOWED_EMAIL_DOMAIN: process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || '@cep.ac.in',

    // File Upload
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_FILE_TYPES: [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Videos
        'video/mp4',
        'video/webm',
        'video/quicktime',
    ],

    // Password Requirements
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBER: true,
    PASSWORD_REQUIRE_SPECIAL: true,

    // Undo
    UNDO_DURATION_MS: 30000, // 30 seconds
} as const;

// Utility functions
export const isAllowedEmail = (email: string): boolean => {
    return email.endsWith(CONFIG.ALLOWED_EMAIL_DOMAIN);
};

export const isAllowedFileType = (fileType: string): boolean => {
    return CONFIG.ALLOWED_FILE_TYPES.includes(fileType as any);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < CONFIG.PASSWORD_MIN_LENGTH) {
        return { valid: false, message: `Password must be at least ${CONFIG.PASSWORD_MIN_LENGTH} characters` };
    }
    if (CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (CONFIG.PASSWORD_REQUIRE_NUMBER && !/\d/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and > to prevent basic XSS
        .replace(/\s+/g, ' '); // Normalize whitespace
};
