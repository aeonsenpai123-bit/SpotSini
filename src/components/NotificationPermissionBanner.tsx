import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Check, X, Shield, Sparkles } from 'lucide-react';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  sendBrowserNotification,
  broadcastRealtimeEvent 
} from '../utils/supabaseClient';

interface NotificationPermissionBannerProps {
  onDismiss?: () => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({ onDismiss }) => {
  const [status, setStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const current = getNotificationPermissionStatus();
    setStatus(current.permission);

    // If permission has not been explicitly granted or dismissed in current session, show prompt
    const dismissedThisSession = sessionStorage.getItem('spotsini_notif_banner_dismissed');
    if (current.permission === 'default' && !dismissedThisSession) {
      // Delay slightly for polite UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllowNotification = async () => {
    setIsRequesting(true);
    try {
      const res = await requestNotificationPermission();
      setStatus(res.status);
      if (res.granted) {
        setIsVisible(false);
        // Broadcast test event via Supabase Realtime
        broadcastRealtimeEvent({
          type: 'NOTIFICATION_BROADCAST',
          title: 'Notifikasi Usaha Diaktifkan',
          message: 'Anda akan mendapatkan update status verifikasi dan ulasan Google Maps.',
        });
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('spotsini_notif_banner_dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  if (!isVisible || status === 'granted' || status === 'unsupported') {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-600/30 p-4.5 sm:p-5 text-slate-800 relative overflow-hidden backdrop-blur-md">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#134E39] via-[#0D8758] to-[#C85A32]" />

        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          title="Tutup Notifikasi"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#134E39] flex items-center justify-center flex-shrink-0 border border-emerald-200 shadow-sm">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Supabase Real-Time
              </span>
              <span className="flex items-center text-[10px] text-amber-700 font-semibold gap-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Live Alert
              </span>
            </div>

            <h4 className="text-sm font-black text-slate-900 leading-snug">
              Izinkan Notifikasi Usaha SpotSiNi?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dapatkan update langsung jika ada rating baru di Google Maps, rekomendasi produk warga, atau status verifikasi usaha UMKM Penggilingan.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            disabled={isRequesting}
            onClick={handleAllowNotification}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#134E39] hover:bg-[#0E3B2B] text-white shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isRequesting ? 'Memproses...' : 'Izinkan Notifikasi'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
