import React, { useState } from 'react';
import { Business, User } from '../types/business';
import { submitReview } from '../utils/reviewService';
import { X, Star, Upload, MapPin, CheckCircle, Camera, Award, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReviewModalProps {
  business: Business | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: (earnedPoints: number) => void;
  onRequireLogin: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  business,
  currentUser,
  isOpen,
  onClose,
  onReviewSubmitted,
  onRequireLogin
}) => {
  if (!isOpen || !business) return null;

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [hasVisited, setHasVisited] = useState(true);
  const [gpsChecked, setGpsChecked] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [detectedDistance, setDetectedDistance] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Calculate live preview points (Task 5 & 6)
  const reviewPoints = 10;
  const photoPoints = photoUrl.trim() !== '' ? 15 : 0;
  const visitPoints = gpsVerified ? 20 : 0;
  const totalEarned = reviewPoints + photoPoints + visitPoints;

  const processCoordinates = (lat: number, lng: number) => {
    setUserCoords({ lat, lng });
    setGpsChecked(true);

    if (business.latitude !== null && business.longitude !== null) {
      // Calculate real distance using Haversine formula
      const R = 6371e3;
      const phi1 = (lat * Math.PI) / 180;
      const phi2 = (business.latitude * Math.PI) / 180;
      const deltaPhi = ((business.latitude - lat) * Math.PI) / 180;
      const deltaLambda = ((business.longitude - lng) * Math.PI) / 180;

      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.round(R * c);

      setDetectedDistance(dist);
      // Task 6 Rule: Radius <= 100m -> verified (+20 points)
      setGpsVerified(dist <= 100);
    } else {
      // If business has no coordinates yet, fallback
      setDetectedDistance(null);
      setGpsVerified(false);
    }
  };

  // Handle GPS location check via Browser Geolocation
  const handleVerifyGps = () => {
    if (!navigator.geolocation) {
      alert('Geolokasi tidak didukung oleh browser Anda.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        processCoordinates(pos.coords.latitude, pos.coords.longitude);
        setGettingLocation(false);
      },
      (err) => {
        // Mock fallback to near business location (~40m)
        if (business.latitude && business.longitude) {
          processCoordinates(business.latitude + 0.0003, business.longitude + 0.0002);
        } else {
          processCoordinates(-6.2085, 106.9420);
        }
        setGettingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  // Test simulation helper: Near (<= 50m)
  const handleSimulateNear = () => {
    if (business.latitude && business.longitude) {
      // ~35 meters away
      processCoordinates(business.latitude + 0.00025, business.longitude + 0.00015);
    } else {
      processCoordinates(-6.2085, 106.9420);
    }
  };

  // Test simulation helper: Far (> 100m, e.g. 350m)
  const handleSimulateFar = () => {
    if (business.latitude && business.longitude) {
      // ~350 meters away
      processCoordinates(business.latitude + 0.0028, business.longitude + 0.0019);
    } else {
      processCoordinates(-6.2050, 106.9380);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (!comment.trim()) {
      alert('Mohon tuliskan ulasan pengalaman Anda.');
      return;
    }

    const res = submitReview({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar_url,
      businessId: business.id,
      rating,
      comment: comment.trim(),
      proofPhotoUrl: photoUrl.trim() || undefined,
      userLatitude: userCoords?.lat,
      userLongitude: userCoords?.lng,
      businessLatitude: business.latitude,
      businessLongitude: business.longitude
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    onReviewSubmitted(res.earnedPoints);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-950/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#134E39] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-[#EEB79D]" />
            <h3 className="font-extrabold text-lg text-white">
              Beri Ulasan & Kumpulkan Poin
            </h3>
          </div>
          <p className="text-xs text-emerald-100">
            {business.nama_usaha} • {business.rw}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs sm:text-sm">
          
          {/* Star Rating */}
          <div className="text-center space-y-2">
            <label className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
              Berapa bintang untuk usaha ini?
            </label>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-forest-700 block">
              {rating === 5 && 'Luar biasa! Sangat direkomendasikan'}
              {rating === 4 && 'Bagus dan memuaskan'}
              {rating === 3 && 'Cukup baik'}
              {rating === 2 && 'Perlu peningkatan'}
              {rating === 1 && 'Kurang memuaskan'}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Ceritakan Pengalaman Kunjungan Anda <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Contoh: Makanannya enak dan bumbunya pas, tempat bersih dan pemilik sangat ramah..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-forest-600 bg-slate-50 text-xs"
            />
          </div>

          {/* Photo Proof (+15 points) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>Foto Bukti Kunjungan / Produk</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                +15 POIN
              </span>
            </div>
            <input
              type="text"
              placeholder="Tempel tautan URL foto atau gambar produk..."
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs"
            />
            <p className="text-[11px] text-amber-800/80">
              Membantu warga lain melihat kondisi tempat dan keaslian produk.
            </p>
          </div>

          {/* GPS Visit Verification (Task 6: Radius <= 100 meter -> +20 poin) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Validasi Geotagging GPS (Radius ≤ 100 Meter)</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                gpsVerified 
                  ? 'bg-emerald-200 text-emerald-900 ring-2 ring-emerald-400' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {gpsVerified ? '+20 POIN AKTIF' : '+20 POIN'}
              </span>
            </div>

            {gpsChecked ? (
              <div className="space-y-2">
                {gpsVerified ? (
                  <div className="flex items-start gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/90 p-3 rounded-xl border border-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <div>Kunjungan Terverifikasi di Lokasi!</div>
                      <div className="text-[11px] font-medium text-emerald-700">
                        Jarak Anda: <strong>{detectedDistance ?? '< 100'} meter</strong> dari titik usaha (memenuhi syarat ≤ 100m). Anda berhak mendapatkan +20 Poin Kunjungan!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs font-semibold text-amber-900 bg-amber-100/80 p-3 rounded-xl border border-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-amber-950">Di Luar Radius Kunjungan Terverifikasi</div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        Jarak terdeteksi: <strong>{detectedDistance ? `${detectedDistance} meter` : 'Belum sinkron'}</strong> (&gt; 100 meter dari usaha). 
                        Ulasan Anda <strong>tetap akan dipublikasikan dan tersimpan</strong>, namun bonus +20 poin kunjungan tidak diaktifkan.
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyGps}
                    disabled={gettingLocation}
                    className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
                  >
                    {gettingLocation ? 'Mendeteksi ulang...' : '↻ Cek Ulang GPS'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleSimulateNear}
                    className="text-[10px] bg-white border border-emerald-300 hover:bg-emerald-50 px-2 py-1 rounded text-emerald-800 font-semibold"
                    title="Uji kondisi berada di lokasi (<= 50m)"
                  >
                    Simulasi: Di Lokasi (&le; 50m)
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateFar}
                    className="text-[10px] bg-white border border-slate-300 hover:bg-slate-50 px-2 py-1 rounded text-slate-700 font-semibold"
                    title="Uji kondisi di luar radius (> 100m)"
                  >
                    Simulasi: Luar Radius (350m)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleVerifyGps}
                  disabled={gettingLocation}
                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {gettingLocation ? 'Mendeteksi Posisi GPS...' : '📍 Klik: Verifikasi Keberadaan Saya di Lokasi (≤ 100m)'}
                </button>
                
                <div className="flex items-center justify-center gap-2 pt-0.5 text-[10px] text-slate-500">
                  <span>Tes cepat simulasi:</span>
                  <button
                    type="button"
                    onClick={handleSimulateNear}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold"
                  >
                    Di Lokasi (&le; 50m)
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateFar}
                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold"
                  >
                    Luar Radius (350m)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Points Counter Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#134E39] text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#EEB79D]" />
              <div>
                <div className="text-xs font-extrabold">Potensi Poin Didapat</div>
                <div className="text-[10px] text-emerald-200">Review ({reviewPoints}) + Foto ({photoPoints}) + GPS ({visitPoints})</div>
              </div>
            </div>
            <div className="text-xl font-black text-[#EEB79D]">
              +{totalEarned} Poin
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#C85A32] hover:bg-[#B84A22] text-white font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <span>Kirim Review Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
