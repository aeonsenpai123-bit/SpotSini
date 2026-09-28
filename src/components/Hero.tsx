import React from 'react';
import { Search, Filter, ArrowRight, PhoneCall } from 'lucide-react';
import { BusinessSector } from '../types/business';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSector: BusinessSector | 'Semua';
  onSectorChange: (s: BusinessSector | 'Semua') => void;
  selectedRw: string;
  onRwChange: (rw: string) => void;
  availableRws: string[];
  onExploreClick: () => void;
  onContactClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  selectedSector,
  onSectorChange,
  selectedRw,
  onRwChange,
  availableRws,
  onExploreClick,
  onContactClick,
}) => {
  return (
    <div className="relative bg-gradient-to-b from-[#134E39] via-[#0E3B2B] to-[#0A2D21] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative community ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-emerald-400 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-amber-500 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-3">
          Spot <span className="text-[#EEB79D]">SiNi</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-emerald-100 font-medium max-w-2xl mx-auto mb-4 leading-relaxed">
          Platform Akselerator Pemetaan Digital untuk Efisiensi Akses Data dan Integritas Informasi Usaha Mikro Kelurahan Penggilingan
        </p>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-emerald-200/80 italic mb-8">
          “Menjangkau yang Tersembunyi, Memajukan yang Ada”
        </p>

        {/* 2 Primary CTA Buttons from Mockup */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-12">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-[#C85A32] hover:bg-[#B84A22] text-white font-bold text-sm sm:text-base shadow-lg shadow-black/20 hover:shadow-xl transition-all active:scale-95"
          >
            <span>Selanjutnya</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onContactClick}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm sm:text-base shadow-md backdrop-blur-sm transition-all active:scale-95"
          >
            <PhoneCall className="w-4 h-4 text-emerald-300" />
            <span>Hubungi Kami</span>
          </button>
        </div>

        {/* Search & Filter Bar from Mockup */}
        <div className="max-w-3xl mx-auto bg-black/20 backdrop-blur-md p-3 sm:p-4 rounded-2xl sm:rounded-full border border-white/15 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-slate-800">
            {/* Free text search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Nama Produk/Usaha..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl sm:rounded-full bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32] shadow-inner"
              />
            </div>

            {/* Filter Sektor */}
            <div className="relative w-full sm:w-48">
              <select
                value={selectedSector}
                onChange={(e) => onSectorChange(e.target.value as any)}
                aria-label="Filter Sektor"
                className="w-full px-4 py-2.5 rounded-xl sm:rounded-full bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32] cursor-pointer shadow-inner"
              >
                <option value="Semua">Semua Sektor</option>
                <option value="Kuliner">Kuliner</option>
                <option value="Jasa">Jasa</option>
                <option value="Perdagangan/Sembako">Perdagangan/Sembako</option>
                <option value="Kriya & Konveksi">Kriya & Konveksi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Filter RT/RW (Dynamic from Dataset) */}
            <div className="relative w-full sm:w-40">
              <select
                value={selectedRw}
                onChange={(e) => onRwChange(e.target.value)}
                aria-label="Filter RT/RW"
                className="w-full px-4 py-2.5 rounded-xl sm:rounded-full bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32] cursor-pointer shadow-inner"
              >
                <option value="Semua">Semua RW</option>
                {availableRws.map((rw) => (
                  <option key={rw} value={rw}>
                    {rw}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
