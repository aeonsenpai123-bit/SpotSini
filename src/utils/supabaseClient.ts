import { createClient } from '@supabase/supabase-js';
import { User, UserRole } from '../types/business';
import { loginWithGoogleUser, logoutUser } from './authService';

// Supabase configuration from environment variables or project credentials
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ebcrfgacipzkonybrzbh.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViY3JmZ2FjaXB6a29ueWJyemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MDc1MzksImV4cCI6MjEwNjE4MzUzOX0.6zfREGZMP9zN65JsLNFjFsb8jQatE0JgL8kSAwN94Vg';

// Create Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
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
 * Sign out current session from Supabase and local app storage
 */
export async function signOutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err);
  }
  logoutUser();
}

/**
 * Helper to check if a user or profile has 'admin' privileges
 */
export function isUserAdmin(profileOrUser: { role?: string } | null | undefined): boolean {
  if (!profileOrUser || !profileOrUser.role) return false;
  return profileOrUser.role.toLowerCase() === 'admin';
}

/**
 * Synchronizes Supabase auth user with local database schema & storage
 */
export async function syncSupabaseUserProfile(sessionUser: any): Promise<User> {
  const metadata = sessionUser.user_metadata || {};
  const email = sessionUser.email || '';
  const name = metadata.full_name || metadata.name || email.split('@')[0] || 'Warga SpotSiNi';
  const avatar = metadata.avatar_url || metadata.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
  let role: UserRole = (metadata.role as UserRole) || 'user';

  // 1. Sync with Supabase public.profiles table (with role column defaulting to 'user')
  try {
    const { data: existingProfile } = await (supabase
      .from('profiles')
      .select('id, role, full_name, avatar_url')
      .eq('id', sessionUser.id)
      .maybeSingle() as any);

    if (existingProfile?.role) {
      role = existingProfile.role as UserRole;
    }

    const profilePayload = {
      id: sessionUser.id,
      email,
      full_name: name,
      avatar_url: avatar,
      role: role || 'user',
      updated_at: new Date().toISOString()
    };
    await (supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' }) as unknown as Promise<any>);
  } catch (err) {
    // Non-blocking in case profiles table doesn't exist
  }

  // 2. Synchronize with SpotSiNi application User storage
  const appUser = loginWithGoogleUser({
    id: sessionUser.id,
    name,
    email,
    avatar_url: avatar,
    role
  });

  return appUser;
}

/**
 * Listens to Supabase Auth state changes and initial session
 * Handles OAuth callback, clock skew safety, and automatic profile syncing
 */
export function initAuthSubscription(
  onUserChange: (user: User | null) => void
): () => void {
  // Helper: Direct URL hash session extraction fallback for device clock skew or URL fragment delay
  const checkUrlHashForSession = async () => {
    try {
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (data?.session?.user) {
            const synced = await syncSupabaseUserProfile(data.session.user);
            onUserChange(synced);
          }
        }
      }
    } catch (e) {
      console.warn('Direct URL hash session extraction fallback:', e);
    }
  };

  // Run direct URL hash check immediately
  checkUrlHashForSession();

  // 1. Fetch initial session on startup
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      try {
        const synced = await syncSupabaseUserProfile(session.user);
        onUserChange(synced);
      } catch (err) {
        console.warn('Error syncing initial user session:', err);
      }
    }
  }).catch((err) => {
    console.warn('Error fetching Supabase session:', err);
  });

  // 2. Listen to ongoing auth state changes (OAuth callback, sign in, sign out)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`🔐 Supabase Auth Event: ${event}`);

    if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
      try {
        const synced = await syncSupabaseUserProfile(session.user);
        onUserChange(synced);
      } catch (err) {
        console.warn('Error syncing OAuth user profile:', err);
      }
    } else if (event === 'SIGNED_OUT') {
      logoutUser();
      onUserChange(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
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

// Check if Realtime WebSocket should be actively connected (set VITE_ENABLE_SUPABASE_REALTIME=true in .env to enable)
// Defaults to false to avoid persistent websocket reconnection errors when server realtime is not configured
const ENABLE_SUPABASE_REALTIME_WS = (import.meta as any).env?.VITE_ENABLE_SUPABASE_REALTIME === 'true';

// Channel reference (dormant by default to prevent failed websocket retry loops)
export let spotsiniRealtimeChannel: any = null;

// Subscribe to real-time events broadcast across users
export function initRealtimeSubscriptions(
  onEvent: (event: RealtimePayload) => void
): () => void {
  // 1. Always listen to local CustomEvent bus (instantaneous & 100% reliable across components)
  const handleLocalEvent = (e: Event) => {
    const customEvt = e as CustomEvent<RealtimePayload>;
    if (customEvt.detail) {
      onEvent(customEvt.detail);
    }
  };
  window.addEventListener('spotsini:realtime', handleLocalEvent);

  // 2. Only connect to Supabase Realtime WebSocket if explicitly enabled
  if (ENABLE_SUPABASE_REALTIME_WS) {
    try {
      spotsiniRealtimeChannel = supabase.channel('spotsini_public_sync');
      spotsiniRealtimeChannel
        .on('broadcast', { event: 'SPOTSINI_EVENT' }, (payload: any) => {
          if (payload?.payload) {
            onEvent(payload.payload as RealtimePayload);
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('⚡ Supabase Realtime connected for SpotSiNi!');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Disconnect immediately on channel error to prevent continuous retry failed loops
            console.info('ℹ️ Supabase Realtime channel inactive, unmounting websocket.');
            if (spotsiniRealtimeChannel) {
              supabase.removeChannel(spotsiniRealtimeChannel);
              spotsiniRealtimeChannel = null;
            }
          }
        });
    } catch (err) {
      console.warn('Realtime subscription skipped:', err);
    }
  }

  // Return unsubscribe cleanup function
  return () => {
    window.removeEventListener('spotsini:realtime', handleLocalEvent);
    if (spotsiniRealtimeChannel) {
      try {
        supabase.removeChannel(spotsiniRealtimeChannel);
      } catch (e) {
        // ignore
      }
      spotsiniRealtimeChannel = null;
    }
  };
}

/**
 * Broadcast an event to all connected SpotSiNi clients in real time
 */
export async function broadcastRealtimeEvent(payload: RealtimePayload): Promise<void> {
  // Always dispatch local event bus so current tab and all attached components react immediately
  window.dispatchEvent(new CustomEvent('spotsini:realtime', { detail: payload }));

  // Broadcast to remote Supabase channel if active
  if (spotsiniRealtimeChannel && ENABLE_SUPABASE_REALTIME_WS) {
    try {
      await spotsiniRealtimeChannel.send({
        type: 'broadcast',
        event: 'SPOTSINI_EVENT',
        payload,
      });
    } catch (err) {
      // Non-blocking fallback
    }
  }
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
