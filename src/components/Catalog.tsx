import React, { useState } from 'react';
import { Business, BusinessSector, User } from '../types/business';
import { BusinessPlaceholder } from './BusinessPlaceholder';
import { BusinessCard } from './BusinessCard';
import { getBusinessWhatsAppUrl } from '../utils/whatsapp';
import { calculateDistanceMeters, getUserFavorites, toggleFavorite } from '../utils/reviewService';
import { 
  MessageCircle, CheckCircle, Search, ChevronRight, ChevronLeft, 
  MapPin, Star, Heart, Flame, Award, Navigation 
} from 'lucide-react';

interface CatalogProps {
  businesses: Business[];
  selectedSector: BusinessSector | 'Semua';
  onSelectSector: (s: BusinessSector | 'Semua') => void;
  selectedRw: string;
  onSelectRw: (rw: string) => void;
  availableRws: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectBusiness: (biz: Business) => void;
  onLocateOnMap?: (biz: Business) => void;
  currentUser?: User | null;
  onRequireAuth?: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  businesses,
  selectedSector,
  onSelectSector,
  selectedRw,
  onSelectRw,
  availableRws,
  searchQuery,
  onSearchChange,
  onSelectBusiness,
  onLocateOnMap,
  currentUser,
  onRequireAuth
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [radiusFilter, setRadiusFilter] = useState<'Semua' | '1km' | '5km' | '10km'>('Semua');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [favorites, setFavorites] = useState<string[]>(() => 
    currentUser ? getUserFavorites(currentUser.id) : []
  );

  const itemsPerPage = 6;
  const PENGGILINGAN_CENTER = { lat: -6.2085, lng: 106.9420 };

  // Only verified businesses appear publicly
  const verifiedBusinesses = businesses.filter(b => b.status_verifikasi === 'Terverifikasi');

  const handleFavoriteClick = (e: React.MouseEvent, bizId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const isNowFav = toggleFavorite(currentUser.id, bizId);
    if (isNowFav) {
      setFavorites(prev => [...prev, bizId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== bizId));
    }
  };

  // Filter logic
  const filtered = verifiedBusinesses.filter(b => {
    // Sector filter
    if (selectedSector !== 'Semua' && b.sektor_usaha !== selectedSector) {
      return false;
    }
    // RW filter
    if (selectedRw !== 'Semua' && selectedRw !== 'Semua RW' && b.rw !== selectedRw) {
      return false;
    }
    // Rating filter
    if (minRatingFilter > 0) {
      const bizRating = b.rating_avg || 4.5;
      if (bizRating < minRatingFilter) return false;
    }
    // Radius filter (from center of Penggilingan)
    if (radiusFilter !== 'Semua') {
      if (b.latitude === null || b.longitude === null) return false;
      const distMeters = calculateDistanceMeters(
        PENGGILINGAN_CENTER.lat,
        PENGGILINGAN_CENTER.lng,
        b.latitude,
        b.longitude
      );
      const limitMeters = radiusFilter === '1km' ? 1000 : radiusFilter === '5km' ? 5000 : 10000;
      if (distMeters > limitMeters) return false;
    }
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = b.nama_usaha.toLowerCase().includes(q);
      const matchProduct = b.produk.toLowerCase().includes(q);
      const matchOwner = b.nama_pemilik.toLowerCase().includes(q);
      const matchAddress = b.alamat_lengkap.toLowerCase().includes(q);
      if (!matchName && !matchProduct && !matchOwner && !matchAddress) {
        return false;
      }
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const sectors: (BusinessSector | 'Semua')[] = [
    'Semua',
    'Kuliner',
    'Jasa',
    'Perdagangan/Sembako',
    'Kriya & Konveksi',
    'Lainnya'
  ];

  return (
    <section id="katalog" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* LEFT SIDEBAR: Filters */}
        <div className="w-full lg:w-72 bg-white rounded-3xl p-6 border border-emerald-950/10 shadow-sm space-y-6 flex-shrink-0">
          
          {/* Sektor Filter */}
          <div>
            <h3 className="text-xs font-extrabold text-white bg-[#C85A32] py-2 px-4 rounded-xl mb-3 text-center tracking-wide uppercase shadow-xs">
              Filter Sektor Usaha
            </h3>
            <div className="space-y-1.5">
              {sectors.map((sec) => {
                const isSelected = selectedSector === sec;
                const count = sec === 'Semua'
                  ? verifiedBusinesses.length
                  : verifiedBusinesses.filter(b => b.sektor_usaha === sec).length;

                return (
                  <button
                    key={sec}
                    onClick={() => {
                      onSelectSector(sec);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#134E39] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sec === 'Semua' ? 'Semua Sektor' : sec}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Wilayah [RW] Filter */}
          <div>
            <h3 className="text-xs font-extrabold text-white bg-[#134E39] py-2 px-4 rounded-xl mb-3 text-center tracking-wide uppercase shadow-xs">
              Wilayah [RW]
            </h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  onSelectRw('Semua');
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  selectedRw === 'Semua' || selectedRw === 'Semua RW'
                    ? 'bg-[#C85A32] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Semua RW</span>
                <span className="text-[11px] font-semibold opacity-80">{verifiedBusinesses.length}</span>
              </button>

              {availableRws.map((rw) => {
                const isSelected = selectedRw === rw;
                const count = verifiedBusinesses.filter(b => b.rw === rw).length;

                return (
                  <button
                    key={rw}
                    onClick={() => {
                      onSelectRw(rw);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#C85A32] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{rw}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Filter Radius Geotagging */}
          <div>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Radius Jarak (Pusat Penggilingan)</span>
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(['Semua', '1km', '5km', '10km'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRadiusFilter(r);
                    setCurrentPage(1);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    radiusFilter === r
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {r === 'Semua' ? 'Semua Jarak' : `< ${r}`}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Rating */}
          <div>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Filter Rating Usaha</span>
            </h3>
            <div className="space-y-1">
              {[
                { label: 'Semua Rating', val: 0 },
                { label: '⭐ 4.8 Ke Atas', val: 4.8 },
                { label: '⭐ 4.5 Ke Atas', val: 4.5 }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setMinRatingFilter(opt.val);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    minRatingFilter === opt.val
                      ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT CONTENT: Direktori Usaha Mikro Grid */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Header Bar */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-950/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Direktori Usaha Mikro
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Menampilkan <span className="font-bold text-emerald-800">{filtered.length}</span> usaha terverifikasi di Kelurahan Penggilingan
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari usaha, produk, alamat..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Cards Grid */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-2xl mb-3">
                🔍
              </div>
              <h3 className="text-base font-bold text-slate-800">Tidak ada usaha ditemukan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Silakan sesuaikan kata kunci pencarian atau ubah filter sektor, RW, atau radius.
              </p>
              <button
                onClick={() => {
                  onSelectSector('Semua');
                  onSelectRw('Semua');
                  setRadiusFilter('Semua');
                  setMinRatingFilter(0);
                  onSearchChange('');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  isFavorite={favorites.includes(biz.id)}
                  onToggleFavorite={(id) => handleFavoriteClick({ stopPropagation: () => {} } as any, id)}
                  onSelectBusiness={onSelectBusiness}
                  onOpenMap={onLocateOnMap}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === idx + 1
                        ? 'bg-[#134E39] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C85A32] text-white hover:bg-[#B84A22] disabled:opacity-40 flex items-center gap-1 shadow-sm"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
