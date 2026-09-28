import React, { useState } from 'react';
import { Business, VerificationStatus, BusinessSector, Voucher, Review } from '../types/business';
import { getVouchers, approveVoucher, saveVouchers } from '../utils/rewardService';
import { getReviews, saveReviews } from '../utils/reviewService';
import { getImagesForBusiness } from '../utils/imageService';
import { 
  ShieldCheck, Check, X, Edit3, MessageCircle, MapPin, 
  RefreshCw, Plus, AlertCircle, Eye, ChevronRight, CheckCircle2,
  Sparkles, Award, Star, Trash2, ExternalLink, Image as ImageIcon
} from 'lucide-react';

interface AdminVerificationPanelProps {
  businesses: Business[];
  onUpdateStatus: (id: string, newStatus: VerificationStatus, note?: string) => void;
  onUpdateBusiness: (updated: Business) => void;
  onResetSeed: () => void;
  onSelectBusinessModal: (biz: Business) => void;
}

export const AdminVerificationPanel: React.FC<AdminVerificationPanelProps> = ({
  businesses,
  onUpdateStatus,
  onUpdateBusiness,
  onResetSeed,
  onSelectBusinessModal
}) => {
  const [adminTab, setAdminTab] = useState<'submissions' | 'vouchers' | 'reviews'>('submissions');
  const [activeFilter, setActiveFilter] = useState<VerificationStatus | 'Semua'>('Menunggu Verifikasi');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<string>('');
  const [editingBiz, setEditingBiz] = useState<Business | null>(null);

  // Vouchers state
  const [vouchers, setVouchers] = useState<Voucher[]>(() => getVouchers());
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>(() => getReviews());

  // Filter submissions list
  const filteredList = businesses.filter((b) => {
    if (activeFilter === 'Semua') return true;
    return b.status_verifikasi === activeFilter;
  });

  const pendingSubmissionsCount = businesses.filter(b => b.status_verifikasi === 'Menunggu Verifikasi').length;
  const verifiedCount = businesses.filter(b => b.status_verifikasi === 'Terverifikasi').length;
  const rejectedCount = businesses.filter(b => b.status_verifikasi === 'Ditolak/Perlu Perbaikan').length;

  const pendingVouchers = vouchers.filter(v => v.status === 'Pending Admin');

  const handleApproveSubmission = (biz: Business) => {
    onUpdateStatus(biz.id, 'Terverifikasi');
  };

  const handleRejectSubmit = (id: string) => {
    if (!rejectNote.trim()) return;
    onUpdateStatus(id, 'Ditolak/Perlu Perbaikan', rejectNote.trim());
    setRejectingId(null);
    setRejectNote('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBiz) return;
    onUpdateBusiness(editingBiz);
    setEditingBiz(null);
  };

  const handleApproveVoucher = (voucherId: string) => {
    approveVoucher(voucherId);
    setVouchers(getVouchers());
  };

  const handleRejectVoucher = (voucherId: string) => {
    const updated = vouchers.filter(v => v.id !== voucherId);
    setVouchers(updated);
    saveVouchers(updated);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm('Hapus ulasan ini?')) {
      const updated = reviews.filter(r => r.id !== reviewId);
      setReviews(updated);
      saveReviews(updated);
    }
  };

  return (
    <section id="admin" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-950/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#134E39] text-white mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#EEB79D]" />
            <span>Internal Kelurahan Penggilingan, Cakung</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Panel Verifikasi & Moderasi Admin
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Validasi pengajuan usaha dengan asistensi AI, setujui kemitraan voucher UMKM, dan kelola ulasan warga.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Reset semua data kembali ke 30 data awal Kelurahan Penggilingan?')) {
                onResetSeed();
              }
            }}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
            title="Reset data ke seed awal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Data Awal</span>
          </button>
        </div>
      </div>

      {/* Main Admin Mode Navigation */}
      <div className="flex border-b border-gray-200 gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => setAdminTab('submissions')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            adminTab === 'submissions'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/60'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>📋</span>
          <span>Pengajuan Usaha Mikro</span>
          {pendingSubmissionsCount > 0 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-terracotta-500 text-white">
              {pendingSubmissionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('vouchers')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            adminTab === 'vouchers'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/60'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>Kemitraan Voucher UMKM</span>
          {pendingVouchers.length > 0 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
              {pendingVouchers.length} Menunggu
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('reviews')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            adminTab === 'reviews'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/60'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>⭐</span>
          <span>Moderasi Ulasan Warga</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {reviews.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SUBMISSIONS MANAGEMENT */}
      {adminTab === 'submissions' && (
        <div className="space-y-6">
          {/* Submissions Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilter('Menunggu Verifikasi')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeFilter === 'Menunggu Verifikasi'
                  ? 'bg-[#C85A32] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Menunggu Verifikasi</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-black">
                {pendingSubmissionsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('Terverifikasi')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeFilter === 'Terverifikasi'
                  ? 'bg-[#134E39] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Terverifikasi (Tayang Publik)</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-black">
                {verifiedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('Ditolak/Perlu Perbaikan')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeFilter === 'Ditolak/Perlu Perbaikan'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Perlu Perbaikan</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-black">
                {rejectedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('Semua')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeFilter === 'Semua'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua Data ({businesses.length})
            </button>
          </div>

          {/* Submissions List */}
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Tidak ada data untuk status "{activeFilter}"
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Semua antrean pada filter ini sudah diproses.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredList.map((biz) => {
                const isPending = biz.status_verifikasi === 'Menunggu Verifikasi';
                const hasCoordinates = biz.latitude !== null && biz.longitude !== null;
                const uploadedImages = getImagesForBusiness(biz.id);
                const mapsSearchUrl = hasCoordinates 
                  ? `https://www.google.com/maps/search/?api=1&query=${biz.latitude},${biz.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.nama_usaha + ' ' + biz.alamat_lengkap)}`;

                return (
                  <div
                    key={biz.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-start justify-between gap-4"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          biz.status_verifikasi === 'Terverifikasi'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : biz.status_verifikasi === 'Menunggu Verifikasi'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {biz.status_verifikasi}
                        </span>

                        <span className="text-xs font-bold text-terracotta-500">
                          {biz.sektor_usaha}
                        </span>

                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-700">{biz.rw} ({biz.rt})</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-mono">ID: {biz.id}</span>

                        {/* Google Place ID & GPS status (Task 7 & 8) */}
                        {biz.google_place_id ? (
                          <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold" title={`Google Place ID: ${biz.google_place_id}`}>
                            Place ID: {biz.google_place_id.slice(0, 16)}...
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                            Place ID: Manual
                          </span>
                        )}

                        {hasCoordinates ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            📍 Titik GPS ({biz.latitude?.toFixed(4)}, {biz.longitude?.toFixed(4)})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            ⚠️ Titik GPS Belum Diatur
                          </span>
                        )}

                        {biz.google_rating && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Google {biz.google_rating} ({biz.google_review_count || 1})</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 leading-snug">
                        {biz.nama_usaha}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Pemilik:</strong> {biz.nama_pemilik} | <strong className="text-slate-800">Kontak:</strong> {biz.no_telepon} | <strong className="text-slate-800">Alamat:</strong> {biz.alamat_lengkap}
                      </p>

                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-800">Produk:</strong> {biz.produk}
                      </p>

                      {/* Photo Inspection Grid (Task 7) */}
                      {(uploadedImages.length > 0 || biz.foto_usaha) && (
                        <div className="pt-1">
                          <span className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                            Foto yang Diunggah ({uploadedImages.length + (biz.foto_usaha ? 1 : 0)}):
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {biz.foto_usaha && (
                              <div className="relative flex-shrink-0">
                                <img 
                                  src={biz.foto_usaha} 
                                  alt="Foto Utama" 
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                                />
                                <span className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/75 text-white text-[8px] font-bold px-1 rounded text-center truncate">
                                  utama
                                </span>
                              </div>
                            )}
                            {uploadedImages.map((img) => (
                              <div key={img.id} className="relative flex-shrink-0">
                                <img 
                                  src={img.image_url} 
                                  alt={img.image_type} 
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                                />
                                <span className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/75 text-white text-[8px] font-bold px-1 rounded text-center truncate">
                                  {img.image_type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {biz.catatan_perbaikan && (
                        <div className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-700 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-[11px] uppercase tracking-wider text-slate-800">Catatan & Validasi AI:</span>
                            <span>{biz.catatan_perbaikan}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap lg:flex-col items-center gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {isPending && (
                        <button
                          onClick={() => handleApproveSubmission(biz)}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all w-full justify-center"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verifikasi & Publikasikan</span>
                        </button>
                      )}

                      <a
                        href={mapsSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        title="Buka lokasi di Google Maps Eksternal"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Periksa di Google Maps</span>
                      </a>

                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => setEditingBiz(biz)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Data/GPS</span>
                        </button>

                        <button
                          onClick={() => onSelectBusinessModal(biz)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                          title="Lihat Tampilan Profil"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isPending && (
                        <button
                          onClick={() => setRejectingId(biz.id)}
                          className="w-full px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak / Perbaikan</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VOUCHER PARTNERSHIPS APPROVAL */}
      {adminTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Persetujuan Voucher Kemitraan UMKM</h3>
              <p className="text-xs text-slate-500">
                Tinjau penawaran diskon yang diajukan oleh pemilik usaha mikro sebelum tayang di Reward Center.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map((v) => {
              const isPending = v.status === 'Pending Admin';

              return (
                <div
                  key={v.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
                    isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        v.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {v.status === 'Active' ? '✓ Aktif di Reward Center' : '⏳ Pending Persetujuan Admin'}
                      </span>
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        🪙 {v.points_required} Poin
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{v.title}</h4>
                    <p className="text-xs font-semibold text-emerald-800">Mitra: {v.business_name} ({v.business_sector})</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{v.description}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Nilai: <strong className="text-slate-800">{v.discount_value}</strong></span>
                      <span>Stok: <strong className="text-slate-800">{v.stock}</strong></span>
                      <span>Berlaku s/d: <strong className="text-slate-800">{v.valid_until}</strong></span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleApproveVoucher(v.id)}
                          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          Setujui Voucher
                        </button>
                        <button
                          onClick={() => handleRejectVoucher(v.id)}
                          className="py-2 px-3 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-right text-xs text-emerald-700 font-semibold">
                        ✓ Voucher ini aktif dan dapat ditukar warga
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REVIEWS MODERATION */}
      {adminTab === 'reviews' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Moderasi Ulasan Warga</h3>
            <p className="text-xs text-slate-500">
              Pantau komentar, foto bukti kunjungan, dan rating dari warga untuk menjaga kualitas direktori SpotSiNi.
            </p>
          </div>

          <div className="space-y-3">
            {reviews.map((r) => {
              const biz = businesses.find(b => b.id === r.business_id);

              return (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                        alt={r.user_name}
                        className="w-8 h-8 rounded-full object-cover border border-amber-400"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{r.user_name}</span>
                          <span className="text-xs text-amber-500 font-bold">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </span>
                          {r.is_verified_visit && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">
                              ✓ Kunjungan GPS
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {r.created_at} • Usaha: <strong className="text-slate-700">{biz ? biz.nama_usaha : r.business_id}</strong>
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>

                    {r.proof_photo_url && (
                      <img
                        src={r.proof_photo_url}
                        alt="Bukti foto"
                        className="w-24 h-24 rounded-xl object-cover border border-slate-200 mt-2"
                      />
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors self-start"
                    title="Hapus ulasan tidak layak"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Hapus Ulasan</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Alasan Penolakan / Permintaan Perbaikan</h3>
            <p className="text-xs text-slate-500">
              Tuliskan catatan perbaikan yang jelas agar pemilik usaha dapat memperbarui dokumen atau alamat.
            </p>
            <textarea
              rows={3}
              placeholder="Contoh: Nomor kontak WhatsApp tidak aktif, mohon perbarui."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectNote('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleRejectSubmit(rejectingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Business / GPS Coordinates Modal */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Edit Data Usaha & Geotagging Peta</h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Usaha</label>
                <input
                  type="text"
                  value={editingBiz.nama_usaha}
                  onChange={(e) => setEditingBiz({ ...editingBiz, nama_usaha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pemilik</label>
                <input
                  type="text"
                  value={editingBiz.nama_pemilik}
                  onChange={(e) => setEditingBiz({ ...editingBiz, nama_pemilik: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={editingBiz.alamat_lengkap}
                  onChange={(e) => setEditingBiz({ ...editingBiz, alamat_lengkap: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Latitude (Koordinat Titik Peta)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-6.2085"
                    value={editingBiz.latitude !== null ? editingBiz.latitude : ''}
                    onChange={(e) => setEditingBiz({ 
                      ...editingBiz, 
                      latitude: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Longitude (Koordinat Titik Peta)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="106.9420"
                    value={editingBiz.longitude !== null ? editingBiz.longitude : ''}
                    onChange={(e) => setEditingBiz({ 
                      ...editingBiz, 
                      longitude: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Google Place ID (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: ChIJb6mYQdGMaS4Ro8Z1xV-5W9Q"
                  value={editingBiz.google_place_id || ''}
                  onChange={(e) => setEditingBiz({ ...editingBiz, google_place_id: e.target.value.trim() || undefined })}
                  className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Dapat diisi Place ID resmi dari Google Places API atau dikosongkan untuk koordinat manual.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Produk Unggulan</label>
                <input
                  type="text"
                  value={editingBiz.produk}
                  onChange={(e) => setEditingBiz({ ...editingBiz, produk: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Verifikasi / Perbaikan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan untuk pemilik usaha atau catatan audit internal..."
                  value={editingBiz.catatan_perbaikan || ''}
                  onChange={(e) => setEditingBiz({ ...editingBiz, catatan_perbaikan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingBiz(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
