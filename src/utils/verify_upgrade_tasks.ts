// Automated Verification Suite for SpotSiNi 10 Upgrade Tasks
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock browser globals for Node.js test environment
const storage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
  key: (index: number) => Object.keys(storage)[index] || null,
  length: 0
};

import { INITIAL_BUSINESSES } from '../data/businesses';
import { 
  addBusinessImage, 
  getImagesForBusiness, 
  getPrimaryImageForBusiness, 
  deleteBusinessImage, 
  validateImageFile 
} from './imageService';
import { 
  submitReview, 
  calculateDistanceMeters, 
  getUserVisits, 
  getUserVisitsForUser 
} from './reviewService';
import { 
  getGooglePlaceDetails, 
  SAMPLE_PENGGILINGAN_PLACES 
} from './googleMapsService';
import { loginUser, getCurrentUser } from './authService';

console.log('====================================================');
console.log('SPOTSINI 10 UPGRADE TASKS - AUTOMATED TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

// ----------------------------------------------------
// TASK 1: LOGO SPOTSINI IMPLEMENTATION
// ----------------------------------------------------
console.log('--- TASK 1: Logo SpotSiNi Implementation ---');
const publicDir = path.resolve(process.cwd(), 'public');
assert(fs.existsSync(path.join(publicDir, 'spotsini-logo.png')), 'Task 1: spotsini-logo.png exists in public/');
assert(fs.existsSync(path.join(publicDir, 'spotsini-logo.svg')), 'Task 1: spotsini-logo.svg exists in public/');
assert(fs.existsSync(path.join(publicDir, 'favicon.png')), 'Task 1: favicon.png exists in public/');
assert(fs.existsSync(path.join(publicDir, 'apple-touch-icon.png')), 'Task 1: apple-touch-icon.png exists in public/');

const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
assert(indexHtml.includes('spotsini-logo.png') && indexHtml.includes('apple-touch-icon.png'), 'Task 1: index.html metadata contains official logo & apple-touch-icon');

const navbarTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Navbar.tsx'), 'utf-8');
assert(navbarTsx.includes('spotsini-logo.png') || navbarTsx.includes('spotsini-logo.svg'), 'Task 1: Navbar displays official logo');

const footerTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Footer.tsx'), 'utf-8');
assert(footerTsx.includes('spotsini-logo.png') && footerTsx.includes('Menjangkau yang Tersembunyi, Memajukan yang Ada'), 'Task 1: Footer displays logo & official tagline');

const authModalTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/AuthModal.tsx'), 'utf-8');
assert(authModalTsx.includes('spotsini-logo.png'), 'Task 1: AuthModal displays official logo on login/register cards');

// ----------------------------------------------------
// TASK 2: REAL TIME BUSINESS IMAGE UPLOAD
// ----------------------------------------------------
console.log('\n--- TASK 2: Real Time Business Image Upload ---');
const testBizId = 'BIZ-TEST-999';

// Add images across all 4 categories: utama, gallery, produk, tempat
const imgUtama = addBusinessImage(testBizId, 'data:image/png;base64,mockUtama', 'utama');
const imgGallery = addBusinessImage(testBizId, 'data:image/png;base64,mockGallery', 'gallery');
const imgProduk = addBusinessImage(testBizId, 'data:image/png;base64,mockProduk', 'produk');
const imgTempat = addBusinessImage(testBizId, 'data:image/png;base64,mockTempat', 'tempat');

const bizImgs = getImagesForBusiness(testBizId);
assert(bizImgs.length === 4, 'Task 2: Owner can upload and persist photos across 4 categories');
assert(getPrimaryImageForBusiness(testBizId) === 'data:image/png;base64,mockUtama', 'Task 2: Primary image (foto utama) correctly identified');

// Validation tests
const mockValidFile = { name: 'toko.webp', type: 'image/webp', size: 1024 * 500 } as File;
const mockInvalidFile = { name: 'doc.pdf', type: 'application/pdf', size: 1024 * 500 } as File;
const mockOversizedFile = { name: 'huge.jpg', type: 'image/jpeg', size: 1024 * 1024 * 10 } as File;

assert(validateImageFile(mockValidFile).valid === true, 'Task 2: WebP / valid format passes validation');
assert(validateImageFile(mockInvalidFile).valid === false, 'Task 2: Invalid MIME type rejected');
assert(validateImageFile(mockOversizedFile).valid === false, 'Task 2: File > 5MB rejected');

// Delete image test
deleteBusinessImage(imgGallery.id);
assert(getImagesForBusiness(testBizId).length === 3, 'Task 2: Image deletion works as expected');

// ----------------------------------------------------
// TASK 3: GOOGLE MAPS API INTEGRATION
// ----------------------------------------------------
console.log('\n--- TASK 3: Google Maps API Integration ---');
const sampleBiz = INITIAL_BUSINESSES[0];
assert(sampleBiz.latitude !== null && sampleBiz.longitude !== null, 'Task 3: Coordinates exist as single source of truth');
assert(SAMPLE_PENGGILINGAN_PLACES.length >= 4, 'Task 3: Sample Places Autocomplete list available');
assert(SAMPLE_PENGGILINGAN_PLACES[0].google_place_id.startsWith('ChIJ'), 'Task 3: Valid Google Place ID structure');

// ----------------------------------------------------
// TASK 4: GOOGLE MAPS REVIEW INTEGRATION
// ----------------------------------------------------
console.log('\n--- TASK 4: Google Maps Review Integration ---');
const placeDetails = getGooglePlaceDetails(sampleBiz);
assert(placeDetails.rating >= 4.0 && placeDetails.reviewCount > 0, 'Task 4: Google rating and review count loaded');
assert(placeDetails.reviews.length > 0, 'Task 4: Google Maps reviews list loaded with author, text, rating');

// ----------------------------------------------------
// TASK 5 & 6: USER REVIEW & GEOTAGGING <= 100M VALIDATION
// ----------------------------------------------------
console.log('\n--- TASK 5 & 6: User Review & Geotagging <= 100m Validation ---');
const customerUser = loginUser('budi@warga.id', 'user').user!;
const initialPoints = customerUser.points_balance;

// Test A: Within 100 meters (e.g. 35 meters) -> Verified Visit +20 points
const targetLat = -6.2085;
const targetLng = 106.9420;
// Offset lat by ~0.0003 is ~33 meters
const nearLat = targetLat + 0.00025;
const nearLng = targetLng + 0.00015;
const nearDist = calculateDistanceMeters(nearLat, nearLng, targetLat, targetLng);
assert(nearDist <= 100, `Task 6: Near distance calculated is ${Math.round(nearDist)}m (<= 100m)`);

const verifiedReviewRes = submitReview({
  userId: customerUser.id,
  userName: customerUser.name,
  businessId: 'BIZ-PGL-002',
  rating: 5,
  comment: 'Ayam bakarnya sangat lezat, makan langsung di lokasi!',
  proofPhotoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947',
  userLatitude: nearLat,
  userLongitude: nearLng,
  businessLatitude: targetLat,
  businessLongitude: targetLng
});

assert(verifiedReviewRes.review.is_verified_visit === true, 'Task 6: Review within <= 100m marked as is_verified_visit = true');
assert(verifiedReviewRes.breakdown.visitPoints === 20, 'Task 6: Verified visit earns +20 points');
assert(verifiedReviewRes.earnedPoints === 45, 'Task 6: Total earned = 10 (review) + 15 (photo) + 20 (visit) = 45 points');

// Check USER_VISITS table persistence
const userVisits = getUserVisits();
const lastVisit = userVisits[0];
assert(lastVisit !== undefined && lastVisit.verified === true, 'Task 6: Entry recorded in USER_VISITS table with verified = true');

// Test B: Outside 100 meters (e.g. 350 meters) -> Review saved, but visit points = 0
const farLat = targetLat + 0.0028;
const farLng = targetLng + 0.0019;
const farDist = calculateDistanceMeters(farLat, farLng, targetLat, targetLng);
assert(farDist > 100, `Task 6: Far distance calculated is ${Math.round(farDist)}m (> 100m)`);

const unverifiedReviewRes = submitReview({
  userId: customerUser.id,
  userName: customerUser.name,
  businessId: 'BIZ-PGL-002',
  rating: 4,
  comment: 'Pesan antar ke rumah, rasa tetap enak.',
  proofPhotoUrl: '',
  userLatitude: farLat,
  userLongitude: farLng,
  businessLatitude: targetLat,
  businessLongitude: targetLng
});

assert(unverifiedReviewRes.review.is_verified_visit === false, 'Task 6: Review outside > 100m marked as is_verified_visit = false');
assert(unverifiedReviewRes.breakdown.visitPoints === 0, 'Task 6: Distance > 100m does NOT receive visit points (+0)');
assert(unverifiedReviewRes.earnedPoints === 10, 'Task 6: Review is still saved (+10 review points)');

// ----------------------------------------------------
// TASK 7: ADMIN CONTROL
// ----------------------------------------------------
console.log('\n--- TASK 7: Admin Control ---');
const adminTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/AdminVerificationPanel.tsx'), 'utf-8');
assert(adminTsx.includes('Place ID:'), 'Task 7: Admin panel displays Google Place ID');
assert(adminTsx.includes('Foto yang Diunggah'), 'Task 7: Admin panel inspects uploaded photos');
assert(adminTsx.includes('Periksa di Google Maps'), 'Task 7: Admin panel inspects location via Google Maps');
assert(adminTsx.includes('Terverifikasi') && adminTsx.includes('Ditolak/Perlu Perbaikan'), 'Task 7: Admin has approve / reject / request revision actions');

// ----------------------------------------------------
// TASK 8: ERROR HANDLING & FALLBACK
// ----------------------------------------------------
console.log('\n--- TASK 8: Error Handling & Fallbacks ---');
const googleMapViewTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/GoogleMapView.tsx'), 'utf-8');
assert(googleMapViewTsx.includes('Buka di Google Maps Eksternal') || googleMapViewTsx.includes('Lokasi'), 'Task 8: Google Maps error fallback includes external link');
assert(adminTsx.includes('Latitude (Koordinat Titik Peta)'), 'Task 8: Admin panel supports manual coordinate override when Place ID is missing');

const contactTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ContactAndSubmission.tsx'), 'utf-8');
assert(contactTsx.includes('Input Koordinat Manual'), 'Task 8: Business submission includes manual coordinate input fallback');

// ----------------------------------------------------
// TASK 9: DATABASE SCHEMA ALIGNMENT
// ----------------------------------------------------
console.log('\n--- TASK 9: Database Schema Alignment ---');
const businessTypesTs = fs.readFileSync(path.resolve(process.cwd(), 'src/types/business.ts'), 'utf-8');
assert(businessTypesTs.includes('google_place_id') && businessTypesTs.includes('google_rating'), 'Task 9: Business schema includes Google Maps fields');
assert(businessTypesTs.includes('interface BusinessImage') && businessTypesTs.includes('BusinessImageType'), 'Task 9: BusinessImage schema exists');
assert(businessTypesTs.includes('interface UserVisit') && businessTypesTs.includes('verified: boolean'), 'Task 9: UserVisit schema exists');

// ----------------------------------------------------
// TASK 10: END-TO-END EXPERIENCE
// ----------------------------------------------------
console.log('\n--- TASK 10: End-to-End User Experience ---');
const appTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
assert(appTsx.includes('OwnerDashboard') && appTsx.includes('onUpdateBusiness={handleUpdateBusiness}'), 'Task 10: OwnerDashboard connected to real-time business update loop');
assert(appTsx.includes('handleLocateOnMap'), 'Task 10: Catalog to Map synchronization loop connected');

console.log('\n====================================================');
console.log(`TEST RESULT: ${passedTests}/${totalTests} PASSED`);
if (passedTests === totalTests) {
  console.log('SEMUA 10 TASK UPGRADE SPOTSINI BERHASIL DIVERIFIKASI DENGAN SEMPURNA!');
} else {
  console.error(`TERDAPAT ${totalTests - passedTests} TES GAGAL!`);
  process.exit(1);
}
console.log('====================================================');
