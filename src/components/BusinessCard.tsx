import React from 'react';
import { Business } from '../types/business';
import { getBusinessWhatsAppUrl } from '../utils/whatsapp';
import { getPrimaryImageForBusiness } from '../utils/imageService';
import { Clock, Heart, MapPin, Navigation, Star } from 'lucide-react';

import { usePlaceDetails } from '../services/placesService';

interface BusinessCardProps {
  business: Business;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onSelectBusiness?: (biz: Business) => void;
  onOpenMap?: (biz: Business) => void;
  className?: string;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  isFavorite = false,
  onToggleFavorite,
  onSelectBusiness,
  onOpenMap,
  className = ''
}) => {
  // Dynamically load real-time rating and reviews from Google Places API (New)
  const activePlaceId = business.placeId || business.google_place_id;
  const { data: placeData, loading: placeLoading } = usePlaceDetails(
    activePlaceId,
    business.nama_usaha,
    business.latitude,
    business.longitude
  );

  const displayRating = placeData?.rating ?? (business.google_rating && business.google_rating > 0 ? business.google_rating : null);
  const displayReviewCount = placeData?.userRatingCount ?? (business.google_review_count && business.google_review_count > 0 ? business.google_review_count : 0);

  const whatsappUrl = business.no_telepon
    ? getBusinessWhatsAppUrl(business.no_telepon, business.nama_usaha)
    : '';

  const imageUrl =
    business.foto_usaha ||
    getPrimaryImageForBusiness(business.id) ||
    `/images/businesses/${business.id}.jpg`;

  const pemilikDisplay =
    business.nama_pemilik && business.nama_pemilik !== '-' && business.nama_pemilik.trim() !== ''
      ? business.nama_pemilik
      : 'Belum tercatat';

  const isVerified = business.status_verifikasi === 'Terverifikasi';

  return (
    <div
      onClick={() => onSelectBusiness?.(business)}
      className={`group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer ${className}`}
    >
      {/* 1. Image Container */}
      <div className="relative w-full h-52 sm:h-56 bg-slate-100 overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={business.nama_usaha}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Overlay for bottom text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

        {/* Top-Left: Sektor Usaha Pill */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-block bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {business.sektor_usaha || 'Kuliner'}
          </span>
        </div>

        {/* Top-Right: RW & RT Pill */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-block bg-[#FACC15] text-slate-900 font-extrabold text-xs px-3 py-1 rounded-full shadow-sm">
            {business.rw || 'RW 00'} • {business.rt || 'RT 00'}
          </span>
        </div>

        {/* Bottom-Left: Jam Buka */}
        <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1.5 text-white text-xs font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          <Clock className="w-3.5 h-3.5 text-white" />
          <span>{business.jam_operasional || 'Jam buka belum tercatat'}</span>
        </div>

        {/* Bottom-Right: Data Sumber Pill */}
        <div className="absolute bottom-2.5 right-3 z-10">
          <span className="inline-block bg-[#FEF08A] text-[#713F12] text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">
            Data sumber
          </span>
        </div>
      </div>

      {/* 2. Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          {/* Business Name & Heart Button */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
              {business.nama_usaha}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(business.id);
              }}
              className="w-8 h-8 rounded-full border border-slate-200 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0"
              title={isFavorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>
          </div>

          {/* Rating & Google Maps Reviews link */}
          <div className="flex items-center justify-between text-xs">
            {displayRating && displayRating > 0 ? (
              <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{displayRating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({displayReviewCount})</span>
              </span>
            ) : placeLoading ? (
              <span className="text-slate-400 text-[11px] animate-pulse">Memuat rating Maps...</span>
            ) : (
              <span className="text-slate-400 font-normal">Rating belum tersedia</span>
            )}

            <a
              href={business.mapsUrl || business.maps_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-emerald-700 underline underline-offset-2 flex items-center gap-0.5 transition-colors"
            >
              <span>Ulasan di Google Maps</span>
              <span className="text-[11px]">↗</span>
            </a>
          </div>

          {/* Pemilik */}
          <p className="text-xs text-slate-700 font-medium">
            Pemilik: <span className="font-semibold text-slate-800">{pemilikDisplay}</span>
          </p>

          {/* Alamat */}
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2 leading-relaxed">
              {business.alamat_lengkap}
            </span>
          </div>

          {/* Status Verifikasi Badge */}
          <div>
            <div
              className={`w-full text-xs font-semibold px-3 py-1.5 rounded-lg text-center sm:text-left transition-colors ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                  : 'bg-[#FEF9C3]/80 text-[#854D0E] border border-amber-200/50'
              }`}
            >
              {isVerified ? 'Terverifikasi' : 'Belum diverifikasi admin'}
            </div>
          </div>

          {/* Detail Produk (Italic) */}
          <p className="text-xs italic text-slate-500 line-clamp-1">
            {business.produk || 'Detail produk belum dicantumkan pada sumber.'}
          </p>
        </div>

        {/* 3. Action Buttons & Footer Links */}
        <div className="pt-2 space-y-3">
          {/* Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Green Hubungi WA Button */}
            <a
              href={whatsappUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!whatsappUrl) e.preventDefault();
                e.stopPropagation();
              }}
              className="py-2.5 px-3 rounded-xl bg-[#009E60] hover:bg-[#008751] text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs active:scale-98 text-center"
            >
              Hubungi WA
            </a>

            {/* Terracotta Buka Google Maps Button */}
            <a
              href={business.maps_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!business.maps_url) e.preventDefault();
                e.stopPropagation();
              }}
              className="py-2.5 px-3 rounded-xl bg-[#C85A32] hover:bg-[#B34D27] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 text-center"
            >
              <Navigation className="w-3.5 h-3.5 rotate-45 flex-shrink-0" />
              <span>Buka Google Maps</span>
            </a>
          </div>

          {/* Footer Navigation Links */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMap?.(business);
              }}
              className="text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer group/map font-semibold"
            >
              <span className="text-sm">🗺️</span>
              <span className="group-hover/map:text-emerald-700">Lihat di Peta Interaktif</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectBusiness?.(business);
              }}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-0.5 transition-colors cursor-pointer font-semibold group/detail"
            >
              <span>Lihat Detail</span>
              <span className="transition-transform group-hover/detail:translate-x-0.5">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
