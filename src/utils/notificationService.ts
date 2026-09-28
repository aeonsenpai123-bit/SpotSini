import { AppNotification } from '../types/business';

const NOTIFICATIONS_STORAGE_KEY = 'spotsini_notifications_v1';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NOTIF-001',
    user_id: 'ALL',
    title: '🎉 Selamat Datang di SpotSiNi!',
    message: 'Jelajahi usaha mikro sekitar Kelurahan Penggilingan dan kumpulkan poin reward setiap kali berkunjung.',
    type: 'NEW_BUSINESS',
    is_read: false,
    created_at: '2026-09-28',
    action_url: '#katalog'
  },
  {
    id: 'NOTIF-002',
    user_id: 'ALL',
    title: '☕ Rekomendasi Terdekat Untukmu',
    message: 'Berdasarkan lokasimu di Penggilingan: Warung Kopi Bapak Enjang (RW 07) hanya berjarak 350 meter!',
    type: 'RECOMMENDATION',
    is_read: false,
    created_at: '2026-09-28',
    action_url: '#peta'
  },
  {
    id: 'NOTIF-003',
    user_id: 'ALL',
    title: '🔥 Promo Kemitraan Reward Aktif',
    message: 'Tukarkan 50 poin reward untuk Voucher Es Kopi Susu Gratis di Reward Center!',
    type: 'PROMO',
    is_read: false,
    created_at: '2026-09-28',
    action_url: '#reward-center'
  }
];

export function getNotifications(userId?: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    const all: AppNotification[] = JSON.parse(raw);
    if (!userId) return all;
    return all.filter(n => n.user_id === 'ALL' || n.user_id === userId);
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
}

export function markNotificationAsRead(id: string): void {
  const updated = getNotifications().map(n => n.id === id ? { ...n, is_read: true } : n);
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
}

export const markNotificationRead = (userId?: string, id?: string) => {
  const targetId = id || userId;
  if (targetId) markNotificationAsRead(targetId);
};
