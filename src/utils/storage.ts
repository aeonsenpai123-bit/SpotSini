import { Business } from '../types/business';
import { INITIAL_BUSINESSES } from '../data/businesses';

const STORAGE_KEY = 'spotsini_businesses_v4';

export function loadBusinesses(): Business[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveBusinesses(INITIAL_BUSINESSES);
      return INITIAL_BUSINESSES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure latest official coordinates & Maps URLs from seed are always synchronized
      const seedMap = new Map<string, Business>(INITIAL_BUSINESSES.map(b => [b.id, b]));
      return parsed.map((item: Business) => {
        const seed = seedMap.get(item.id);
        return {
          ...item,
          latitude: seed?.latitude ?? item.latitude,
          longitude: seed?.longitude ?? item.longitude,
          maps_url: seed?.maps_url ?? item.maps_url,
          mapsUrl: seed?.mapsUrl ?? item.mapsUrl,
          no_telepon: seed?.no_telepon ?? item.no_telepon,
          alamat_lengkap: seed?.alamat_lengkap ?? item.alamat_lengkap,
          nama_pemilik: seed?.nama_pemilik ?? item.nama_pemilik,
          placeId: seed?.placeId ?? item.placeId,
          foto_usaha: item.foto_usaha || seed?.foto_usaha || `/images/businesses/${item.id}.jpg`
        };
      });
    }
    return INITIAL_BUSINESSES;
  } catch (err) {
    console.error('Failed to load businesses from localStorage:', err);
    return INITIAL_BUSINESSES;
  }
}

export function saveBusinesses(businesses: Business[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
  } catch (err) {
    console.error('Failed to save businesses to localStorage:', err);
  }
}

export function resetToSeedData(): Business[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BUSINESSES));
    return INITIAL_BUSINESSES;
  } catch (err) {
    console.error('Failed to reset businesses in localStorage:', err);
    return INITIAL_BUSINESSES;
  }
}
