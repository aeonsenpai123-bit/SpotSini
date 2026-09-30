import { useState, useEffect } from 'react';
import { GooglePlaceReview, Business } from '../types/business';

export interface GooglePlaceAuthorAttribution {
  displayName: string;
  photoUri?: string;
  uri?: string;
}

export interface GooglePlaceReviewText {
  text: string;
  languageCode?: string;
}

export interface GooglePlaceReviewDetail {
  name?: string;
  relativePublishTimeDescription?: string;
  rating: number;
  text?: GooglePlaceReviewText | string;
  originalText?: GooglePlaceReviewText | string;
  authorAttribution?: GooglePlaceAuthorAttribution;
}

export interface GooglePlaceDetailsResult {
  id: string;
  displayName?: {
    text: string;
    languageCode?: string;
  };
  rating?: number;
  userRatingCount?: number;
  reviews: GooglePlaceReviewDetail[];
  fromCache?: boolean;
  resolvedViaSearchText?: boolean;
}

export interface FetchPlaceOptions {
  spotName?: string;
  spotLat?: number | null;
  spotLng?: number | null;
  spotId?: string; // e.g. 'BIZ-PGL-001'
  forceRefresh?: boolean;
}

// In-memory cache for fast hot-lookups across tab/page navigation
const memoryCache = new Map<string, { data: GooglePlaceDetailsResult; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

/**
 * Gets the active Google Places API Key
 * Checks: 1) LocalStorage override 2) VITE_GOOGLE_PLACES_API_KEY 3) VITE_GOOGLE_MAPS_API_KEY
 */
export function getGooglePlacesApiKey(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('spotsini_google_maps_key');
    if (custom && custom.trim() !== '') return custom.trim();
  }

  const metaEnv = (import.meta as any).env;
  return (
    metaEnv?.VITE_GOOGLE_PLACES_API_KEY ||
    metaEnv?.GOOGLE_PLACES_API_KEY ||
    metaEnv?.VITE_GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();
}

/**
 * Extracts author display name safely
 */
export function getReviewAuthorName(review: GooglePlaceReviewDetail | any): string {
  return review.authorAttribution?.displayName || review.author_name || 'Pengguna Google';
}

/**
 * Extracts review text content safely
 */
export function getReviewText(review: GooglePlaceReviewDetail | any): string {
  if (typeof review.text === 'string') return review.text;
  if (review.text?.text) return review.text.text;
  if (typeof review.originalText === 'string') return review.originalText;
  if (review.originalText?.text) return review.originalText.text;
  return '';
}

/**
 * Maps raw reviews from Google Places API (New) to standard GooglePlaceReview array
 * Avatar: review.authorAttribution?.photoUri
 * Nama Pengulas: review.authorAttribution?.displayName || 'Pengguna Google'
 * Bintang Ulasan: review.rating
 * Teks Komentar: review.text?.text || review.originalText?.text || ''
 * Waktu: review.relativePublishTimeDescription
 */
export function mapToGooglePlaceReviews(rawReviews: GooglePlaceReviewDetail[] | any[]): GooglePlaceReview[] {
  if (!Array.isArray(rawReviews)) return [];
  return rawReviews.map((r: any) => ({
    author_name: r.authorAttribution?.displayName || r.author_name || 'Pengguna Google',
    rating: typeof r.rating === 'number' ? r.rating : 5,
    text: r.text?.text || (typeof r.text === 'string' ? r.text : '') || r.originalText?.text || '',
    relative_time_description: r.relativePublishTimeDescription || r.relative_time_description || 'Baru saja',
    profile_photo_url: r.authorAttribution?.photoUri || r.profile_photo_url || undefined,
    authorAttribution: r.authorAttribution ? {
      displayName: r.authorAttribution.displayName || 'Pengguna Google',
      photoUri: r.authorAttribution.photoUri,
      uri: r.authorAttribution.uri
    } : undefined
  }));
}

/**
 * Normalizes author name matching with logged-in user (e.g. "Max Gamer")
 */
export function isAuthorNameMatch(authorName: string, candidateNames: (string | undefined | null)[]): boolean {
  if (!authorName) return false;
  const a = authorName.toLowerCase().trim();

  for (const name of candidateNames) {
    if (!name) continue;
    const u = name.toLowerCase().trim();
    if (a === u) return true;
    if (a.includes(u) || u.includes(a)) return true;

    // Remove non-alphanumeric
    const cleanA = a.replace(/[^a-z0-9]/g, '');
    const cleanU = u.replace(/[^a-z0-9]/g, '');
    if (cleanA.length > 2 && cleanU.length > 2) {
      if (cleanA.includes(cleanU) || cleanU.includes(cleanA)) return true;
    }

    // Word token match
    const aTokens = a.split(/\s+/).filter(t => t.length > 2);
    const uTokens = u.split(/\s+/).filter(t => t.length > 2);
    if (aTokens.some(at => uTokens.includes(at))) return true;
  }

  return false;
}

/**
 * Stores details in memory and sessionStorage by multiple identifiers (Place ID, Business ID, Query)
 */
function storeInCache(keys: (string | undefined | null)[], data: GooglePlaceDetailsResult): void {
  const timestamp = Date.now();
  for (const key of keys) {
    if (!key) continue;
    const clean = key.trim();
    if (!clean) continue;

    memoryCache.set(clean, { data, timestamp });

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`spotsini_place_${clean}`, JSON.stringify({ data, timestamp }));
      } catch (e) {
        // Non-blocking quota error
      }
    }
  }
}

/**
 * Looks up cached place details by any of the provided identifiers
 */
function lookupCache(keys: (string | undefined | null)[]): GooglePlaceDetailsResult | null {
  for (const key of keys) {
    if (!key) continue;
    const clean = key.trim();
    if (!clean) continue;

    // 1. Check in-memory cache
    if (memoryCache.has(clean)) {
      const entry = memoryCache.get(clean)!;
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return { ...entry.data, fromCache: true };
      }
    }

    // 2. Check sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = window.sessionStorage.getItem(`spotsini_place_${clean}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.data && (Date.now() - (parsed.timestamp || 0) < CACHE_TTL_MS)) {
            memoryCache.set(clean, { data: parsed.data, timestamp: parsed.timestamp || Date.now() });
            return { ...parsed.data, fromCache: true };
          }
        }
      } catch (e) {
        // Non-blocking
      }
    }
  }

  return null;
}

/**
 * Fallback search via places:searchText when Place ID returns 404 / NOT_FOUND
 * Endpoint: https://places.googleapis.com/v1/places:searchText
 * Method: POST
 * Headers: Content-Type: application/json, X-Goog-Api-Key, X-Goog-FieldMask: places.id,places.displayName,places.rating,places.userRatingCount,places.reviews
 */
export async function searchPlaceByText(
  spotNameOrQuery: string,
  spotLat?: number | null,
  spotLng?: number | null
): Promise<GooglePlaceDetailsResult | null> {
  if (!spotNameOrQuery || spotNameOrQuery.trim() === '') return null;

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    console.warn('[placesService:searchText] Google Places API Key belum disetel');
    return null;
  }

  const clean = spotNameOrQuery.trim();
  const textQuery = clean.toLowerCase().includes('penggilingan')
    ? clean
    : `${clean} Penggilingan Cakung Jakarta Timur`;

  // Use spot coordinates or fallback to center of Kelurahan Penggilingan
  const lat = typeof spotLat === 'number' && !isNaN(spotLat) ? spotLat : -6.2085;
  const lng = typeof spotLng === 'number' && !isNaN(spotLng) ? spotLng : 106.9412;

  const requestBody = {
    textQuery,
    locationBias: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: 500.0
      }
    }
  };

  try {
    console.log(`🔎 [placesService:searchText] Melakukan pencarian searchText untuk query: "${textQuery}"...`);
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.reviews'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[placesService:searchText] HTTP error ${response.status}:`, errText.slice(0, 150));
      return null;
    }

    const data = await response.json();
    if (!data.places || !Array.isArray(data.places) || data.places.length === 0) {
      console.warn(`[placesService:searchText] Tidak ada tempat yang cocok untuk query: "${textQuery}"`);
      return null;
    }

    const matched = data.places[0];
    const rawReviews = Array.isArray(matched.reviews) ? matched.reviews : [];

    const result: GooglePlaceDetailsResult = {
      id: matched.id,
      displayName: matched.displayName,
      rating: typeof matched.rating === 'number'
        ? matched.rating
        : (typeof matched.rating === 'string' ? parseFloat(matched.rating) : undefined),
      userRatingCount: typeof matched.userRatingCount === 'number' ? matched.userRatingCount : rawReviews.length,
      reviews: rawReviews,
      fromCache: false,
      resolvedViaSearchText: true
    };

    console.log(`✅ [placesService:searchText] Berhasil menemukan tempat: ${result.id} | ⭐ ${result.rating ?? '-'} (${result.userRatingCount ?? 0} ulasan total, ${result.reviews.length} ulasan publik terisi)`);

    return result;
  } catch (err) {
    console.warn(`[placesService:searchText] Network error:`, err);
    return null;
  }
}

/**
 * Reusable function to fetch Google Place Details (New) with intelligent 404/NOT_FOUND fallback to places:searchText
 * Endpoint: https://places.googleapis.com/v1/places/${placeId}
 * Headers: Content-Type: application/json, X-Goog-Api-Key, X-Goog-FieldMask: id,displayName,rating,userRatingCount,reviews
 * 
 * Supports both signatures:
 * - fetchPlaceDetails(placeId, fallbackQuery)
 * - fetchPlaceDetails(placeId, options)
 */
export async function fetchPlaceDetails(
  placeId?: string | null,
  fallbackQueryOrOptions?: string | FetchPlaceOptions,
  extraOptions?: FetchPlaceOptions
): Promise<GooglePlaceDetailsResult | null> {
  let fallbackQuery = '';
  let options: FetchPlaceOptions = {};

  if (typeof fallbackQueryOrOptions === 'string') {
    fallbackQuery = fallbackQueryOrOptions.trim();
    options = extraOptions || {};
  } else if (fallbackQueryOrOptions && typeof fallbackQueryOrOptions === 'object') {
    options = fallbackQueryOrOptions;
    fallbackQuery = (options.spotName || '').trim();
  }

  const cleanPlaceId = (placeId || '').trim();
  const forceRefresh = options.forceRefresh ?? false;
  const spotId = options.spotId?.trim();
  const spotName = options.spotName?.trim() || fallbackQuery;
  const effectiveQuery = spotName ? (spotName.toLowerCase().includes('penggilingan') ? spotName : `${spotName} Penggilingan Cakung Jakarta Timur`) : '';

  // Cache lookup keys
  const cacheLookupKeys = [cleanPlaceId, spotId, effectiveQuery].filter(Boolean);

  // 1. Check Cache (in-memory + sessionStorage)
  if (!forceRefresh) {
    const cached = lookupCache(cacheLookupKeys);
    if (cached) {
      return cached;
    }
  }

  // 2. If Place ID is empty, directly perform searchText fallback
  if (!cleanPlaceId) {
    if (effectiveQuery) {
      const searchResult = await searchPlaceByText(effectiveQuery, options.spotLat, options.spotLng);
      if (searchResult) {
        storeInCache([searchResult.id, spotId, effectiveQuery], searchResult);
        return searchResult;
      }
    }
    return null;
  }

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    console.warn(`[placesService] API Key belum disetel untuk fetch Place ID: ${cleanPlaceId}`);
    return null;
  }

  // 3. Request Google Places API (New) Place Details
  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanPlaceId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews'
      }
    });

    // 4. Handle 404 / NOT_FOUND / Invalid Place ID with intelligent fallback
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      const isNotFound = response.status === 404 || errText.includes('NOT_FOUND') || errText.includes('no longer valid');
      console.warn(`[placesService] GET /places/${cleanPlaceId} failed with HTTP ${response.status}:`, errText.slice(0, 150));

      if (isNotFound && effectiveQuery) {
        console.log(`🔄 [placesService] Place ID "${cleanPlaceId}" tidak valid/404. Memulai fallback otomatis via places:searchText untuk "${effectiveQuery}"...`);
        const searchResult = await searchPlaceByText(effectiveQuery, options.spotLat, options.spotLng);
        if (searchResult) {
          // Cache under old Place ID, new Place ID, spotId, and query
          storeInCache([cleanPlaceId, searchResult.id, spotId, effectiveQuery], searchResult);
          return searchResult;
        }
      }

      return null;
    }

    const data = await response.json();
    const rawReviews = Array.isArray(data.reviews) ? data.reviews : [];
    const result: GooglePlaceDetailsResult = {
      id: data.id || cleanPlaceId,
      displayName: data.displayName,
      rating: typeof data.rating === 'number'
        ? data.rating
        : (typeof data.rating === 'string' ? parseFloat(data.rating) : undefined),
      userRatingCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : rawReviews.length,
      reviews: rawReviews,
      fromCache: false
    };

    // Save to cache
    storeInCache([cleanPlaceId, result.id, spotId, effectiveQuery], result);

    return result;
  } catch (err) {
    console.warn(`[placesService] Network error fetching ${cleanPlaceId}:`, err);
    if (effectiveQuery) {
      console.log(`🔄 [placesService] Network error pada Place ID. Mencoba fallback searchText untuk "${effectiveQuery}"...`);
      const searchResult = await searchPlaceByText(effectiveQuery, options.spotLat, options.spotLng);
      if (searchResult) {
        storeInCache([cleanPlaceId, searchResult.id, spotId, effectiveQuery], searchResult);
        return searchResult;
      }
    }
    return null;
  }
}

/**
 * Universal React Hook to fetch and cache Google Place Details for catalog cards & components
 * Accepts either:
 * - usePlaceDetails(business)
 * - usePlaceDetails(placeId, fallbackQuery, spotLat, spotLng, spotId)
 */
export function usePlaceDetails(
  placeIdOrBusiness?: string | Business | null,
  fallbackQuery?: string,
  spotLat?: number | null,
  spotLng?: number | null,
  spotId?: string
): {
  data: GooglePlaceDetailsResult | null;
  loading: boolean;
  refresh: () => void;
} {
  const isBusinessObj = typeof placeIdOrBusiness === 'object' && placeIdOrBusiness !== null;
  const activePlaceId = isBusinessObj ? (placeIdOrBusiness.placeId || placeIdOrBusiness.google_place_id || '') : (placeIdOrBusiness || '');
  const activeQuery = isBusinessObj
    ? `${placeIdOrBusiness.nama_usaha} Penggilingan Cakung Jakarta Timur`
    : (fallbackQuery || '');
  const activeLat = isBusinessObj ? placeIdOrBusiness.latitude : spotLat;
  const activeLng = isBusinessObj ? placeIdOrBusiness.longitude : spotLng;
  const activeSpotId = isBusinessObj ? placeIdOrBusiness.id : spotId;

  const [data, setData] = useState<GooglePlaceDetailsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    if (!activePlaceId && !activeQuery) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchPlaceDetails(activePlaceId, {
      spotName: activeQuery,
      spotLat: activeLat,
      spotLng: activeLng,
      spotId: activeSpotId,
      forceRefresh: tick > 0
    }).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activePlaceId, activeQuery, activeLat, activeLng, activeSpotId, tick]);

  return { data, loading, refresh };
}
