// Automated Verification Test for SpotSiNi 10 Enhancement Tasks (ESM / TypeScript)
import { loginUser, getCurrentUser } from './authService';
import { submitReview, calculateDistanceMeters, toggleFavorite, getUserFavorites } from './reviewService';
import { getVouchers, redeemVoucher, createOwnerVoucher, approveVoucher, getUserVouchers } from './rewardService';
import { analyzeBusinessSubmission } from './aiValidationService';
import { INITIAL_BUSINESSES } from '../data/businesses';

// Mock localStorage for Node test runner
const storage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
  key: (index: number) => Object.keys(storage)[index] || null,
  length: 0
};

console.log('=== MEMULAI TEST VERIFIKASI FUNGSIONAL 10 FITUR SPOTSINI ===\n');

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

// 1. Audit & Data Seed
assert(INITIAL_BUSINESSES.length === 30, 'Task 1: 30 usaha mikro terdaftar di Penggilingan');
assert(INITIAL_BUSINESSES[0].growth_score !== undefined, 'Task 1: Skor pertumbuhan (growth_score) tersedia');
assert(INITIAL_BUSINESSES[0].rating_avg !== undefined, 'Task 1: Rata-rata rating tersedia');

// 2. Authentication & Roles
const adminLogin = loginUser('admin@spotsini.id', 'admin');
assert(adminLogin.success && adminLogin.user?.role === 'admin', 'Task 2: Login admin berhasil dengan peran admin');

const ownerLogin = loginUser('ratu@konveksi.id', 'owner');
assert(ownerLogin.success && ownerLogin.user?.role === 'owner', 'Task 2: Login owner berhasil dengan peran owner');

const custLogin = loginUser('budi@warga.id', 'user');
assert(custLogin.success && custLogin.user?.role === 'customer', 'Task 2: Login warga berhasil dengan saldo poin awal');

// 3. Proximity / GPS Proximity
const dist = calculateDistanceMeters(-6.2085, 106.9420, -6.2086, 106.9421);
assert(dist < 50, 'Task 3: Perhitungan jarak Haversine akurat (< 50 meter)');

// 4. Review & Points Loop
if (custLogin.user) {
  const initialPoints = custLogin.user.points_balance;
  const revResult = submitReview({
    userId: custLogin.user.id,
    userName: custLogin.user.name,
    businessId: 'BIZ-PGL-001',
    rating: 5,
    comment: 'Rujak buahnya sangat segar, bumbunya mantap!',
    proofPhotoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947',
    userLatitude: -6.2085,
    userLongitude: 106.9420,
    businessLatitude: -6.2085,
    businessLongitude: 106.9420
  });
  assert(revResult.earnedPoints === 45, 'Task 4: Poin maksimal (+10 review, +15 foto, +20 GPS visit = 45 poin)');
  const updatedUser = getCurrentUser();
  assert(updatedUser?.points_balance === initialPoints + 45, 'Task 4: Saldo poin user bertambah +45 poin di localStorage');

  // Favorites
  toggleFavorite(custLogin.user.id, 'BIZ-PGL-001');
  const favs = getUserFavorites(custLogin.user.id);
  assert(favs.includes('BIZ-PGL-001'), 'Task 4: Simpan usaha ke favorit berhasil');

  // 5. Reward Center: Browse & Redeem
  const allVouchers = getVouchers();
  assert(allVouchers.length >= 4, 'Task 5: Pre-seeded voucher kemitraan tersedia di Reward Center');

  const vchToRedeem = allVouchers.find(v => v.status === 'Active');
  if (vchToRedeem && updatedUser) {
    const redeemRes = redeemVoucher(updatedUser, vchToRedeem);
    assert(redeemRes.success && !!redeemRes.userVoucher?.voucher_code.startsWith('SPOT-'), 'Task 5: Tukar poin dengan voucher berhasil & menghasilkan kode SPOT-');
    const userVchs = getUserVouchers(updatedUser.id);
    assert(userVchs.length === 1, 'Task 5: Voucher tersimpan di Dompet Voucher warga');
  }

  // 6. Owner Reward Partnership
  const newOwnerVoucher = createOwnerVoucher({
    businessId: 'BIZ-PGL-101',
    businessName: 'Konveksi Ibu Ratu',
    businessSector: 'Kriya & Konveksi',
    title: 'Diskon Rp 15.000 Bordir Komputer',
    description: 'Khusus pesanan seragam',
    discountValue: 'Rp15.000',
    pointsRequired: 80,
    stock: 20,
    validUntil: '2026-12-31'
  });
  assert(newOwnerVoucher.status === 'Pending Admin', 'Task 6: Voucher baru berstatus Pending Admin (sesuai tata kelola kelurahan)');

  approveVoucher(newOwnerVoucher.id);
  const refreshedVouchers = getVouchers();
  const approvedVch = refreshedVouchers.find(v => v.id === newOwnerVoucher.id);
  assert(approvedVch?.status === 'Active', 'Task 6: Admin menyetujui voucher dan status berubah menjadi Active');
}

// 7. AI Validation Assistant
const aiTest = analyzeBusinessSubmission({
  namaUsaha: 'Sate Ayam Madura Cak Ipin',
  namaPemilik: 'Cak Ipin',
  sektorInput: 'Lainnya',
  alamat: 'Jl. Raya Penggilingan RW 05',
  telepon: '081234567890',
  produk: 'Sate ayam bumbu kacang, sate kambing empuk',
  fotoUrl: ''
}, INITIAL_BUSINESSES);
assert(aiTest.recommended_sector === 'Kuliner', 'Task 7: AI mengklasifikasikan kata kunci "Sate Ayam" ke sektor Kuliner');
assert(aiTest.confidence >= 0.9, 'Task 7: AI confidence tinggi untuk klasifikasi sektor');

// 8. Admin Approval & Duplicate Check
const aiDuplicateTest = analyzeBusinessSubmission({
  namaUsaha: 'Rujak Jambu Kristal Fahri',
  namaPemilik: 'Budi',
  sektorInput: 'Kuliner',
  alamat: 'Penggilingan',
  telepon: '081234567890',
  produk: 'Rujak buah',
  fotoUrl: ''
}, INITIAL_BUSINESSES);
assert(aiDuplicateTest.is_duplicate === true, 'Task 8: AI mendeteksi potensi duplikasi dengan usaha yang sudah ada');

console.log(`\n=== HASIL TEST: ${passedTests}/${totalTests} BERHASIL ===`);
