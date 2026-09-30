import { useState, useEffect } from 'react';
import { GooglePlaceReview } from '../types/business';

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
  authorAttribution: GooglePlaceAuthorAttribution;
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
  forceRefresh?: boolean;
}

// In-memory cache for fast hot-lookups
const memoryCache = new Map<string, { data: GooglePlaceDetailsResult; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

/**
 * Gets the current active Google Places API Key
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
  return review.authorAttribution?.displayName || review.author_name || 'Pengguna Google Maps';
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
 */
export function mapToGooglePlaceReviews(rawReviews: GooglePlaceReviewDetail[] | any[]): GooglePlaceReview[] {
  if (!Array.isArray(rawReviews)) return [];
  return rawReviews.map((r: any) => ({
    author_name: r.authorAttribution?.displayName || r.author_name || 'Pengguna Google Maps',
    rating: typeof r.rating === 'number' ? r.rating : 5,
    text: r.text?.text || (typeof r.text === 'string' ? r.text : '') || r.originalText?.text || '',
    relative_time_description: r.relativePublishTimeDescription || r.relative_time_description || 'Baru saja',
    profile_photo_url: r.authorAttribution?.photoUri || r.profile_photo_url || undefined,
    authorAttribution: r.authorAttribution ? {
      displayName: r.authorAttribution.displayName,
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
 * Fallback search via places:searchText when Place ID returns 404 / NOT_FOUND
 * Endpoint: https://places.googleapis.com/v1/places:searchText
 * Method: POST
 * Headers: Content-Type: application/json, X-Goog-Api-Key, X-Goog-FieldMask: places.id,places.displayName,places.rating,places.userRatingCount,places.reviews
 */
export async function searchPlaceByText(
  spotName: string,
  spotLat?: number | null,
  spotLng?: number | null
): Promise<GooglePlaceDetailsResult | null> {
  if (!spotName || spotName.trim() === '') return null;

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    console.warn('[placesService:searchText] Google Places API Key belum disetel');
    return null;
  }

  const cleanName = spotName.trim();
  const textQuery = `${cleanName} Penggilingan Cakung Jakarta Timur`;

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
    console.log(`🔎 [placesService:searchText] Memulai fallback TextSearch untuk "${cleanName}"...`);
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
      console.warn(`[placesService:searchText] Tidak ada tempat yang cocok untuk: "${textQuery}"`);
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

    console.log(`✅ [placesService:searchText] Ditemukan Place ID baru untuk "${cleanName}": ${result.id} | ⭐ ${result.rating ?? '-'} (${result.userRatingCount ?? 0} ulasan total, ${result.reviews.length} ulasan terisi)`);

    return result;
  } catch (err) {
    console.warn(`[placesService:searchText] Network error:`, err);
    return null;
  }
}

/**
 * Fetches Google Place Details (New) with intelligent 404 NOT_FOUND fallback to places:searchText.
 * Endpoint: https://places.googleapis.com/v1/places/${placeId}
 * FieldMask: id,displayName,rating,userRatingCount,reviews.name,reviews.relativePublishTimeDescription,reviews.rating,reviews.text,reviews.authorAttribution
 */
export async function fetchPlaceDetails(
  placeId?: string | null,
  optionsOrForceRefresh?: FetchPlaceOptions | boolean
): Promise<GooglePlaceDetailsResult | null> {
  const options: FetchPlaceOptions =
    typeof optionsOrForceRefresh === 'boolean'
      ? { forceRefresh: optionsOrForceRefresh }
      : (optionsOrForceRefresh || {});

  const cleanPlaceId = (placeId || '').trim();
  const forceRefresh = options.forceRefresh ?? false;
  const spotName = options.spotName?.trim();

  // If Place ID is empty, directly attempt searchText if spotName is provided
  if (!cleanPlaceId) {
    if (spotName) {
      return searchPlaceByText(spotName, options.spotLat, options.spotLng);
    }
    return null;
  }

  const cacheKey = `spotsini_place_${cleanPlaceId}`;

  // 1. Check in-memory cache
  if (!forceRefresh && memoryCache.has(cleanPlaceId)) {
    const cached = memoryCache.get(cleanPlaceId)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.data, fromCache: true };
    }
  }

  // 2. Check sessionStorage cache
  if (!forceRefresh && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data) {
          memoryCache.set(cleanPlaceId, { data: parsed.data, timestamp: parsed.timestamp || Date.now() });
          return { ...parsed.data, fromCache: true };
        }
      }
    } catch (e) {
      // Non-blocking parse error
    }
  }

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    console.warn(`[placesService] API Key belum disetel untuk fetch Place ID: ${cleanPlaceId}`);
    return null;
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanPlaceId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews.name,reviews.relativePublishTimeDescription,reviews.rating,reviews.text,reviews.authorAttribution'
      }
    });

    // 3. Tangani Error 404 / NOT_FOUND Secara Cerdas:
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      const isNotFound = response.status === 404 || errText.includes('NOT_FOUND') || errText.includes('no longer valid');
      console.warn(`[placesService] Request failed with HTTP ${response.status} for ${cleanPlaceId}:`, errText.slice(0, 150));

      // Jika 404 atau NOT_FOUND dan spotName ada, lakukan fallback otomatis ke places:searchText
      if (isNotFound && spotName) {
        console.log(`🔄 [placesService] Place ID "${cleanPlaceId}" tidak valid/404. Memulai fallback otomatis via places:searchText untuk "${spotName}"...`);
        const searchResult = await searchPlaceByText(spotName, options.spotLat, options.spotLng);
        if (searchResult) {
          // Cache under both the old invalid place ID and the newly found place ID
          memoryCache.set(cleanPlaceId, { data: searchResult, timestamp: Date.now() });
          memoryCache.set(searchResult.id, { data: searchResult, timestamp: Date.now() });
          if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify({ data: searchResult, timestamp: Date.now() }));
              sessionStorage.setItem(`spotsini_place_${searchResult.id}`, JSON.stringify({ data: searchResult, timestamp: Date.now() }));
            } catch (e) {}
          }
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

    // Save to memory cache
    memoryCache.set(cleanPlaceId, { data: result, timestamp: Date.now() });

    // Save to sessionStorage cache
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      } catch (e) {
        // Quota exceeded in sessionStorage
      }
    }

    return result;
  } catch (err) {
    console.warn(`[placesService] Network error fetching ${cleanPlaceId}:`, err);
    if (spotName) {
      console.log(`🔄 [placesService] Network error pada Place ID. Mencoba fallback searchText untuk "${spotName}"...`);
      return searchPlaceByText(spotName, options.spotLat, options.spotLng);
    }
    return null;
  }
}

/**
 * React hook to fetch and cache Google Place Details for catalog cards & components
 */
export function usePlaceDetails(
  placeId?: string | null,
  spotName?: string,
  spotLat?: number | null,
  spotLng?: number | null
): {
  data: GooglePlaceDetailsResult | null;
  loading: boolean;
  refresh: () => void;
} {
  const [data, setData] = useState<GooglePlaceDetailsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    if (!placeId && !spotName) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchPlaceDetails(placeId, {
      spotName,
      spotLat,
      spotLng,
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
  }, [placeId, spotName, spotLat, spotLng, tick]);

  return { data, loading, refresh };
}
