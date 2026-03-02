import { supabase, isSupabaseReady } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image file to Supabase Storage or fallback to base64 localStorage
 */
export async function uploadImage(
  file: File,
  bucket: string = 'listing-images',
  folder?: string
): Promise<UploadResult> {
  // Try Supabase Storage first
  if (isSupabaseReady()) {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.warn('Supabase storage upload failed:', error.message);
        // Fall through to fallback
      } else {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return { success: true, url: urlData.publicUrl };
      }
    } catch (err) {
      console.warn('Supabase storage error:', err);
    }
  }

  // Fallback: compress and convert to base64 data URL for localStorage persistence
  try {
    const compressed = await compressImageFile(file, 800, 0.7);
    return { success: true, url: compressed };
  } catch (err: any) {
    return { success: false, error: err.message || 'Upload failed' };
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  bucket: string = 'listing-images',
  folder?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], bucket, folder);
    results.push(result);
    onProgress?.(i + 1, files.length);
  }

  return results;
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(url: string, bucket: string = 'listing-images'): Promise<boolean> {
  if (!isSupabaseReady()) return true;

  try {
    // Extract path from URL
    const bucketUrl = supabase.storage.from(bucket).getPublicUrl('').data.publicUrl;
    const path = url.replace(bucketUrl, '');
    if (!path) return true;

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn('Failed to delete image:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Compress an image file and return a base64 data URL
 */
function compressImageFile(file: File, maxDim: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) { height *= maxDim / width; width = maxDim; }
        } else {
          if (height > maxDim) { width *= maxDim / height; height = maxDim; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  return uploadImage(file, 'avatars', userId);
}
