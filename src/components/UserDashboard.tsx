import React, { useState } from 'react';
import { User, Business, UserVoucher, Review, PointTransaction } from '../types/business';
import { getUserVouchers, saveUserVouchers, getPointTransactions } from '../utils/rewardService';
import { getReviewsForBusiness, getUserFavorites, toggleFavorite } from '../utils/reviewService';

interface UserDashboardProps {
  currentUser: User;
  businesses: Business[];
  onNavigate: (tab: string) => void;
  onSelectBusiness: (biz: Business) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  businesses,
  onNavigate,
  onSelectBusiness
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vouchers' | 'rewards' | 'favorites' | 'profile'>('vouchers');
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>(() => getUserVouchers(currentUser.id));
  const [transactions, setTransactions] = useState<PointTransaction[]>(() => getPointTransactions(currentUser.id));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getUserFavorites(currentUser.id));

  // Get user's favorites
  const favoriteBusinesses = businesses.filter(b => favoriteIds.includes(b.id));

  // Handle mark voucher as used
  const handleMarkUsed = (uvId: string) => {
    const updated = userVouchers.map(uv => {
      if (uv.id === uvId) {
        return { ...uv, is_used: true };
      }
      return uv;
    });
    setUserVouchers(updated);
    saveUserVouchers(currentUser.id, updated);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRemoveFavorite = (bizId: string) => {
    toggleFavorite(currentUser.id, bizId);
    setFavoriteIds(prev => prev.filter(id => id !== bizId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / User Hero */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {currentUser.role === 'customer' ? 'Warga Komunitas' : currentUser.role}
                </span>
                <span className="text-xs text-emerald-200">Penggilingan, Cakung</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{currentUser.name}</h1>
              <p className="text-sm text-emerald-100">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-emerald-950/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-emerald-700/50 self-start md:self-auto shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-2xl shadow-sm">
              🪙
            </div>
            <div>
              <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Saldo Poin Kontribusi</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-300">{currentUser.points_balance}</span>
                <span className="text-xs text-emerald-200 font-semibold">Poin</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('reward-center')}
              className="ml-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold text-xs rounded-xl shadow transition-all hover:scale-105"
            >
              Tukar Poin
            </button>
          </div>
        </div>

        {/* Quick stat highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-700/40 text-sm">
          <div>
            <span className="text-emerald-300 text-xs block">Voucher Dimiliki</span>
            <span className="text-lg font-bold">{userVouchers.filter(v => !v.is_used).length} Aktif</span>
          </div>
          <div>
            <span className="text-emerald-300 text-xs block">Usaha Favorit</span>
            <span className="text-lg font-bold">{favoriteBusinesses.length} Tersimpan</span>
          </div>
          <div>
            <span className="text-emerald-300 text-xs block">Level Kontributor</span>
            <span className="text-lg font-bold text-amber-300">Warga Aktif</span>
          </div>
          <div>
            <span className="text-emerald-300 text-xs block">Dukungan UMKM</span>
            <span className="text-lg font-bold">Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto mb-8 pb-1">
        <button
          onClick={() => setActiveSubTab('vouchers')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'vouchers'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>🎟️</span>
          <span>Dompet Voucher</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {userVouchers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setTransactions(getPointTransactions(currentUser.id));
            setActiveSubTab('rewards');
          }}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'rewards'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>🪙</span>
          <span>Riwayat Poin & Reward</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('favorites')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'favorites'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>❤️</span>
          <span>Usaha Favorit</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
            {favoriteBusinesses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'profile'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>👤</span>
          <span>Informasi Akun</span>
        </button>
      </div>

      {/* Sub-tab 1: Voucher Wallet */}
      {activeSubTab === 'vouchers' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Voucher Diskon & Manfaat</h2>
              <p className="text-sm text-gray-500">
                Tunjukkan kode voucher ini langsung ke kasir atau pemilik usaha saat berkunjung ke lokasi UMKM.
              </p>
            </div>
            <button
              onClick={() => onNavigate('reward-center')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <span>+</span>
              <span>Tukar Poin Lagi</span>
            </button>
          </div>

          {userVouchers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🎟️
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Voucher</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Kumpulkan poin dengan memberikan ulasan usaha mikro Penggilingan dan tukarkan dengan voucher diskon!
              </p>
              <button
                onClick={() => onNavigate('reward-center')}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-xl shadow transition-colors"
              >
                Kunjungi Reward Center
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userVouchers.map(uv => (
                <div
                  key={uv.id}
                  className={`relative bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                    uv.is_used
                      ? 'border-gray-200 opacity-60 bg-gray-50'
                      : 'border-emerald-200 hover:shadow-md hover:border-emerald-300'
                  }`}
                >
                  {/* Top banner header */}
                  <div className={`p-5 pb-3 border-b ${uv.is_used ? 'bg-gray-100 border-gray-200' : 'bg-emerald-50/70 border-emerald-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                        {uv.business_name}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        uv.is_used ? 'bg-gray-200 text-gray-700' : 'bg-emerald-600 text-white'
                      }`}>
                        {uv.is_used ? 'Sudah Digunakan' : 'Siap Dipakai'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{uv.title}</h3>
                    <div className="mt-2 text-xl font-extrabold text-amber-600">
                      {uv.discount_value}
                    </div>
                  </div>

                  {/* Body with voucher code */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Kode Voucher UMKM
                      </label>
                      <div className="flex items-center justify-between bg-slate-900 text-amber-300 px-3 py-2 rounded-xl font-mono text-sm font-bold tracking-wider shadow-inner">
                        <span>{uv.voucher_code}</span>
                        <button
                          onClick={() => handleCopyCode(uv.voucher_code)}
                          className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-sans transition-colors"
                        >
                          {copiedCode === uv.voucher_code ? 'Tersalin ✓' : 'Salin'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Ditukarkan pada: {uv.redeemed_at}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                      {!uv.is_used ? (
                        <button
                          onClick={() => handleMarkUsed(uv.id)}
                          className="w-full py-2 px-3 text-xs font-semibold bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-xl transition-colors border border-gray-200"
                        >
                          Tandai Sudah Dipakai di Kasir
                        </button>
                      ) : (
                        <div className="text-center text-xs text-gray-400 py-1 font-medium">
                          ✓ Telah dimanfaatkan di toko
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab: Riwayat Poin & Aktivitas Reward */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Riwayat Poin & Aktivitas Reward</h2>
              <p className="text-sm text-gray-500">
                Catatan perolehan reward dari ulasan Google Maps terverifikasi, verifikasi kunjungan, dan penukaran voucher.
              </p>
            </div>
            <button
              onClick={() => onNavigate('reward-center')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              <span>Tukar Poin Sekarang →</span>
            </button>
          </div>

          {/* Quick Balance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">Saldo Poin Aktif</span>
              <span className="text-2xl font-black text-amber-900">🪙 {currentUser.points_balance} Poin</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">Aktivitas Tercatat</span>
              <span className="text-2xl font-black text-emerald-900">{transactions.length} Transaksi</span>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 shadow-2xs">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block mb-1">Status Pengguna</span>
              <span className="text-2xl font-black text-teal-900">Warga Terverifikasi</span>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🪙
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Riwayat Poin</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Sinkronkan ulasan Google Maps Anda atau berikan ulasan kunjungan lokal untuk mulai mengumpulkan reward!
              </p>
              <button
                onClick={() => onNavigate('katalog')}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-xl shadow transition-colors"
              >
                Jelajahi Usaha Mikro
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs ${
                      tx.points_change > 0
                        ? tx.activity === 'BONUS'
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-rose-100 text-rose-700 border border-rose-300'
                    }`}>
                      {tx.activity === 'BONUS' ? '⭐' : tx.points_change > 0 ? '🪙' : '🎟️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">{tx.description}</p>
                        {tx.activity === 'BONUS' && (
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                            Google Maps Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm sm:text-base font-black ${
                      tx.points_change > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.points_change > 0 ? `+${tx.points_change}` : tx.points_change} Poin
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Favorites */}
      {activeSubTab === 'favorites' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Usaha Mikro Favorit Anda</h2>
            <p className="text-sm text-gray-500">
              Daftar tempat kuliner, jasa, kriya, dan sembako langganan yang Anda simpan.
            </p>
          </div>

          {favoriteBusinesses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ❤️
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Usaha Favorit</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Klik ikon hati pada kartu usaha di katalog untuk menyimpannya di sini agar mudah dihubungi kembali.
              </p>
              <button
                onClick={() => onNavigate('katalog')}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-xl shadow transition-colors"
              >
                Buka Katalog Usaha
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteBusinesses.map(biz => (
                <div
                  key={biz.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {biz.sektor_usaha} • {biz.rw}
                      </span>
                      <button
                        onClick={() => handleRemoveFavorite(biz.id)}
                        className="text-rose-500 hover:text-gray-400 text-sm font-semibold transition-colors"
                        title="Hapus dari favorit"
                      >
                        ❤️ Tersimpan
                      </button>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{biz.nama_usaha}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{biz.alamat_lengkap}</p>

                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <span className="font-semibold text-amber-500">⭐ {biz.rating_avg || '5.0'}</span>
                      <span>({biz.review_count || 1} ulasan)</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-emerald-700 font-semibold">{biz.produk}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => onSelectBusiness(biz)}
                      className="flex-1 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors text-center"
                    >
                      Detail Usaha
                    </button>
                    {biz.no_telepon && (
                      <a
                        href={`https://wa.me/${biz.no_telepon.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(biz.nama_usaha)},%20saya%20menemukan%20usaha%20Anda%20di%20SpotSiNi%20Penggilingan`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>💬 WA</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 3: User Profile */}
      {activeSubTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profil & Akun Pengguna</h2>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-800 border border-gray-200">{currentUser.name}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-800 border border-gray-200">{currentUser.email}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nomor Telepon / WhatsApp</label>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-800 border border-gray-200">{currentUser.phone || '0812-9876-5432'}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Peran Akun</label>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-emerald-800 border border-emerald-200 flex items-center justify-between">
                <span>{currentUser.role === 'customer' ? 'Warga Komunitas (Customer / Reviewer)' : currentUser.role}</span>
                <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Aktif</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">Panduan Perolehan Poin Komunitas SpotSiNi:</h3>
              <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                <li><strong className="text-gray-900">+10 Poin:</strong> Memberikan ulasan dan rating pada usaha mikro</li>
                <li><strong className="text-gray-900">+15 Poin:</strong> Melampirkan foto bukti kunjungan/produk</li>
                <li><strong className="text-gray-900">+20 Poin:</strong> Kunjungan terverifikasi lokasi GPS langsung di gerai usaha</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
