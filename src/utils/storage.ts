import { Business } from '../types/business';
import { INITIAL_BUSINESSES } from '../data/businesses';

const STORAGE_KEY = 'spotsini_businesses_v3';

export function loadBusinesses(): Business[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveBusinesses(INITIAL_BUSINESSES);
      return INITIAL_BUSINESSES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure foto_usaha is set to local image path if missing or null
      return parsed.map((item: Business) => ({
        ...item,
        foto_usaha: item.foto_usaha || `/images/businesses/${item.id}.jpg`
      }));
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
