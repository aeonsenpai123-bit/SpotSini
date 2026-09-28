import { Review, Business, UserVisit } from '../types/business';
import { updateUserPoints } from './authService';

const REVIEWS_STORAGE_KEY = 'spotsini_reviews_v1';
const FAVORITES_STORAGE_KEY = 'spotsini_favorites_v1';
const USER_VISITS_STORAGE_KEY = 'spotsini_user_visits_v1';

export const INITIAL_USER_VISITS: UserVisit[] = [
  {
    id: 'VISIT-001',
    user_id: 'USR-CUST-01',
    business_id: 'BIZ-PGL-002',
    latitude: -6.2085,
    longitude: 106.9412,
    verified: true,
    created_at: '2026-09-15T10:30:00Z',
    timestamp: '2026-09-15T10:30:00Z'
  },
  {
    id: 'VISIT-002',
    user_id: 'USR-CUST-02',
    business_id: 'BIZ-PGL-004',
    latitude: -6.20795,
    longitude: 106.9302,
    verified: true,
    created_at: '2026-09-18T14:15:00Z',
    timestamp: '2026-09-18T14:15:00Z'
  },
  {
    id: 'VISIT-003',
    user_id: 'USR-CUST-03',
    business_id: 'BIZ-PGL-101',
    latitude: -6.2060,
    longitude: 106.9458,
    verified: true,
    created_at: '2026-09-20T09:00:00Z',
    timestamp: '2026-09-20T09:00:00Z'
  }
];

export function getUserVisits(): UserVisit[] {
  try {
    const raw = localStorage.getItem(USER_VISITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USER_VISITS_STORAGE_KEY, JSON.stringify(INITIAL_USER_VISITS));
      return INITIAL_USER_VISITS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_USER_VISITS;
  }
}

export function saveUserVisit(visit: UserVisit): void {
  const current = getUserVisits();
  const updated = [visit, ...current];
  localStorage.setItem(USER_VISITS_STORAGE_KEY, JSON.stringify(updated));
}

export function getUserVisitsForUser(userId: string): UserVisit[] {
  return getUserVisits().filter(v => v.user_id === userId);
}

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'REV-001',
    user_id: 'USR-CUST-01',
    user_name: 'Budi Santoso',
    user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    business_id: 'BIZ-PGL-002', // Ayam Bakar Pak Yono PIK
    rating: 5,
    comment: 'Bumbu bakarannya sangat meresap dan sambalnya pedas mantap! Tempat bersih di sentra PIK Penggilingan.',
    proof_photo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    is_verified_visit: true,
    visit_latitude: -6.2085,
    visit_longitude: 106.9412,
    created_at: '2026-09-15'
  },
  {
    id: 'REV-002',
    user_id: 'USR-CUST-02',
    user_name: 'Siti Rahma',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    business_id: 'BIZ-PGL-004', // YO LONDRE
    rating: 5,
    comment: 'Cepat selesai, wangi dan rapi banget setrikaannya. Pelayanan ramah warga RW 14.',
    proof_photo_url: '',
    is_verified_visit: true,
    visit_latitude: -6.20795,
    visit_longitude: 106.9302,
    created_at: '2026-09-18'
  },
  {
    id: 'REV-003',
    user_id: 'USR-CUST-03',
    user_name: 'Ahmad Faisal',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    business_id: 'BIZ-PGL-101', // Konveksi Ibu Ratu
    rating: 5,
    comment: 'Pesan seragam karang taruna rapi sekali jahitannya dan bordirnya presisi. Sangat recommended!',
    proof_photo_url: 'https://images.unsplash.com/photo-1528458876861-544fd1761a91?w=600&auto=format&fit=crop&q=80',
    is_verified_visit: true,
    visit_latitude: -6.2060,
    visit_longitude: 106.9458,
    created_at: '2026-09-20'
  }
];

export function getReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_REVIEWS;
  }
}

export function saveReviews(reviews: Review[]): void {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

export function getReviewsForBusiness(businessId: string): Review[] {
  return getReviews().filter(r => r.business_id === businessId);
}

/**
 * Calculates distance in meters between two lat/lng pairs via Haversine formula
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface SubmitReviewResult {
  review: Review;
  earnedPoints: number;
  distanceMeters: number | null;
  breakdown: {
    reviewPoints: number;
    photoPoints: number;
    visitPoints: number;
  };
}

export function submitReview(params: {
  userId: string;
  userName: string;
  userAvatar?: string;
  businessId: string;
  rating: number;
  comment: string;
  proofPhotoUrl?: string;
  userLatitude?: number;
  userLongitude?: number;
  businessLatitude?: number | null;
  businessLongitude?: number | null;
}): SubmitReviewResult {
  // Task 6: Validasi Geotagging Radius <= 100 meter
  let isVerifiedVisit = false;
  let distanceMeters: number | null = null;

  if (
    params.userLatitude !== undefined &&
    params.userLongitude !== undefined &&
    params.businessLatitude !== null &&
    params.businessLatitude !== undefined &&
    params.businessLongitude !== null &&
    params.businessLongitude !== undefined
  ) {
    distanceMeters = calculateDistanceMeters(
      params.userLatitude,
      params.userLongitude,
      params.businessLatitude,
      params.businessLongitude
    );
    // Aturan validasi Task 6:
    // radius <= 100 meter -> verified visit -> user dapat reward point (+20 poin)
    // radius > 100 meter -> review tetap tersimpan -> user tidak dapat reward point kunjungan
    isVerifiedVisit = distanceMeters <= 100;
  }

  // Record to USER_VISITS table (Task 6 & 9)
  if (params.userLatitude !== undefined && params.userLongitude !== undefined) {
    const userVisitRecord: UserVisit = {
      id: `VISIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: params.userId,
      business_id: params.businessId,
      latitude: params.userLatitude,
      longitude: params.userLongitude,
      verified: isVerifiedVisit,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    saveUserVisit(userVisitRecord);
  }

  // Point Calculation rules (Task 5 & 6):
  // Review usaha: +10 poin
  // Upload foto: +15 poin
  // Visit verification (radius <= 100m): +20 poin (jika > 100m: 0 poin)
  const reviewPoints = 10;
  const photoPoints = params.proofPhotoUrl && params.proofPhotoUrl.trim() !== '' ? 15 : 0;
  const visitPoints = isVerifiedVisit ? 20 : 0;
  const earnedPoints = reviewPoints + photoPoints + visitPoints;

  const newReview: Review = {
    id: `REV-${Date.now()}`,
    user_id: params.userId,
    user_name: params.userName,
    user_avatar: params.userAvatar,
    business_id: params.businessId,
    rating: params.rating,
    comment: params.comment,
    proof_photo_url: params.proofPhotoUrl,
    is_verified_visit: isVerifiedVisit,
    visit_latitude: params.userLatitude,
    visit_longitude: params.userLongitude,
    created_at: new Date().toISOString().slice(0, 10)
  };

  const allReviews = [newReview, ...getReviews()];
  saveReviews(allReviews);

  // Award points to user
  updateUserPoints(params.userId, earnedPoints);

  return {
    review: newReview,
    earnedPoints,
    distanceMeters,
    breakdown: {
      reviewPoints,
      photoPoints,
      visitPoints
    }
  };
}

// Favorites helper
export function getUserFavorites(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${FAVORITES_STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function toggleFavorite(userId: string, businessId: string): boolean {
  const current = getUserFavorites(userId);
  let updated: string[];
  let isFav = false;
  if (current.includes(businessId)) {
    updated = current.filter(id => id !== businessId);
    isFav = false;
  } else {
    updated = [...current, businessId];
    isFav = true;
  }
  localStorage.setItem(`${FAVORITES_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
  return isFav;
}
