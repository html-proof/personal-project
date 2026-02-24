import { supabase } from './client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isDuplicateError = (message: string) => {
    const lower = message.toLowerCase();
    return lower.includes('already exists') || lower.includes('duplicate');
};

const isTransientUploadError = (error: unknown) => {
    const status =
        typeof error === 'object' && error !== null
            ? (error as { status?: number; statusCode?: number }).status ??
              (error as { statusCode?: number }).statusCode
            : undefined;

    if (typeof status === 'number' && [408, 425, 429, 500, 502, 503, 504].includes(status)) {
        return true;
    }

    const message =
        typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: string }).message ?? '').toLowerCase()
            : String(error ?? '').toLowerCase();

    return [
        'paused',
        'waking',
        'wake up',
        'temporarily unavailable',
        'gateway timeout',
        'network',
        'fetch failed',
        'timeout',
        'connection',
    ].some((token) => message.includes(token));
};

const wakeSupabaseProject = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;

    const healthUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`;

    try {
        await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
    } catch (error) {
        console.warn('Supabase wake ping failed:', error);
    }
};

const attemptUpload = async (file: File, path: string) => {
    const { error } = await supabase.storage
        .from('files')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream',
        });

    if (error) {
        if (isDuplicateError(error.message || '')) {
            const { error: upsertError } = await supabase.storage
                .from('files')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type || 'application/octet-stream',
                });

            if (upsertError) {
                throw new Error(`Upload failed: ${upsertError.message}`);
            }
        } else {
            throw error;
        }
    }

    const { data: publicUrlData } = supabase.storage
        .from('files')
        .getPublicUrl(path);

    return publicUrlData.publicUrl;
};

export const uploadFile = async (file: File, path: string, retries = 4) => {
    let lastError: unknown;

    await wakeSupabaseProject();

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await attemptUpload(file, path);
        } catch (error) {
            lastError = error;
            const shouldRetry = attempt < retries - 1;

            if (!shouldRetry) {
                break;
            }

            const transient = isTransientUploadError(error);
            const retryDelayMs = transient
                ? Math.min(30000, 5000 * (attempt + 1))
                : 1000 * (attempt + 1);

            if (transient) {
                await wakeSupabaseProject();
            }

            console.warn(
                `Supabase upload retry ${attempt + 1}/${retries - 1} for ${path} in ${retryDelayMs}ms:`,
                error
            );
            await delay(retryDelayMs);
        }
    }

    const finalMessage =
        typeof lastError === 'object' && lastError !== null && 'message' in lastError
            ? String((lastError as { message?: string }).message ?? 'Unknown error')
            : 'Unknown error';

    throw new Error(`Upload failed after retries: ${finalMessage}`);
};

export const deleteFile = async (path: string) => {
    const { error } = await supabase.storage
        .from('files')
        .remove([path]);

    if (error) {
        throw error;
    }
};
