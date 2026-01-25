import { supabase } from './client';

export const uploadFile = async (file: File, path: string) => {
    // 1. Upload file to 'files' bucket (ensure this bucket exists in Supabase or change name)
    // Using upsert: false to avoid overwriting unless intended, but path usually includes unique ID.
    const { data, error } = await supabase.storage
        .from('files')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw error;
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
        .from('files')
        .getPublicUrl(path);

    return publicUrlData.publicUrl;
};

export const deleteFile = async (path: string) => {
    const { error } = await supabase.storage
        .from('files')
        .remove([path]);

    if (error) {
        throw error;
    }
};
