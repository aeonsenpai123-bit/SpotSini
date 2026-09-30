import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { User } from '../types/business';

interface AdminGuardProps {
  currentUser: User | null;
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
  title?: string;
  description?: string;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
  title = "Akses Terbatas: Hanya untuk Admin / Pengurus Kelurahan",
  description = "Halaman dan data rekapitulasi usaha mikro ini bersifat resmi dan internal kelurahan. Hak akses unduh PDF/Excel dan administrasi dibatasi khusus untuk akun pengurus dengan role admin."
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Warning Icon with glow */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
            <Lock className="w-3.5 h-3.5" />
            <span>Role-Based Access Control</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* User state context info */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Status Sesi:</span>
            <span className="font-semibold text-slate-800">
              {currentUser ? 'Sudah Login' : 'Belum Login'}
            </span>
          </div>
          {currentUser && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400">Akun Aktif:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {currentUser.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Peran Akun:</span>
                <span className="font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {currentUser.role}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {!currentUser ? (
            <button
              onClick={onOpenAuth}
              className="w-full py-3 px-4 rounded-xl bg-[#134E39] hover:bg-[#0E3B2B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk sebagai Admin Kelurahan</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>Beralih ke Akun Admin</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('beranda')}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          Integritas Data Usaha Mikro Kelurahan Penggilingan Cakung
        </p>
      </div>
    </div>
  );
};
