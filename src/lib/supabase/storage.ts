import { supabase } from './client';

export const uploadFile = async (file: File, path: string, retries = 3) => {
    let lastError: any;
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // 1. Upload file to 'files' bucket (ensure this bucket exists in Supabase or change name)
            const { data, error } = await supabase.storage
                .from('files')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type || 'application/octet-stream',
                });

            if (error) {
                console.error(`Supabase upload error (attempt ${attempt + 1}/${retries}):`, error);
                lastError = error;
                
                // If it's a duplicate file error, try with upsert
                if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
                    const { data: upsertData, error: upsertError } = await supabase.storage
                        .from('files')
                        .upload(path, file, {
                            cacheControl: '3600',
                            upsert: true,
                            contentType: file.type || 'application/octet-stream',
                        });
                    
                    if (upsertError) {
                        throw new Error(`Upload failed: ${upsertError.message}`);
                    }
                    
                    // Success with upsert
                    const { data: publicUrlData } = supabase.storage
                        .from('files')
                        .getPublicUrl(path);
                    return publicUrlData.publicUrl;
                }
                
                // Retry on network errors
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
                
                throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
            }

            // 2. Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from('files')
                .getPublicUrl(path);

            return publicUrlData.publicUrl;
        } catch (err: any) {
            lastError = err;
            if (attempt < retries - 1) {
                console.log(`Retrying upload for ${path} (attempt ${attempt + 2}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }
    
    throw lastError || new Error('Upload failed after retries');
};

export const deleteFile = async (path: string) => {
    const { error } = await supabase.storage
        .from('files')
        .remove([path]);

    if (error) {
        throw error;
    }
};
