import { BusinessImage, BusinessImageType } from '../types/business';

const BUSINESS_IMAGES_STORAGE_KEY = 'spotsini_business_images_v1';

// Seed initial gallery images for demo businesses in Penggilingan
export const INITIAL_BUSINESS_IMAGES: BusinessImage[] = [
  {
    id: 'IMG-001',
    business_id: 'BIZ-PGL-001', // Rujak Jambu Kristal
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    image_type: 'utama',
    created_at: '2026-09-01'
  },
  {
    id: 'IMG-002',
    business_id: 'BIZ-PGL-001',
    image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
    image_type: 'produk',
    created_at: '2026-09-02'
  },
  {
    id: 'IMG-003',
    business_id: 'BIZ-PGL-101', // Konveksi Ibu Ratu
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80',
    image_type: 'utama',
    created_at: '2026-09-05'
  },
  {
    id: 'IMG-004',
    business_id: 'BIZ-PGL-101',
    image_url: 'https://images.unsplash.com/photo-1528458876861-544fd1761a91?w=800&auto=format&fit=crop&q=80',
    image_type: 'produk',
    created_at: '2026-09-06'
  },
  {
    id: 'IMG-005',
    business_id: 'BIZ-PGL-101',
    image_url: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=800&auto=format&fit=crop&q=80',
    image_type: 'tempat',
    created_at: '2026-09-07'
  },
  {
    id: 'IMG-006',
    business_id: 'BIZ-PGL-002', // Ayam Bakar Pak Yono
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
    image_type: 'utama',
    created_at: '2026-09-10'
  },
  {
    id: 'IMG-007',
    business_id: 'BIZ-PGL-002',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    image_type: 'produk',
    created_at: '2026-09-11'
  }
];

export function getStoredImages(): BusinessImage[] {
  try {
    const raw = localStorage.getItem(BUSINESS_IMAGES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BUSINESS_IMAGES_STORAGE_KEY, JSON.stringify(INITIAL_BUSINESS_IMAGES));
      return INITIAL_BUSINESS_IMAGES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_BUSINESS_IMAGES;
  }
}

export function saveStoredImages(images: BusinessImage[]): void {
  localStorage.setItem(BUSINESS_IMAGES_STORAGE_KEY, JSON.stringify(images));
}

export function getImagesForBusiness(businessId: string): BusinessImage[] {
  return getStoredImages().filter(img => img.business_id === businessId);
}

export function getPrimaryImageForBusiness(businessId: string): string | null {
  const bizImgs = getImagesForBusiness(businessId);
  const primary = bizImgs.find(img => img.image_type === 'utama');
  return primary ? primary.image_url : (bizImgs[0]?.image_url || `/images/businesses/${businessId}.jpg`);
}

/**
 * Validates image file type and size
 * Allowed: jpg, jpeg, png, webp
 * Max size: 5 MB
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Format berkas tidak didukung. Harap unggah format JPG, JPEG, PNG, atau WEBP.'
    };
  }

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 5 MB.`
    };
  }

  return { valid: true };
}

/**
 * Compresses an image file using browser Canvas API to prevent LocalStorage quota overflow.
 * Scales down to max 900px and outputs a high-efficiency JPEG DataURL (~40-70KB).
 */
export function compressImageFile(file: File, maxDimension: number = 900, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid atau rusak.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Saves a new business image and persists to localStorage.
 */
export function addBusinessImage(
  paramsOrBusinessId: {
    businessId: string;
    imageUrl: string;
    imageType: BusinessImageType;
  } | string,
  imageUrl?: string,
  imageType?: BusinessImageType
): BusinessImage {
  let bId: string;
  let url: string;
  let type: BusinessImageType;

  if (typeof paramsOrBusinessId === 'object') {
    bId = paramsOrBusinessId.businessId;
    url = paramsOrBusinessId.imageUrl;
    type = paramsOrBusinessId.imageType;
  } else {
    bId = paramsOrBusinessId;
    url = imageUrl!;
    type = imageType || 'gallery';
  }

  const all = getStoredImages();
  const newImg: BusinessImage = {
    id: `IMG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    business_id: bId,
    image_url: url,
    image_type: type,
    created_at: new Date().toISOString().slice(0, 10)
  };

  // If this is set to 'utama', demote any existing 'utama' for this business to 'gallery'
  let updated = all;
  if (type === 'utama') {
    updated = all.map(img => {
      if (img.business_id === bId && img.image_type === 'utama') {
        return { ...img, image_type: 'gallery' as const };
      }
      return img;
    });
  }

  saveStoredImages([newImg, ...updated]);
  return newImg;
}

/**
 * Deletes a business image by ID
 */
export function deleteBusinessImage(imageId: string): void {
  const all = getStoredImages();
  const updated = all.filter(img => img.id !== imageId);
  saveStoredImages(updated);
}
