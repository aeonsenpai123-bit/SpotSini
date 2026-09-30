import { useState, useEffect } from 'react';

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
export function getReviewAuthorName(review: GooglePlaceReviewDetail): string {
  return review.authorAttribution?.displayName || 'Pengguna Google Maps';
}

/**
 * Extracts review text content safely
 */
export function getReviewText(review: GooglePlaceReviewDetail): string {
  if (typeof review.text === 'string') return review.text;
  if (review.text?.text) return review.text.text;
  if (typeof review.originalText === 'string') return review.originalText;
  if (review.originalText?.text) return review.originalText.text;
  return '';
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
 * Fetches Google Place Details (New) with sessionStorage & in-memory caching.
 * Endpoint: https://places.googleapis.com/v1/places/${placeId}
 * FieldMask: id,displayName,rating,userRatingCount,reviews.name,reviews.relativePublishTimeDescription,reviews.rating,reviews.text,reviews.authorAttribution
 */
export async function fetchPlaceDetails(placeId: string, forceRefresh = false): Promise<GooglePlaceDetailsResult | null> {
  if (!placeId || typeof placeId !== 'string' || placeId.trim() === '') {
    return null;
  }

  const cleanPlaceId = placeId.trim();
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

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[placesService] Request failed with HTTP ${response.status} for ${cleanPlaceId}:`, errText.slice(0, 150));
      return null;
    }

    const data = await response.json();
    const result: GooglePlaceDetailsResult = {
      id: data.id || cleanPlaceId,
      displayName: data.displayName,
      rating: typeof data.rating === 'number' ? data.rating : undefined,
      userRatingCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : undefined,
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
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
    return null;
  }
}

/**
 * React hook to fetch and cache Google Place Details for catalog cards & components
 */
export function usePlaceDetails(placeId?: string): {
  data: GooglePlaceDetailsResult | null;
  loading: boolean;
} {
  const [data, setData] = useState<GooglePlaceDetailsResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!placeId || placeId.trim() === '') {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchPlaceDetails(placeId).then((res) => {
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
  }, [placeId]);

  return { data, loading };
}
