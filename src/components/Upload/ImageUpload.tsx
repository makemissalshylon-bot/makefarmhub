import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader } from 'lucide-react';
import { uploadImage } from '../../services/imageUploadService';
import '../../styles/image-upload.css';

interface ImageUploadProps {
  maxImages?: number;
  maxSizeMB?: number;
  onImagesChange: (images: UploadedImage[]) => void;
  initialImages?: UploadedImage[];
  bucket?: string;
  folder?: string;
}

export interface UploadedImage {
  id: string;
  file?: File;
  url: string;
  preview: string;
  size: number;
  name: string;
}

export default function ImageUpload({
  maxImages = 5,
  maxSizeMB = 5,
  onImagesChange,
  initialImages = [],
  bucket = 'listing-images',
  folder,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<string> => {
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

          // Max dimensions
          const maxWidth = 1200;
          const maxHeight = 1200;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(URL.createObjectURL(blob));
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please upload only image files';
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Image size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      setError('');

      const fileArray = Array.from(files);

      // Check if adding these files would exceed max
      if (images.length + fileArray.length > maxImages) {
        setError(`You can only upload up to ${maxImages} images`);
        return;
      }

      setUploading(true);
      setUploadProgress({ done: 0, total: fileArray.length });
      const newImages: UploadedImage[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        try {
          // Create local preview immediately
          const compressedUrl = await compressImage(file);

          // Upload to cloud storage
          const result = await uploadImage(file, bucket, folder);
          const cloudUrl = result.success && result.url ? result.url : compressedUrl;

          const newImage: UploadedImage = {
            id: `${Date.now()}-${Math.random()}`,
            file,
            url: cloudUrl,
            preview: compressedUrl,
            size: file.size,
            name: file.name
          };
          newImages.push(newImage);
          setUploadProgress({ done: i + 1, total: fileArray.length });
        } catch (err) {
          console.error('Error processing image:', err);
          setError('Failed to process image');
        }
      }

      setUploading(false);

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      }
    },
    [images, maxImages, maxSizeMB, onImagesChange, bucket, folder]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setError('');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-header">
        <label>Product Images *</label>
        <span className="image-count">
          {images.length} / {maxImages}
        </span>
      </div>

      {/* Upload Area */}
      {images.length < maxImages && !uploading && (
        <div
          className={`image-upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <Upload size={48} />
          <h4>Drop images here or click to browse</h4>
          <p>
            Maximum {maxImages} images • Max {maxSizeMB}MB each
          </p>
          <p className="supported-formats">Supports: JPG, PNG, WEBP</p>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="image-upload-progress">
          <Loader size={24} className="spinning" />
          <p>Uploading {uploadProgress.done}/{uploadProgress.total} images...</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress.total ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Error Message */}
      {error && (
        <div className="upload-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((image, index) => (
            <div key={image.id} className="image-preview-item">
              {index === 0 && <span className="primary-badge">Primary</span>}
              <img src={image.preview} alt={image.name} />
              <button
                className="remove-image-btn"
                onClick={() => removeImage(image.id)}
                type="button"
              >
                <X size={16} />
              </button>
              <div className="image-info">
                <span className="image-name">{image.name}</span>
                <span className="image-size">
                  {(image.size / 1024).toFixed(0)} KB
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="no-images-placeholder">
          <ImageIcon size={48} />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
