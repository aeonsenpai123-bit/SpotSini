import { Voucher, UserVoucher, User, PointTransaction } from '../types/business';
import { updateUserPoints } from './authService';
import { supabase } from './supabaseClient';

const VOUCHERS_STORAGE_KEY = 'spotsini_vouchers_v1';
const USER_VOUCHERS_STORAGE_KEY = 'spotsini_user_vouchers_v1';
const POINT_TRANSACTIONS_STORAGE_KEY = 'spotsini_point_transactions_v1';

export const INITIAL_POINT_TRANSACTIONS: PointTransaction[] = [
  {
    id: 'TX-INIT-001',
    user_id: 'USR-CUST-01',
    activity: 'BONUS',
    description: 'Bonus Pendaftaran Warga Penggilingan',
    points_change: 50,
    created_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'TX-INIT-002',
    user_id: 'USR-CUST-01',
    activity: 'REVIEW_SUBMITTED',
    description: 'Ulasan & Foto: Ayam Bakar Pak Yono PIK',
    points_change: 45,
    created_at: '2026-09-15T10:35:00Z'
  },
  {
    id: 'TX-INIT-003',
    user_id: 'USR-CUST-01',
    activity: 'GPS_VISIT',
    description: 'Verifikasi Kunjungan Geotagging PIK Penggilingan (Radius ≤ 100m)',
    points_change: 20,
    created_at: '2026-09-15T10:36:00Z'
  }
];

export function getPointTransactions(userId?: string): PointTransaction[] {
  try {
    const raw = localStorage.getItem(POINT_TRANSACTIONS_STORAGE_KEY);
    const all: PointTransaction[] = raw ? JSON.parse(raw) : INITIAL_POINT_TRANSACTIONS;
    if (userId) {
      return all.filter(t => t.user_id === userId);
    }
    return all;
  } catch (e) {
    return INITIAL_POINT_TRANSACTIONS;
  }
}

export function savePointTransaction(transaction: PointTransaction): void {
  const all = getPointTransactions();
  const updated = [transaction, ...all];
  localStorage.setItem(POINT_TRANSACTIONS_STORAGE_KEY, JSON.stringify(updated));
}

export const INITIAL_VOUCHERS: Voucher[] = [
  {
    id: 'VCH-001',
    business_id: 'BIZ-PGL-022',
    business_name: 'Warung Kopi Bapak Enjang',
    business_sector: 'Kuliner',
    title: 'Voucher Es Kopi Susu Tradisional',
    description: 'Tukarkan voucher ini untuk gratis 1 gelas es kopi susu khas Pak Enjang.',
    discount_value: 'Rp10.000',
    points_required: 50,
    stock: 45,
    status: 'Active',
    valid_until: '2026-12-31',
    created_at: '2026-09-01'
  },
  {
    id: 'VCH-002',
    business_id: 'BIZ-PGL-002',
    business_name: 'Ayam Bakar Pak Yono PIK',
    business_sector: 'Kuliner',
    title: 'Diskon 20% Paket Makan Siang',
    description: 'Potongan harga 20% untuk pembelian paket ayam bakar komplit nasi timbel.',
    discount_value: 'Diskon 20%',
    points_required: 80,
    stock: 60,
    status: 'Active',
    valid_until: '2026-11-30',
    created_at: '2026-09-05'
  },
  {
    id: 'VCH-003',
    business_id: 'BIZ-PGL-101',
    business_name: 'Konveksi Ibu Ratu',
    business_sector: 'Kriya & Konveksi',
    title: 'Potongan Rp25.000 Pembuatan Kaos',
    description: 'Klaim potongan khusus untuk pesanan sablon atau seragam komunitas minimal 12 pcs.',
    discount_value: 'Rp25.000',
    points_required: 120,
    stock: 30,
    status: 'Active',
    valid_until: '2026-12-15',
    created_at: '2026-09-10'
  },
  {
    id: 'VCH-004',
    business_id: 'BIZ-PGL-010',
    business_name: 'O’Coin Laundry',
    business_sector: 'Jasa',
    title: 'Gratis 1 Koin Cuci Mesin',
    description: 'Dapatkan 1 koin self-service laundry koin kapasitas 7 kg.',
    discount_value: 'Gratis 1 Koin',
    points_required: 70,
    stock: 25,
    status: 'Active',
    valid_until: '2026-10-31',
    created_at: '2026-09-12'
  }
];

export function getVouchers(): Voucher[] {
  try {
    const raw = localStorage.getItem(VOUCHERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(INITIAL_VOUCHERS));
      return INITIAL_VOUCHERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_VOUCHERS;
  }
}

export function saveVouchers(vouchers: Voucher[]): void {
  localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(vouchers));
}

export function getUserVouchers(userId: string): UserVoucher[] {
  try {
    const raw = localStorage.getItem(`${USER_VOUCHERS_STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveUserVouchers(userId: string, vouchers: UserVoucher[]): void {
  localStorage.setItem(`${USER_VOUCHERS_STORAGE_KEY}_${userId}`, JSON.stringify(vouchers));
}

export function redeemVoucher(user: User, voucher: Voucher): { success: boolean; userVoucher?: UserVoucher; error?: string } {
  if (user.points_balance < voucher.points_required) {
    return { success: false, error: `Poin Anda tidak mencukupi (${user.points_balance}/${voucher.points_required} Poin).` };
  }

  if (voucher.stock <= 0) {
    return { success: false, error: 'Maaf, persediaan voucher ini sudah habis.' };
  }

  // Deduct points
  updateUserPoints(user.id, -voucher.points_required);

  // Record point deduction in transaction history
  savePointTransaction({
    id: `TX-VCH-${Date.now()}`,
    user_id: user.id,
    activity: 'VOUCHER_REDEEM',
    description: `Penukaran Voucher: "${voucher.title}" (${voucher.business_name})`,
    points_change: -voucher.points_required,
    created_at: new Date().toISOString()
  });

  // Update voucher stock
  const allVouchers = getVouchers().map(v => {
    if (v.id === voucher.id) {
      return { ...v, stock: v.stock - 1 };
    }
    return v;
  });
  saveVouchers(allVouchers);

  // Generate User Voucher code
  const code = `SPOT-${voucher.business_sector.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUserVoucher: UserVoucher = {
    id: `UVCH-${Date.now()}`,
    user_id: user.id,
    voucher_id: voucher.id,
    voucher_code: code,
    title: voucher.title,
    business_name: voucher.business_name,
    discount_value: voucher.discount_value,
    redeemed_at: new Date().toISOString().slice(0, 10),
    is_used: false
  };

  const currentUv = getUserVouchers(user.id);
  saveUserVouchers(user.id, [newUserVoucher, ...currentUv]);

  return { success: true, userVoucher: newUserVoucher };
}

export function createOwnerVoucher(params: {
  businessId: string;
  businessName: string;
  businessSector: any;
  title: string;
  description: string;
  discountValue: string;
  pointsRequired: number;
  stock: number;
  validUntil: string;
}): Voucher {
  const newVoucher: Voucher = {
    id: `VCH-${Date.now()}`,
    business_id: params.businessId,
    business_name: params.businessName,
    business_sector: params.businessSector,
    title: params.title,
    description: params.description,
    discount_value: params.discountValue,
    points_required: params.pointsRequired,
    stock: params.stock,
    status: 'Pending Admin', // Per Task 6: Admin tetap melakukan approval
    valid_until: params.validUntil,
    created_at: new Date().toISOString().slice(0, 10)
  };

  const updated = [newVoucher, ...getVouchers()];
  saveVouchers(updated);
  return newVoucher;
}

export function approveVoucher(voucherId: string): void {
  const updated = getVouchers().map(v => {
    if (v.id === voucherId) {
      return { ...v, status: 'Active' as const };
    }
    return v;
  });
  saveVouchers(updated);
}

export interface ClaimGoogleReviewRewardResult {
  success: boolean;
  earnedPoints: number;
  isAlreadyClaimed: boolean;
  message: string;
  updatedUser: User | null;
}

/**
 * Claims reward points for a verified Google Maps review matching the user's name
 * Awards +50 points, registers PointTransaction, and prevents double claiming.
 */
export function claimGoogleReviewReward(params: {
  userId: string;
  userName: string;
  businessId: string;
  businessName: string;
  authorName: string;
  points?: number;
}): ClaimGoogleReviewRewardResult {
  const points = params.points || 50;
  const claimKey = `spotsini_claimed_gmap_rev_${params.userId}_${params.businessId}`;
  const alreadyClaimedAt = localStorage.getItem(claimKey);

  if (alreadyClaimedAt) {
    return {
      success: false,
      earnedPoints: 0,
      isAlreadyClaimed: true,
      message: `Reward ulasan Google Maps (${params.authorName}) untuk "${params.businessName}" sudah pernah diklaim sebelumnya.`,
      updatedUser: null,
    };
  }

  // 1. Award points to user profile
  const updatedUser = updateUserPoints(params.userId, points);

  // 2. Record to PointTransaction history
  const tx: PointTransaction = {
    id: `TX-GMAP-${Date.now()}`,
    user_id: params.userId,
    activity: 'BONUS',
    description: `Reward Ulasan Google Maps Terverifikasi Akun "${params.authorName}" di "${params.businessName}"`,
    points_change: points,
    created_at: new Date().toISOString(),
  };
  savePointTransaction(tx);

  // 3. Mark as claimed in storage
  localStorage.setItem(claimKey, new Date().toISOString());

  // 4. Asynchronously sync to Supabase public.profiles and public.point_transactions
  if (updatedUser) {
    (async () => {
      try {
        await (supabase.from('profiles').update({
          points_balance: updatedUser.points_balance,
          updated_at: new Date().toISOString()
        }).eq('id', params.userId) as unknown as Promise<any>);
      } catch (e) {
        // Non-blocking
      }

      try {
        await (supabase.from('point_transactions').insert({
          id: tx.id,
          user_id: params.userId,
          activity: tx.activity,
          description: tx.description,
          points_change: tx.points_change,
          created_at: tx.created_at
        }) as unknown as Promise<any>);
      } catch (e) {
        // Non-blocking
      }

      try {
        await (supabase.from('review_rewards').insert({
          user_id: params.userId,
          business_id: params.businessId,
          business_name: params.businessName,
          author_name: params.authorName,
          points: points,
          created_at: new Date().toISOString()
        }) as unknown as Promise<any>);
      } catch (e) {
        // Non-blocking
      }
    })();
  }

  return {
    success: true,
    earnedPoints: points,
    isAlreadyClaimed: false,
    message: `🎉 Selamat ${params.userName}! Ulasan Google Maps Anda terverifikasi. +${points} Poin Reward berhasil ditambahkan ke profil Anda!`,
    updatedUser,
  };
}
