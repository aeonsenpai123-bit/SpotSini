import React, { useState, useEffect } from 'react';
import { Business, Review, User, BusinessImage, GooglePlaceReview } from '../types/business';
import { BusinessPlaceholder } from './BusinessPlaceholder';
import { getBusinessWhatsAppUrl } from '../utils/whatsapp';
import { getReviewsForBusiness, getUserFavorites, toggleFavorite } from '../utils/reviewService';
import { getImagesForBusiness } from '../utils/imageService';
import { 
  getGooglePlaceDetails, 
  fetchGooglePlacesApiNew, 
  isAuthorNameMatch 
} from '../utils/googleMapsService';
import { claimGoogleReviewReward } from '../utils/rewardService';
import { broadcastRealtimeEvent, RealtimePayload } from '../utils/supabaseClient';
import confetti from 'canvas-confetti';
import { 
  X, CheckCircle, MessageCircle, Navigation, MapPin, 
  User as UserIcon, Tag, ShoppingCart, Star, Heart, Award,
  ExternalLink, Map as MapIcon, ArrowLeft, RefreshCw, Sparkles, Check, Gift
} from 'lucide-react';

interface BusinessDetailModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onOpenReview?: (biz: Business) => void;
  onRequireAuth?: () => void;
  onUserUpdated?: (user: User) => void;
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business,
  isOpen,
  onClose,
  currentUser,
  onOpenReview,
  onRequireAuth,
  onUserUpdated
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [galleryImages, setGalleryImages] = useState<BusinessImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Real-time rating & Google Places API (New) sync state
  const [liveRating, setLiveRating] = useState<number>(4.8);
  const [liveReviewCount, setLiveReviewCount] = useState<number>(54);
  const [googleReviews, setGoogleReviews] = useState<GooglePlaceReview[]>([]);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [detectedUserReview, setDetectedUserReview] = useState<GooglePlaceReview | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ text: string; type: 'success' | 'info' | 'reward' } | null>(null);

  // Calculate base place details
  const googleDetails = business ? getGooglePlaceDetails(business) : null;

  useEffect(() => {
    if (business) {
      setReviews(getReviewsForBusiness(business.id));
      setGalleryImages(getImagesForBusiness(business.id));
      setActiveImageIndex(0);

      if (currentUser) {
        const favs = getUserFavorites(currentUser.id);
        setIsFav(favs.includes(business.id));
      }

      // Initial query to Google Places API (New) Place Details with fallback
      fetchGooglePlacesApiNew(business, currentUser?.name).then((res) => {
        setLiveRating(res.rating);
        setLiveReviewCount(res.reviewCount);
        setGoogleReviews(res.reviews);
        setIsLiveApi(res.isLive);
        setDetectedUserReview(res.userReview || null);
      });
    }
  }, [business, currentUser]);

  // Listen to Supabase Realtime rating and review broadcasts
  useEffect(() => {
    const handleRealtime = (e: any) => {
      const payload = e.detail as RealtimePayload;
      if (!payload || !business) return;

      if (payload.type === 'RATING_UPDATED') {
        if (payload.placeId === business.id || (googleDetails && payload.placeId === googleDetails.placeId)) {
          setLiveRating(payload.rating);
          setLiveReviewCount(payload.reviewCount);
          setSyncToast({
            text: `⚡ Rating diperbarui via Realtime: ⭐ ${payload.rating.toFixed(1)}`,
            type: 'info'
          });
          setTimeout(() => setSyncToast(null), 3000);
        }
      }
    };

    window.addEventListener('spotsini:realtime', handleRealtime);
    return () => window.removeEventListener('spotsini:realtime', handleRealtime);
  }, [business, googleDetails]);

  if (!isOpen || !business || !googleDetails) return null;

  const handleFavoriteToggle = () => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const nextFav = toggleFavorite(currentUser.id, business.id);
    setIsFav(nextFav);
  };

  // Real-time synchronization trigger with Google Places API (New)
  const handleSyncGoogleRating = async () => {
    if (!business) return;
    setIsSyncing(true);

    try {
      // 1. Fetch real-time data from Google Places API (New) using Place ID & API Key
      const res = await fetchGooglePlacesApiNew(business, currentUser?.name);
      setLiveRating(res.rating);
      setLiveReviewCount(res.reviewCount);
      setGoogleReviews(res.reviews);
      setIsLiveApi(res.isLive);

      // Broadcast update via Supabase Realtime / local event bus to all clients
      broadcastRealtimeEvent({
        type: 'RATING_UPDATED',
        placeId: business.id,
        rating: res.rating,
        reviewCount: res.reviewCount,
        timestamp: new Date().toISOString()
      });

      // 2. Check if a review from the currently logged-in user is detected (e.g. 'Max Gamer')
      if (res.userReview) {
        setDetectedUserReview(res.userReview);

        if (currentUser) {
          const claimResult = claimGoogleReviewReward({
            userId: currentUser.id,
            userName: currentUser.name,
            businessId: business.id,
            businessName: business.nama_usaha,
            authorName: res.userReview.author_name,
            points: 50
          });

          if (claimResult.success && claimResult.updatedUser) {
            confetti({
              particleCount: 110,
              spread: 75,
              origin: { y: 0.6 }
            });
            if (onUserUpdated) {
              onUserUpdated(claimResult.updatedUser);
            }
            setSyncToast({
              text: `🎉 Ulasan dari akun Google "${res.userReview.author_name}" terdeteksi! +50 Poin Reward berhasil ditambahkan ke profil Anda.`,
              type: 'reward'
            });
          } else if (claimResult.isAlreadyClaimed) {
            setSyncToast({
              text: `⭐ Rating disinkronkan: ${res.rating.toFixed(1)} (${res.reviewCount} ulasan). Ulasan akun "${res.userReview.author_name}" terverifikasi (Reward sudah pernah diklaim).`,
              type: 'info'
            });
          }
        } else {
          setSyncToast({
            text: `⭐ Ulasan Google Maps "${res.userReview.author_name}" terdeteksi! Masuk ke akun Anda untuk mengklaim +50 Poin Reward.`,
            type: 'info'
          });
        }
      } else {
        setSyncToast({
          text: `✅ Berhasil disinkronkan langsung dari Google Maps: ⭐ ${res.rating.toFixed(1)} (${res.reviewCount} ulasan publik).`,
          type: 'success'
        });
      }
    } catch (err) {
      console.warn('Sync Google Places rating error:', err);
      setSyncToast({
        text: 'Sinkronisasi selesai (menggunakan data ulasan Google Maps).',
        type: 'info'
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  const whatsappUrl = business.no_telepon 
    ? getBusinessWhatsAppUrl(business.no_telepon, business.nama_usaha)
    : '';

  const hasCoordinates = business.latitude !== null && business.longitude !== null;
  const gpsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
    : business.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.nama_usaha + ' ' + business.alamat_lengkap)}`;

  // Gallery photo list
  const allPhotos: string[] = [];
  if (business.foto_usaha) allPhotos.push(business.foto_usaha);
  galleryImages.forEach(img => {
    if (!allPhotos.includes(img.image_url)) {
      allPhotos.push(img.image_url);
    }
  });

  const currentDisplayPhoto = allPhotos[activeImageIndex] || business.foto_usaha || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-950/10 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Controls: Kembali ke Katalog & Close */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 shadow-lg group border border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke Katalog</span>
          </button>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleFavoriteToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md border border-white/20 ${
              isFav ? 'bg-rose-500 text-white' : 'bg-slate-900/80 hover:bg-slate-900 text-white'
            }`}
            title={isFav ? 'Hapus dari favorit' : 'Simpan ke favorit'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md border border-white/20"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. FOTO GALLERY */}
        <div className="relative w-full h-64 sm:h-80 bg-slate-950 overflow-hidden">
          {currentDisplayPhoto ? (
            <img
              src={currentDisplayPhoto}
              alt={business.nama_usaha}
              className="w-full h-full object-cover transition-all duration-300"
            />
          ) : (
            <BusinessPlaceholder
              businessName={business.nama_usaha}
              sector={business.sektor_usaha}
              className="w-full h-full"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

          {/* Verification Badge Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/95 text-white text-xs font-extrabold shadow-lg backdrop-blur-sm">
              <CheckCircle className="w-4 h-4 fill-white text-emerald-500" />
              <span>Verified SpotSiNi • Kelurahan Penggilingan</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
              {business.sektor_usaha}
            </span>
          </div>

          {/* Photo Gallery Thumbnails */}
          {allPhotos.length > 1 && (
            <div className="absolute top-4 left-44 right-28 flex items-center gap-1.5 overflow-x-auto py-1 z-20">
              {allPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-9 h-9 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-transform ${
                    activeImageIndex === idx ? 'border-amber-400 scale-105 shadow-md' : 'border-white/50 opacity-70'
                  }`}
                >
                  <img src={photo} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Toast Alert */}
        {syncToast && (
          <div className={`mx-6 sm:mx-8 mt-4 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-200 ${
            syncToast.type === 'reward'
              ? 'bg-emerald-100 border border-emerald-400 text-emerald-950'
              : syncToast.type === 'success'
              ? 'bg-amber-100 border border-amber-400 text-amber-950'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900'
          }`}>
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncToast.text}</span>
          </div>
        )}

        {/* 2. CONTENT BODY */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Title & Badges */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs sm:text-sm font-bold text-[#C85A32] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>{business.sektor_usaha} • {business.rw} ({business.rt})</span>
              </span>

              {/* Rating pill: ⭐⭐ 4.8 Google Maps (54) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-xl text-xs font-extrabold text-amber-900 shadow-xs">
                  <span className="text-amber-500">⭐⭐</span>
                  <span>{liveRating.toFixed(1)} Google Maps</span>
                  <span className="text-slate-500 font-normal">({liveReviewCount})</span>
                </div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {business.nama_usaha}
            </h2>
          </div>

          {/* Info Details List */}
          <div className="bg-[#F8F9F8] rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <UserIcon className="w-4 h-4 text-[#134E39] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Pemilik Usaha</span>
                <span className="font-bold text-slate-900">{business.nama_pemilik || 'Pak Fahri'}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#134E39] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Alamat Lengkap</span>
                <span className="font-medium text-slate-800 leading-relaxed">{business.alamat_lengkap}</span>
                {googleDetails.placeId && (
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    Google Place ID: {googleDetails.placeId}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShoppingCart className="w-4 h-4 text-[#134E39] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Produk / Layanan Unggulan</span>
                <span className="font-bold text-[#0D8758] text-sm leading-relaxed block mt-0.5">
                  {business.produk}
                </span>
              </div>
            </div>

            {business.no_telepon && business.no_telepon !== '-' && (
              <div className="flex items-start gap-3">
                <MessageCircle className="w-4 h-4 text-[#134E39] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Kontak WhatsApp</span>
                  <span className="font-bold text-slate-900">{business.no_telepon}</span>
                </div>
              </div>
            )}
          </div>

          {/* Location / Google Maps Coordinate Preview */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#134E39] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <MapIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Lokasi Koordinat Google Maps</h4>
                <p className="text-[11px] text-emerald-800 font-medium">
                  {hasCoordinates 
                    ? `Lat: ${business.latitude?.toFixed(4)}, Lng: ${business.longitude?.toFixed(4)}`
                    : 'Lat: -6.2091, Lng: 106.9405'
                  }
                </p>
              </div>
            </div>

            <a
              href={gpsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-[#134E39] hover:bg-[#0E3B2B] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-xs"
            >
              <span>Buka Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Primary Dual Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-[#134E39] hover:bg-[#0E3B2B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi via WhatsApp (Direct)</span>
              </a>
            ) : (
              <button
                disabled
                className="py-3 px-4 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kontak Tidak Tersedia</span>
              </button>
            )}

            <a
              href={gpsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-2xl bg-[#C85A32] hover:bg-[#B84A22] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              <Navigation className="w-4 h-4" />
              <span>Navigasi Google Maps</span>
            </a>
          </div>

          {/* 3. SECTION: REVIEW GOOGLE MAPS WITH REAL-TIME SYNC */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 shadow-xs">
                  <Star className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">Review Google Maps</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {isLiveApi ? 'Google Places API (New)' : 'Live Real-Time'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Berdasarkan {liveReviewCount} ulasan publik terverifikasi di Google Maps
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleSyncGoogleRating}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-all flex items-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
                  title="Sinkronkan rating terbaru langsung dari Google Places API (New)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-700' : 'text-amber-600'}`} />
                  <span>{isSyncing ? 'Menghubungkan ke Maps...' : 'Sinkronkan Rating Real-Time'}</span>
                </button>

                <div className="text-right">
                  <span className="text-lg font-black text-amber-600">⭐ {liveRating.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 block">/ 5.0 Google</span>
                </div>
              </div>
            </div>

            {/* Notification / Toast Banner */}
            {syncToast && (
              <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs ${
                syncToast.type === 'reward'
                  ? 'bg-emerald-100 border border-emerald-400 text-emerald-950'
                  : syncToast.type === 'success'
                  ? 'bg-amber-50 border border-amber-300 text-amber-950'
                  : 'bg-blue-50 border border-blue-300 text-blue-950'
              }`}>
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="flex-1 leading-relaxed">{syncToast.text}</span>
              </div>
            )}

            {/* Highlighted Verified Review by Logged-in Google Account (e.g. 'Max Gamer') */}
            {detectedUserReview && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-400 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌟</span>
                    <div>
                      <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                        Ulasan Akun Anda Terdeteksi di Google Maps!
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                          ✓ Terverifikasi Google
                        </span>
                      </span>
                      <p className="text-[10px] text-emerald-800">
                        Penulis: <span className="font-bold">{detectedUserReview.author_name}</span> • {detectedUserReview.relative_time_description}
                      </p>
                    </div>
                  </div>
                  <div className="text-amber-500 font-bold text-sm">
                    {'★'.repeat(detectedUserReview.rating)}{'☆'.repeat(5 - detectedUserReview.rating)}
                  </div>
                </div>
                <p className="text-slate-800 text-xs italic bg-white/80 p-2.5 rounded-xl border border-emerald-200 leading-relaxed">
                  "{detectedUserReview.text}"
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-emerald-900">
                  <span className="flex items-center gap-1">
                    <span>🪙</span>
                    <span>Reward Ulasan Google: +50 Poin Kontribusi</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-md font-semibold">
                    Tersinkron ke Profil
                  </span>
                </div>
              </div>
            )}

            {/* List of Public Verified Google Reviews */}
            <div className="space-y-3">
              {(googleReviews.length > 0 ? googleReviews : googleDetails.reviews).map((gRev, idx) => {
                const isUserMatch = currentUser && isAuthorNameMatch(gRev.author_name, currentUser.name);
                return (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-2xl border space-y-1.5 text-xs transition-all ${
                      isUserMatch
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-amber-50/40 border-amber-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {gRev.profile_photo_url ? (
                          <img 
                            src={gRev.profile_photo_url} 
                            alt={gRev.author_name} 
                            className="w-6 h-6 rounded-full object-cover border border-amber-300"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-[10px]">
                            {gRev.author_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{gRev.author_name}</span>
                            {isUserMatch && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-bold">
                                Anda
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{gRev.relative_time_description}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-bold text-xs">
                          {'★'.repeat(gRev.rating)}{'☆'.repeat(5 - gRev.rating)}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          {gRev.rating}.0
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px] italic">
                      "{gRev.text}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. SECTION: ULASAN INTERNAL WARGA SPOTSINI */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Ulasan Warga Komunitas SpotSiNi</h3>
                <p className="text-[11px] text-slate-500">
                  Ulasan lokal dengan verifikasi geolokasi kunjungan langsung (radius ≤ 100m).
                </p>
              </div>

              {onOpenReview && (
                <button
                  onClick={() => onOpenReview(business)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-extrabold text-xs rounded-xl shadow transition-all hover:scale-105 flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Saya Sudah Berkunjung (+Poin)</span>
                </button>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="p-5 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                <span className="text-xl block mb-1">✍️</span>
                Belum ada ulasan komunitas untuk toko ini. Berkunjunglah ke lokasi (radius ≤ 100m) dan dapatkan reward poin!
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt={rev.user_name}
                          className="w-7 h-7 rounded-full object-cover border border-amber-400"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{rev.user_name}</span>
                            {rev.is_verified_visit && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-md">
                                ✓ Verified Visit (≤100m)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{rev.created_at}</span>
                        </div>
                      </div>

                      <div className="text-amber-500 font-bold">
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed text-[11px]">{rev.comment}</p>

                    {rev.proof_photo_url && (
                      <img
                        src={rev.proof_photo_url}
                        alt="Bukti foto kunjungan"
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Footer Navigation */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-800" />
              <span>Kembali ke Katalog Usaha</span>
            </button>
            <span className="text-[11px] text-slate-400">
              SpotSiNi Penggilingan
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
