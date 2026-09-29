import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables or project credentials
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ebcrfgacipzkonybrzbh.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7I8G_N9P6sVtPIFtva1RSA_T54bl0fwv';

// Create Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface SpotSiNiUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'warga' | 'umkm' | 'admin';
  provider?: string;
}

/**
 * Sign in using Google OAuth via Supabase
 */
export async function signInWithGoogle(): Promise<{ error: Error | null; url?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.warn('Supabase Google OAuth direct error, using demo fallback:', error.message);
      return { error };
    }

    if (data?.url) {
      return { error: null, url: data.url };
    }

    return { error: null };
  } catch (err: any) {
    console.warn('OAuth trigger exception:', err);
    return { error: err };
  }
}

/**
 * Sign out current session
 */
export async function signOutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err);
  }
}

/**
 * Get the current Supabase session user if any
 */
export async function getSupabaseUser(): Promise<SpotSiNiUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const user = session.user;
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Pengguna SpotSiNi',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      role: 'warga',
      provider: user.app_metadata?.provider || 'google',
    };
  } catch (err) {
    console.error('Error fetching Supabase user session:', err);
    return null;
  }
}

// ----------------------------------------------------
// REALTIME CHANNELS & BROADCASTING
// ----------------------------------------------------

export type RealtimePayload = 
  | { type: 'RATING_UPDATED'; placeId: string; rating: number; reviewCount: number; timestamp: string }
  | { type: 'NEW_REVIEW'; placeId: string; author: string; rating: number; text: string; time: string }
  | { type: 'BUSINESS_STATUS_CHANGED'; businessId: string; status: string; timestamp: string }
  | { type: 'NOTIFICATION_BROADCAST'; title: string; message: string; businessName?: string };

// Channel for cross-client real-time synchronization
export const spotsiniRealtimeChannel = supabase.channel('spotsini_public_sync');

// Subscribe to real-time events broadcast across users
export function initRealtimeSubscriptions(
  onEvent: (event: RealtimePayload) => void
): () => void {
  try {
    spotsiniRealtimeChannel
      .on('broadcast', { event: 'SPOTSINI_EVENT' }, (payload: any) => {
        if (payload?.payload) {
          onEvent(payload.payload as RealtimePayload);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Supabase Realtime connected for SpotSiNi!');
        }
      });
  } catch (err) {
    console.warn('Could not initialize Supabase realtime subscription:', err);
  }

  // Return unsubscribe cleanup function
  return () => {
    try {
      spotsiniRealtimeChannel.unsubscribe();
    } catch (e) {
      // ignore
    }
  };
}

/**
 * Broadcast an event to all connected SpotSiNi clients in real time
 */
export async function broadcastRealtimeEvent(payload: RealtimePayload): Promise<void> {
  try {
    await spotsiniRealtimeChannel.send({
      type: 'broadcast',
      event: 'SPOTSINI_EVENT',
      payload,
    });
  } catch (err) {
    console.warn('Realtime broadcast error, fallback dispatched locally:', err);
  }

  // Also dispatch a window CustomEvent so current tab processes it immediately
  window.dispatchEvent(new CustomEvent('spotsini:realtime', { detail: payload }));
}

// ----------------------------------------------------
// NOTIFICATION PERMISSION & SYNC WITH SUPABASE
// ----------------------------------------------------

const NOTIFICATION_STORAGE_KEY = 'spotsini_notifications_allowed';

export interface NotificationStatus {
  supported: boolean;
  permission: 'granted' | 'denied' | 'default';
  isAllowedInStorage: boolean;
}

/**
 * Check current notification permission state
 */
export function getNotificationPermissionStatus(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      supported: false,
      permission: 'default',
      isAllowedInStorage: false,
    };
  }

  let isAllowedInStorage = false;
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    isAllowedInStorage = stored === 'true';
  } catch (e) {
    // Sandbox or private mode storage restriction
  }

  let permission: 'granted' | 'denied' | 'default' = 'default';
  try {
    permission = (Notification?.permission as any) || 'default';
  } catch (e) {
    // ignore
  }

  return {
    supported: true,
    permission,
    isAllowedInStorage,
  };
}

/**
 * Ask user to allow notifications for SpotSiNi business updates
 * Aligned with Supabase storage and browser Notification API
 */
export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  status: 'granted' | 'denied' | 'default' | 'unsupported';
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'false');
    } catch (e) {}
    return { granted: false, status: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';

    // Persist choice in local storage safely
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, granted ? 'true' : 'false');
    } catch (e) {}

    // Attempt to persist subscription / device state in Supabase
    try {
      const user = await getSupabaseUser();
      const subscriberRecord = {
        user_id: user?.id || 'guest_' + Math.random().toString(36).substring(2, 9),
        permission_state: permission,
        subscribed_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      };

      // Best effort sync with Supabase table if it exists
      try {
        await (supabase
          .from('notification_subscribers')
          .upsert(subscriberRecord, { onConflict: 'user_id' }) as unknown as Promise<any>);
      } catch (err) {
        // Table may not exist yet in demo; graceful fallback
      }
    } catch (e) {
      // Supabase table sync is non-blocking
    }

    if (granted) {
      sendBrowserNotification('🎉 Notifikasi SpotSiNi Aktif!', {
        body: 'Anda kini akan menerima pembaruan real-time rating Google Maps dan konfirmasi usaha warga Penggilingan.',
        icon: '/spotsini-logo.png',
      });
    }

    return { granted, status: permission };
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return { granted: false, status: 'denied' };
  }
}

/**
 * Send an in-browser push / desktop notification
 */
export function sendBrowserNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      icon: '/spotsini-logo.png',
      badge: '/spotsini-logo.png',
      ...options,
    });
  } catch (err) {
    console.warn('Could not dispatch desktop notification:', err);
  }
}
