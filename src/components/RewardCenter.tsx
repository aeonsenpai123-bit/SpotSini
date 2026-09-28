import React, { useState } from 'react';
import { User, Voucher, BusinessSector } from '../types/business';
import { getVouchers, redeemVoucher } from '../utils/rewardService';

interface RewardCenterProps {
  currentUser: User | null;
  onRequireAuth: () => void;
  onNavigate: (tab: string) => void;
  onPointsUpdated?: (newPoints: number) => void;
}

export const RewardCenter: React.FC<RewardCenterProps> = ({
  currentUser,
  onRequireAuth,
  onNavigate,
  onPointsUpdated
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>(() => getVouchers().filter(v => v.status === 'Active'));
  const [selectedSector, setSelectedSector] = useState<string>('Semua');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<{ code: string; title: string } | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const sectors: (BusinessSector | 'Semua')[] = ['Semua', 'Kuliner', 'Jasa', 'Kriya & Konveksi', 'Perdagangan/Sembako'];

  const filteredVouchers = vouchers.filter(v => {
    if (selectedSector !== 'Semua' && v.business_sector !== selectedSector) return false;
    return true;
  });

  const handleOpenRedeem = (voucher: Voucher) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    setRedeemError(null);
    setSelectedVoucher(voucher);
  };

  const handleConfirmRedeem = () => {
    if (!currentUser || !selectedVoucher) return;

    const res = redeemVoucher(currentUser, selectedVoucher);
    if (res.success && res.userVoucher) {
      currentUser.points_balance -= selectedVoucher.points_required;
      if (onPointsUpdated) {
        onPointsUpdated(currentUser.points_balance);
      }
      setVouchers(getVouchers().filter(v => v.status === 'Active'));
      setRedeemSuccess({ code: res.userVoucher.voucher_code, title: res.userVoucher.title });
      setSelectedVoucher(null);
    } else {
      setRedeemError(res.error || 'Gagal menukarkan voucher.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block mb-3">
              Program Loyalitas Komunitas Penggilingan
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Reward Center SpotSiNi</h1>
            <p className="text-emerald-100 text-sm sm:text-base mt-2 leading-relaxed">
              Tukarkan poin kontribusi ulasan Anda dengan voucher diskon langsung dari usaha mikro terverifikasi di wilayah Kelurahan Penggilingan!
            </p>
          </div>

          {/* User balance card */}
          <div className="bg-emerald-950/70 backdrop-blur-md p-5 rounded-2xl border border-emerald-700/60 shadow-lg min-w-[240px]">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🪙</span>
              <div>
                <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                  Poin Anda Saat Ini
                </span>
                <span className="text-2xl font-black text-amber-300">
                  {currentUser ? currentUser.points_balance : 0} Poin
                </span>
              </div>
            </div>
            {currentUser ? (
              <button
                onClick={() => onNavigate('dashboard-user')}
                className="w-full mt-2 py-2 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl transition-all shadow"
              >
                Buka Dompet Voucher Saya →
              </button>
            ) : (
              <button
                onClick={onRequireAuth}
                className="w-full mt-2 py-2 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl transition-all shadow"
              >
                Masuk untuk Tukar Poin →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Sector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        {sectors.map(sec => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSector === sec
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Vouchers Grid */}
      {filteredVouchers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">🎟️</div>
          <h3 className="text-lg font-bold text-gray-900">Belum Ada Voucher di Kategori Ini</h3>
          <p className="text-sm text-gray-500 mt-1">Nantikan promo dan voucher diskon terbaru dari mitra UMKM Penggilingan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map(v => {
            const canAfford = currentUser ? currentUser.points_balance >= v.points_required : false;
            const isOutOfStock = v.stock <= 0;

            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6">
                  {/* Badge & Business */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {v.business_sector}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      Sisa: <strong className="text-gray-700">{v.stock}</strong> kuota
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug">{v.title}</h3>
                  <p className="text-xs font-semibold text-emerald-800 mb-2">📍 {v.business_name}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{v.description}</p>

                  <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        Keuntungan
                      </span>
                      <span className="text-base font-extrabold text-amber-900">{v.discount_value}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        Poin Ditukar
                      </span>
                      <span className="text-base font-black text-amber-700">🪙 {v.points_required} Poin</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Berlaku s/d: {v.valid_until}</span>
                  <button
                    onClick={() => handleOpenRedeem(v)}
                    disabled={isOutOfStock}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isOutOfStock
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : canAfford || !currentUser
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {isOutOfStock ? 'Habis' : 'Tukarkan Poin'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                🪙
              </div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Penukaran Voucher</h3>
              <p className="text-xs text-gray-500 mt-1">Pastikan saldo poin Anda mencukupi.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Voucher:</span>
                <span className="font-bold text-gray-900 text-right">{selectedVoucher.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mitra UMKM:</span>
                <span className="font-semibold text-emerald-800">{selectedVoucher.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nilai Manfaat:</span>
                <span className="font-bold text-amber-600">{selectedVoucher.discount_value}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-500">Poin Dibutuhkan:</span>
                <span className="font-extrabold text-amber-700">{selectedVoucher.points_required} Poin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saldo Poin Anda:</span>
                <span className="font-bold text-gray-800">{currentUser?.points_balance || 0} Poin</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
                <span className="text-gray-700">Sisa Poin Nanti:</span>
                <span className="text-emerald-700">
                  {(currentUser?.points_balance || 0) - selectedVoucher.points_required} Poin
                </span>
              </div>
            </div>

            {redeemError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {redeemError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRedeem}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Ya, Tukar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {redeemSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              🎉
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Penukaran Berhasil!</h3>
            <p className="text-xs text-gray-500 mb-4">{redeemSuccess.title}</p>

            <div className="p-4 bg-slate-900 text-amber-300 rounded-2xl mb-6 font-mono text-lg font-bold tracking-widest">
              {redeemSuccess.code}
            </div>

            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Voucher telah disimpan di <strong>Dompet Voucher</strong> Anda. Tunjukkan kode ini langsung ke kasir toko saat berbelanja.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRedeemSuccess(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setRedeemSuccess(null);
                  onNavigate('dashboard-user');
                }}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow"
              >
                Lihat Dompet Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
