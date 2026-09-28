import React, { useState, useEffect } from 'react';
import { Business, Review, User, BusinessImage } from '../types/business';
import { BusinessPlaceholder } from './BusinessPlaceholder';
import { getBusinessWhatsAppUrl } from '../utils/whatsapp';
import { getReviewsForBusiness, getUserFavorites, toggleFavorite } from '../utils/reviewService';
import { getImagesForBusiness } from '../utils/imageService';
import { getGooglePlaceDetails } from '../utils/googleMapsService';
import { 
  X, CheckCircle, MessageCircle, Navigation, MapPin, 
  User as UserIcon, Tag, ShoppingCart, Star, Heart, Flame, ShieldAlert, Award,
  ExternalLink, Images, Map as MapIcon, Globe
} from 'lucide-react';

interface BusinessDetailModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onOpenReview?: (biz: Business) => void;
  onRequireAuth?: () => void;
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business,
  isOpen,
  onClose,
  currentUser,
  onOpenReview,
  onRequireAuth
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [galleryImages, setGalleryImages] = useState<BusinessImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  useEffect(() => {
    if (business) {
      setReviews(getReviewsForBusiness(business.id));
      setGalleryImages(getImagesForBusiness(business.id));
      setActiveImageIndex(0);
      if (currentUser) {
        const favs = getUserFavorites(currentUser.id);
        setIsFav(favs.includes(business.id));
      }
    }
  }, [business, currentUser]);

  if (!isOpen || !business) return null;

  const handleFavoriteToggle = () => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const nextFav = toggleFavorite(currentUser.id, business.id);
    setIsFav(nextFav);
  };

  const whatsappUrl = business.no_telepon 
    ? getBusinessWhatsAppUrl(business.no_telepon, business.nama_usaha)
    : '';

  const hasCoordinates = business.latitude !== null && business.longitude !== null;
  const gpsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
    : business.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.nama_usaha + ' ' + business.alamat_lengkap)}`;

  // Task 4: Google Maps Review & Place Details
  const googleDetails = getGooglePlaceDetails(business);

  // Gallery photo list (all images uploaded by owner + initial foto_usaha)
  const allPhotos: string[] = [];
  if (business.foto_usaha) allPhotos.push(business.foto_usaha);
  galleryImages.forEach(img => {
    if (!allPhotos.includes(img.image_url)) {
      allPhotos.push(img.image_url);
    }
  });

  const currentDisplayPhoto = allPhotos[activeImageIndex] || business.foto_usaha || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-950/10 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md transition-all active:scale-95 flex items-center gap-1 shadow-md"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </button>
        </div>

        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleFavoriteToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
              isFav ? 'bg-rose-500 text-white' : 'bg-black/60 hover:bg-black/80 text-white'
            }`}
            title={isFav ? 'Hapus dari favorit' : 'Simpan ke favorit'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* 1. FOTO GALLERY (Task 2 & 4 Structure) */}
        <div className="relative w-full h-60 sm:h-80 bg-slate-950 overflow-hidden">
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

          {/* Photo Gallery Thumbnails Navigation */}
          {allPhotos.length > 1 && (
            <div className="absolute top-4 left-24 right-16 flex items-center gap-1.5 overflow-x-auto py-1 z-20">
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

        {/* 2. CONTENT BODY (Task 4 Structure) */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Title & Badges */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs sm:text-sm font-bold text-terracotta-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>{business.sektor_usaha} • {business.rw} ({business.rt})</span>
              </span>

              {/* Rating: ⭐ 4.8 Google Maps */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 px-3 py-1 rounded-xl text-xs font-extrabold text-amber-900 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>⭐ {googleDetails.rating} Google Maps</span>
                  <span className="text-gray-500 font-normal">({googleDetails.reviewCount})</span>
                </div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {business.nama_usaha}
            </h2>
          </div>

          {/* Info Details List */}
          <div className="bg-[#F8F9F8] rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <UserIcon className="w-4 h-4 text-emerald-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Pemilik Usaha</span>
                <span className="font-bold text-slate-900">{business.nama_pemilik || 'Belum tercatat'}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-800 mt-0.5 flex-shrink-0" />
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
              <ShoppingCart className="w-4 h-4 text-emerald-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Produk / Layanan Unggulan</span>
                <span className="font-semibold text-emerald-900 leading-relaxed">{business.produk}</span>
              </div>
            </div>

            {business.no_telepon && business.no_telepon !== '-' && (
              <div className="flex items-start gap-3">
                <MessageCircle className="w-4 h-4 text-emerald-800 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Kontak WhatsApp</span>
                  <span className="font-bold text-slate-900">{business.no_telepon}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mini Peta / Location Preview (Task 4) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <MapIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Lokasi Koordinat Google Maps</h4>
                <p className="text-[11px] text-emerald-800">
                  {hasCoordinates 
                    ? `Lat: ${business.latitude?.toFixed(4)}, Lng: ${business.longitude?.toFixed(4)}`
                    : 'Lokasi belum tersedia di Google Maps'
                  }
                </p>
              </div>
            </div>

            {hasCoordinates ? (
              <a
                href={gpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-xs"
              >
                <span>Buka Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                Koordinat Menunggu Admin
              </span>
            )}
          </div>

          {/* Primary Action Buttons: WhatsApp Direct & Navigasi GPS */}
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

            {hasCoordinates ? (
              <a
                href={gpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-[#C85A32] hover:bg-[#B84A22] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98"
              >
                <Navigation className="w-4 h-4" />
                <span>Navigasi Google Maps</span>
              </a>
            ) : (
              <button
                disabled
                className="py-3 px-4 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Navigation className="w-4 h-4" />
                <span>Lokasi Belum Tersedia</span>
              </button>
            )}
          </div>

          {/* 3. SECTION: REVIEW GOOGLE MAPS (Task 4 Requirement) */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Review Google Maps</h3>
                  <p className="text-[11px] text-slate-500">
                    Berdasarkan {googleDetails.reviewCount} ulasan publik terverifikasi di Google Places
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-amber-600">⭐ {googleDetails.rating}</span>
                <span className="text-[10px] text-slate-400 block">/ 5.0 Google</span>
              </div>
            </div>

            {/* List of Google Reviews */}
            <div className="space-y-3">
              {googleDetails.reviews.map((gRev, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-1.5 text-xs">
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
                        <span className="font-bold text-slate-900">{gRev.author_name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{gRev.relative_time_description}</span>
                      </div>
                    </div>

                    <div className="text-amber-500 font-bold text-xs">
                      {'★'.repeat(gRev.rating)}{'☆'.repeat(5 - gRev.rating)}
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px] italic">
                    "{gRev.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. SECTION: ULASAN INTERNAL WARGA SPOTSINI (Task 5 & 6) */}
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

        </div>
      </div>
    </div>
  );
};
