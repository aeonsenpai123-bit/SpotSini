import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { GooglePlaceReview, Business } from '../types/business';
import { fetchPlaceDetails, mapToGooglePlaceReviews } from '../services/placesService';

const GOOGLE_API_KEY_STORAGE = 'spotsini_google_maps_key';

/**
 * Gets the current active Google Places / Maps API Key
 * Checks: 1) LocalStorage override 2) VITE_GOOGLE_PLACES_API_KEY 3) VITE_GOOGLE_MAPS_API_KEY
 */
export function getGooglePlacesApiKey(): string {
  const custom = localStorage.getItem(GOOGLE_API_KEY_STORAGE);
  if (custom && custom.trim() !== '') return custom.trim();
  const metaEnv = (import.meta as any).env;
  return (
    metaEnv?.VITE_GOOGLE_PLACES_API_KEY ||
    metaEnv?.VITE_GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();
}

export function getGoogleMapsApiKey(): string {
  return getGooglePlacesApiKey();
}

export function setGoogleMapsApiKey(key: string): void {
  localStorage.setItem(GOOGLE_API_KEY_STORAGE, key.trim());
}

export function getDefaultGooglePlaceId(): string {
  const metaEnv = (import.meta as any).env;
  return (metaEnv?.VITE_GOOGLE_PLACE_ID || 'ChIJb6mYQdGMaS4Ro8Z1xV-5W9Q').trim();
}

/**
 * Flexible matching for reviewer author name against user profile name
 * Supports exact match, substring match, and handles accounts like "Max Gamer"
 */
export function isAuthorNameMatch(authorName: string, userName?: string | null): boolean {
  if (!userName || !authorName) return false;
  const a = authorName.toLowerCase().trim();
  const u = userName.toLowerCase().trim();
  if (a === u) return true;
  if (a.includes(u) || u.includes(a)) return true;
  
  // Clean special characters and provider suffixes e.g. "(Google)"
  const cleanA = a.replace(/[^a-z0-9]/g, '');
  const cleanU = u.replace(/[^a-z0-9]/g, '');
  if (cleanA.length > 2 && cleanU.length > 2) {
    if (cleanA.includes(cleanU) || cleanU.includes(cleanA)) return true;
  }
  
  // Match tokens if multi-word
  const aTokens = a.split(/\s+/).filter(t => t.length > 2);
  const uTokens = u.split(/\s+/).filter(t => t.length > 2);
  if (aTokens.some(at => uTokens.includes(at))) return true;

  return false;
}

let googleMapsPromise: Promise<typeof google | null> | null = null;

/**
 * Loads the Google Maps JavaScript API safely.
 * Returns null if no API key is provided or if loading fails.
 */
export async function loadGoogleMaps(): Promise<typeof google | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return null;
  }

  if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
    return (window as any).google;
  }

  if (!googleMapsPromise) {
    googleMapsPromise = (async () => {
      try {
        setOptions({
          key: apiKey,
          v: 'weekly',
          libraries: ['places', 'geocoding', 'marker']
        });
        await importLibrary('maps');
        await importLibrary('places');
        return (window as any).google || null;
      } catch (err: any) {
        console.warn('Google Maps API load failed or rate limited:', err);
        return null;
      }
    })();
  }

  return googleMapsPromise;
}

/**
 * Realistic cached Google Places metadata (rating & counts) for Kelurahan Penggilingan micro-businesses.
 * NOTE: Mock reviews have been completely purged; reviews are loaded 100% dynamically from Google Places API (New).
 */
export const CACHED_GOOGLE_PLACES: Record<string, {
  place_id: string;
  rating: number | null;
  review_count: number;
  reviews: GooglePlaceReview[];
}> = {
  'BIZ-PGL-001': {
    place_id: 'ChIJ5_q818iMaS4RWbY9U3z9rXQ',
    rating: null,
    review_count: 0,
    reviews: []
  },
  'BIZ-PGL-002': {
    place_id: 'ChIJb6mYQdGMaS4Ro8Z1xV-5W9Q',
    rating: null,
    review_count: 0,
    reviews: []
  },
  'BIZ-PGL-004': {
    place_id: 'ChIJ4QTsPgCLaS4RE923Axxel90',
    rating: null,
    review_count: 0,
    reviews: []
  },
  'BIZ-PGL-101': {
    place_id: 'ChIJV4l7tNCNaS4RUf6M8u7z8NQ',
    rating: null,
    review_count: 0,
    reviews: []
  },
  'BIZ-PGL-010': {
    place_id: 'ChIJyQ643tOMaS4Rc0c3s4fV6o0',
    rating: null,
    review_count: 0,
    reviews: []
  }
};

/**
 * Helper to fetch Google Place base details.
 * Reviews array is empty by default; live reviews come exclusively from Google Places API (New).
 */
export function getGooglePlaceDetails(biz: Business): {
  placeId: string;
  rating: number | null;
  reviewCount: number;
  reviews: GooglePlaceReview[];
} {
  const cached = CACHED_GOOGLE_PLACES[biz.id];
  const placeId = biz.placeId || biz.google_place_id || cached?.place_id || getDefaultGooglePlaceId();
  const rating = biz.google_rating ?? cached?.rating ?? biz.rating_avg ?? null;
  const reviewCount = biz.google_review_count ?? cached?.review_count ?? (biz.review_count ? biz.review_count : 0);

  return {
    placeId,
    rating,
    reviewCount,
    reviews: [] // Clean: No static dummy reviews!
  };
}

export interface GooglePlacesNewResult {
  placeId: string;
  rating: number | null;
  reviewCount: number;
  reviews: GooglePlaceReview[];
  isLive: boolean;
  source: 'Google Places API (New)' | 'Cached / Fallback';
  userReview?: GooglePlaceReview | null;
}

/**
 * Real-time call to Google Places API (New) using Place ID and API Key.
 * Fetches average star rating, public review count, and verified reviews array 100% from Google.
 * URL: https://places.googleapis.com/v1/places/${PLACE_ID}
 * Headers: X-Goog-Api-Key, X-Goog-FieldMask: id,displayName,rating,userRatingCount,reviews
 */
export async function fetchGooglePlacesApiNew(
  bizOrPlaceId: Business | string,
  currentUserName?: string | null,
  forceRefresh = false
): Promise<GooglePlacesNewResult> {
  const envPlaceId = getDefaultGooglePlaceId();
  let targetPlaceId = '';
  let spotName = '';
  let spotLat: number | null = null;
  let spotLng: number | null = null;
  let bizObject: Business | null = null;

  if (typeof bizOrPlaceId === 'string') {
    targetPlaceId = bizOrPlaceId.trim();
  } else {
    bizObject = bizOrPlaceId;
    targetPlaceId = bizOrPlaceId.placeId?.trim() || bizOrPlaceId.google_place_id?.trim() || '';
    spotName = bizOrPlaceId.nama_usaha;
    spotLat = bizOrPlaceId.latitude;
    spotLng = bizOrPlaceId.longitude;
  }

  // Fallback to env place ID only if business has no specific place ID and no spotName
  if (!targetPlaceId && !spotName) {
    const envCustomId = (import.meta as any).env?.VITE_GOOGLE_PLACE_ID?.trim();
    targetPlaceId = envCustomId || envPlaceId;
  }

  // Fetch with dynamic 404 NOT_FOUND fallback to places:searchText
  const details = await fetchPlaceDetails(targetPlaceId, {
    spotName,
    spotLat,
    spotLng,
    forceRefresh
  });

  if (details) {
    const reviews: GooglePlaceReview[] = mapToGooglePlaceReviews(details.reviews);
    const rating = typeof details.rating === 'number' ? details.rating : null;
    const reviewCount = typeof details.userRatingCount === 'number' ? details.userRatingCount : reviews.length;

    let userReview: GooglePlaceReview | null = null;
    if (currentUserName) {
      userReview = reviews.find(r => isAuthorNameMatch(r.authorAttribution?.displayName || r.author_name, currentUserName)) || null;
    }

    console.log(`🗺️ [Google Places API New] Live reviews retrieved for ${details.id} (${spotName || targetPlaceId}): ⭐ ${rating ?? '-'} (${reviewCount} total reviews, ${reviews.length} actual items)`);

    return {
      placeId: details.id,
      rating,
      reviewCount,
      reviews,
      isLive: true,
      source: 'Google Places API (New)',
      userReview,
    };
  }

  // 2. Fallback when API key is missing or network fails
  // Returns zero mock reviews - empty array!
  const fallbackDetails = bizObject ? getGooglePlaceDetails(bizObject) : null;
  const fallbackPlaceId = targetPlaceId || fallbackDetails?.placeId || envPlaceId;
  const fallbackRating = fallbackDetails?.rating ?? (bizObject?.google_rating ?? null);
  const fallbackCount = fallbackDetails?.reviewCount ?? (bizObject?.google_review_count ?? 0);

  return {
    placeId: fallbackPlaceId,
    rating: fallbackRating,
    reviewCount: fallbackCount,
    reviews: [], // Zero dummy reviews!
    isLive: false,
    source: 'Cached / Fallback',
    userReview: null,
  };
}

export interface PlaceAutocompleteResult {
  formatted_address: string;
  latitude: number;
  longitude: number;
  google_place_id: string;
  google_rating?: number;
  google_review_count?: number;
}

/**
 * Attaches Google Places Autocomplete to an input element.
 * If API Key is active and Google Maps JS is loaded, attaches google.maps.places.Autocomplete.
 */
export async function attachGooglePlacesAutocomplete(
  inputElement: HTMLInputElement,
  onPlaceSelected: (result: PlaceAutocompleteResult) => void
): Promise<(() => void) | null> {
  const google = await loadGoogleMaps();
  if (!google || !google.maps || !google.maps.places) {
    return null;
  }

  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    componentRestrictions: { country: 'id' },
    fields: ['formatted_address', 'geometry', 'place_id', 'rating', 'user_ratings_total', 'name']
  });

  const listener = autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      return;
    }

    onPlaceSelected({
      formatted_address: place.formatted_address || place.name || inputElement.value,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      google_place_id: place.place_id || `ChIJ-${Date.now()}`,
      google_rating: place.rating,
      google_review_count: place.user_ratings_total
    });
  });

  return () => {
    google.maps.event.removeListener(listener);
  };
}

/**
 * Fallback places suggestions for Kelurahan Penggilingan (Task 8: Offline / API fallback)
 */
export const SAMPLE_PENGGILINGAN_PLACES: PlaceAutocompleteResult[] = [
  {
    formatted_address: 'Sentra Industri Kecil (PIK) Penggilingan Blok A, RT.8/RW.10, Penggilingan, Kec. Cakung',
    latitude: -6.2085,
    longitude: 106.9412,
    google_place_id: 'ChIJb6mYQdGMaS4Ro8Z1xV-5W9Q',
    google_rating: undefined,
    google_review_count: 0
  },
  {
    formatted_address: 'Jl. Raya Penggilingan No. 14, RW 07, Penggilingan, Kec. Cakung, Jakarta Timur',
    latitude: -6.2060,
    longitude: 106.9458,
    google_place_id: 'ChIJV4l7tNCNaS4RUf6M8u7z8NQ',
    google_rating: undefined,
    google_review_count: 0
  },
  {
    formatted_address: 'Jl. Komarudin I No. 45, RW 05, Penggilingan, Cakung, Jakarta Timur',
    latitude: -6.2105,
    longitude: 106.9380,
    google_place_id: 'ChIJyQ643tOMaS4Rc0c3s4fV6o0',
    google_rating: undefined,
    google_review_count: 0
  },
  {
    formatted_address: 'Jl. Sentra Primer Baru Timur, RW 08, Penggilingan, Jakarta Timur',
    latitude: -6.2130,
    longitude: 106.9490,
    google_place_id: 'ChIJ5_q818iMaS4RWbY9U3z9rXQ',
    google_rating: undefined,
    google_review_count: 0
  }
];

