/**
 * Image Optimization Service
 * Compress and resize images before upload
 */

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const imageOptimizationService = {
  /**
   * Optimize image before upload
   */
  async optimizeImage(
    file: File,
    options: OptimizationOptions = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      format = 'jpeg',
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            `image/${format}`,
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Generate thumbnail
   */
  async generateThumbnail(file: File, size: number = 200): Promise<Blob> {
    return this.optimizeImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
    });
  },

  /**
   * Batch optimize images
   */
  async optimizeImages(
    files: File[],
    options?: OptimizationOptions
  ): Promise<Blob[]> {
    const promises = files.map((file) => this.optimizeImage(file, options));
    return Promise.all(promises);
  },

  /**
   * Get optimized file size
   */
  async getOptimizedSize(file: File): Promise<{ original: number; optimized: number; savings: number }> {
    const originalSize = file.size;
    const optimized = await this.optimizeImage(file);
    const optimizedSize = optimized.size;
    const savings = ((originalSize - optimizedSize) / originalSize) * 100;

    return {
      original: originalSize,
      optimized: optimizedSize,
      savings: Math.round(savings),
    };
  },

  /**
   * Convert to WebP
   */
  async convertToWebP(file: File): Promise<Blob> {
    return this.optimizeImage(file, { format: 'webp', quality: 0.85 });
  },

  /**
   * Validate image file
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, or WebP.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 10MB.' };
    }

    return { valid: true };
  },
};
