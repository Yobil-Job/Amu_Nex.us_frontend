// Cloudinary upload utility
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'club_management';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface UploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

/**
 * Upload an image file to Cloudinary
 * @param file - The image file to upload
 * @param folder - Optional folder path in Cloudinary (e.g., 'clubs/logos')
 * @returns Promise with the upload result containing the secure URL
 */
export const uploadImageToCloudinary = async (
  file: File,
  folder: string = 'clubs/logos'
): Promise<UploadResult> => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME in your .env file and restart your dev server.');
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary upload preset is not configured. Please set VITE_CLOUDINARY_UPLOAD_PRESET in your .env file and restart your dev server.');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  // Only add folder if specified
  if (folder) {
    formData.append('folder', folder);
  }
  
  // Note: Transformations can be configured in the upload preset in Cloudinary dashboard
  // This keeps the upload simple and avoids potential issues

  try {
    // Log for debugging (only in dev mode)
    if (import.meta.env.DEV) {
      console.log('📤 Uploading to Cloudinary:', {
        cloudName: CLOUDINARY_CLOUD_NAME,
        preset: CLOUDINARY_UPLOAD_PRESET,
        folder: folder,
        url: CLOUDINARY_UPLOAD_URL,
      });
    }

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      const errorMessage = errorData.message || errorData.error?.message || `Upload failed with status ${response.status}`;
      
      // Log detailed error for debugging
      if (import.meta.env.DEV) {
        console.error('❌ Cloudinary upload error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
      }
      
      // Provide helpful error messages
      if (response.status === 400) {
        throw new Error(`Invalid upload preset or configuration: ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error('Upload preset authentication failed. Make sure the preset is set to "Unsigned" in Cloudinary.');
      } else if (response.status === 404) {
        throw new Error(`Cloud name or upload preset not found. Check your .env file.`);
      } else {
        throw new Error(`Cloudinary upload failed: ${errorMessage}`);
      }
    }

    const data = await response.json();
    
    if (import.meta.env.DEV) {
      console.log('✅ Upload successful:', {
        url: data.secure_url,
        publicId: data.public_id,
      });
    }
    
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
    };
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error('Network error while uploading image. Please check your connection.');
  }
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  // Note: This requires Cloudinary Admin API credentials
  // For now, we'll just log it - implement if needed
  console.log('Delete image from Cloudinary:', publicId);
};

