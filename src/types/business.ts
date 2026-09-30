export type BusinessSector = 
  | 'Kuliner' 
  | 'Jasa' 
  | 'Perdagangan/Sembako' 
  | 'Kriya & Konveksi' 
  | 'Lainnya';

export type VerificationStatus = 
  | 'Draft' 
  | 'Menunggu Verifikasi' 
  | 'Terverifikasi' 
  | 'Ditolak/Perlu Perbaikan';

export type DataSource = 
  | 'SPS' 
  | 'Excel Manual' 
  | 'Form Ajukan Usaha';

export interface GooglePlaceReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url?: string;
  authorAttribution?: {
    displayName: string;
    photoUri?: string;
    uri?: string;
  };
}

export interface Business {
  id: string;
  owner_id?: string;
  no: number;
  nama_usaha: string;
  nama_pemilik: string;
  no_telepon: string; // Formatted or normalized to 08... or +62
  alamat_lengkap: string;
  rt: string;
  rw: string; // e.g. "RW 06", "RW 10"
  sektor_usaha: BusinessSector;
  latitude: number | null;
  longitude: number | null;
  maps_url: string;
  foto_usaha: string | null;
  status_verifikasi: VerificationStatus;
  produk: string;
  sumber_data: DataSource;
  growth_score?: number; // 0 - 100%
  rating_avg?: number; // 1.0 - 5.0
  review_count?: number;
  view_count?: number;
  // Google Maps Integration fields (Task 3, 4, 9, 11)
  google_place_id?: string;
  placeId?: string;
  mapsUrl?: string;
  google_rating?: number;
  google_review_count?: number;
  google_reviews?: GooglePlaceReview[];
  tanggal_input: string;
  tanggal_verifikasi: string | null;
  diverifikasi_oleh: string | null;
  catatan_perbaikan?: string;
  jam_operasional?: string;
}

export interface SectorOption {
  id: BusinessSector | 'Semua';
  label: string;
  count?: number;
}

// User & Role models
export type UserRole = 'customer' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  location_address?: string;
  avatar_url?: string;
  points_balance: number;
  created_at: string;
}

// Business Images Model (Task 2 & 9)
export type BusinessImageType = 'utama' | 'gallery' | 'produk' | 'tempat';

export interface BusinessImage {
  id: string;
  business_id: string;
  image_url: string;
  image_type: BusinessImageType;
  created_at: string;
}

// User Visits Model (Task 6 & 9: Geotagging verification <= 100m)
export interface UserVisit {
  id: string;
  user_id: string;
  business_id: string;
  latitude: number;
  longitude: number;
  verified: boolean; // true if distance <= 100 meters
  created_at: string;
  timestamp?: string;
}

// Review model (Task 5, 6, 9)
export interface Review {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  business_id: string;
  rating: number; // 1 to 5
  comment: string;
  proof_photo_url?: string;
  photo?: string;
  is_verified_visit: boolean; // Verified visit if radius <= 100m
  verified_visit?: boolean;
  visit_latitude?: number;
  visit_longitude?: number;
  created_at: string;
}

// Voucher & Reward models
export type VoucherStatus = 'Pending Admin' | 'Active' | 'Expired';

export interface Voucher {
  id: string;
  business_id: string;
  business_name: string;
  business_sector: BusinessSector;
  title: string;
  description: string;
  discount_value: string;
  points_required: number;
  stock: number;
  status: VoucherStatus;
  valid_until: string;
  created_at: string;
}

export interface UserVoucher {
  id: string;
  user_id: string;
  voucher_id: string;
  voucher_code: string;
  title: string;
  business_name: string;
  discount_value: string;
  redeemed_at: string;
  is_used: boolean;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  activity: 'REVIEW_SUBMITTED' | 'PHOTO_PROOF' | 'GPS_VISIT' | 'VOUCHER_REDEEM' | 'BONUS';
  description: string;
  points_change: number; // positive or negative
  created_at: string;
}

export type NotificationType = 'NEW_BUSINESS' | 'RECOMMENDATION' | 'PROMO' | 'RATING_REMINDER';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface AiValidationResult {
  recommended_sector: BusinessSector;
  confidence: number;
  quality_status: 'Data siap dikirim ke admin' | 'Perlu perbaikan';
  is_duplicate: boolean;
  duplicate_candidates: string[];
  suggestions: string[];
}
