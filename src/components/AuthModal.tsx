import React, { useState } from 'react';
import { User, UserRole } from '../types/business';
import { registerUser, loginUser } from '../utils/authService';
import { BrandMark } from './BrandMark';
import { X, UserCheck, Store, ShieldCheck, Mail, Lock, Phone, MapPin, Sparkles, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialRole = 'customer'
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Kelurahan Penggilingan');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const res = loginUser(email, password);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Login gagal.');
      }
    } else {
      if (!name.trim() || !email.trim()) {
        setError('Nama dan email wajib diisi.');
        return;
      }
      const res = registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role: selectedRole,
        phone: phone.trim(),
        location_address: address.trim()
      });

      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Pendaftaran gagal.');
      }
    }
  };

  // Quick Demo Logins
  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    const res = loginUser(demoEmail, demoPass);
    if (res.success && res.user) {
      onAuthSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-950/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Official Logo */}
        <div className="bg-[#134E39] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center border border-white/20 flex-shrink-0">
              {/* spotsini-logo.png official auth logo */}
              <BrandMark />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl sm:text-2xl tracking-tight">
                  Spot<span className="text-[#EEB79D]">SiNi</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-white/10 text-emerald-200 rounded-full border border-white/15">
                  Penggilingan
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80">
                {isLogin ? 'Masuk ke Akun Warga & UMKM' : 'Pendaftaran Akun Baru Komunitas'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Toggle Login vs Register */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isLogin ? 'bg-[#134E39] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Daftar Baru (Sign Up)
            </button>
          </div>

          {/* Role Selector on Sign Up */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Pilih Peran Akun:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    selectedRole === 'customer'
                      ? 'border-[#134E39] bg-emerald-50/60 ring-2 ring-[#134E39]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className={`w-5 h-5 mb-1 ${selectedRole === 'customer' ? 'text-[#134E39]' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Saya Pengguna</span>
                    <span className="text-[10px] text-slate-500">Koleksi poin & voucher</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('owner')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    selectedRole === 'owner'
                      ? 'border-[#C85A32] bg-amber-50/60 ring-2 ring-[#C85A32]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Store className={`w-5 h-5 mb-1 ${selectedRole === 'owner' ? 'text-[#C85A32]' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Pemilik Usaha</span>
                    <span className="text-[10px] text-slate-500">Kelola UMKM & voucher</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {!isLogin && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#134E39] bg-slate-50"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#134E39] bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#134E39] bg-slate-50"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#134E39] bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Domisili / Lokasi</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Misal: RT 04 / RW 07 Penggilingan"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#134E39] bg-slate-50"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#C85A32] hover:bg-[#B84A22] text-white font-extrabold text-sm shadow-md transition-all active:scale-98 mt-2"
            >
              {isLogin ? 'Masuk ke Akun' : 'Selesaikan Pendaftaran (+50 Poin)'}
            </button>
          </form>

          {/* Quick Demo Acccount Switcher */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Akses Cepat Mode Demo:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => handleQuickLogin('budi@warga.id', 'user')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-forest-700 text-[11px] font-bold border border-emerald-200"
              >
                👤 Customer (Budi)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ratu@konveksi.id', 'owner')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200"
              >
                🏪 Owner (Ibu Ratu)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@spotsini.id', 'admin')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300"
              >
                🛡️ Admin Kelurahan
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
