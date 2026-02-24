
export const CONFIG = {
    // Authentication
    ALLOWED_EMAIL_DOMAIN: process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || '@cep.ac.in',

    // File Upload
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB

    // MIME types
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

    // Extension fallback (IMPORTANT for pptx, docx, etc.)
    ALLOWED_EXTENSIONS: [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'txt',
        'csv',
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'mp4',
        'webm',
        'mov',
        'avi',
        'mkv'
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


// Email validation
export const isAllowedEmail = (email: string): boolean => {
    return email.endsWith(CONFIG.ALLOWED_EMAIL_DOMAIN);
};


// ✅ FIXED: Now accepts File instead of string
export const isAllowedFileType = (file: File): boolean => {
    const mimeType = file.type;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // 1) Check MIME type
    if (mimeType && CONFIG.ALLOWED_FILE_TYPES.includes(mimeType as any)) {
        return true;
    }

    // 2) Fallback to extension (handles pptx/docx when browser sends wrong type)
    if (CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
        return true;
    }

    return false;
};


// Password validation
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
        .replace(/[<>]/g, '')
        .replace(/\s+/g, ' ');
};
