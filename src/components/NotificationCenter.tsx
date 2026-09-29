import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types/business';
import { Bell, Check, ExternalLink, X, Sparkles, BellRing } from 'lucide-react';
import { getNotificationPermissionStatus, requestNotificationPermission } from '../utils/supabaseClient';

interface NotificationCenterProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (notif: AppNotification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  isOpen,
  onClose,
  onNotificationClick
}) => {
  const [notifState, setNotifState] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');

  useEffect(() => {
    if (isOpen) {
      const status = getNotificationPermissionStatus();
      setNotifState(status.permission);
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setNotifState(res.status);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-16 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="p-4 bg-[#134E39] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#EEB79D]" />
          <h3 className="font-extrabold text-sm">Notifikasi & Rekomendasi</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Supabase Notification Permission Status Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <BellRing className={`w-3.5 h-3.5 ${notifState === 'granted' ? 'text-emerald-600' : 'text-amber-500'}`} />
          <span className="text-[11px] font-semibold text-slate-700">
            {notifState === 'granted' ? 'Notifikasi Real-Time Aktif' : 'Izin Notifikasi Usaha'}
          </span>
        </div>

        {notifState !== 'granted' && notifState !== 'unsupported' && (
          <button
            type="button"
            onClick={handleRequestPermission}
            className="px-2.5 py-1 rounded-lg bg-[#134E39] hover:bg-[#0E3B2B] text-white text-[10px] font-extrabold shadow-xs transition-colors"
          >
            Aktifkan
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Belum ada notifikasi baru.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onNotificationClick(n)}
              className={`p-3 rounded-2xl transition-colors cursor-pointer ${
                n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/50 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {n.title}
                </h4>
                <span className="text-[10px] text-slate-400 flex-shrink-0">
                  {n.created_at}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                {n.message}
              </p>
              {n.action_url && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-700 hover:underline">
                  <span>Buka Tautan</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
