import React, { useEffect, useRef } from 'react';
import { Business } from '../types/business';
import { BusinessCard } from './BusinessCard';
import { MapPin, CheckCircle, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import L from 'leaflet';

interface HomePreviewProps {
  businesses: Business[];
  onSelectBusiness: (biz: Business) => void;
  onExploreMore: () => void;
  onOpenFullMap: () => void;
}

export const HomePreview: React.FC<HomePreviewProps> = ({
  businesses,
  onSelectBusiness,
  onExploreMore,
  onOpenFullMap
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Filter only verified businesses with valid coordinates for map preview
  const validMapBusinesses = businesses.filter(
    (b) => b.status_verifikasi === 'Terverifikasi' && b.latitude !== null && b.longitude !== null
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center of Kelurahan Penggilingan
    const centerLat = -6.2085;
    const centerLng = 106.9420;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add custom markers
    validMapBusinesses.forEach((biz) => {
      if (biz.latitude === null || biz.longitude === null) return;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: #134E39;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            font-size: 14px;
          ">
            🏪
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([biz.latitude, biz.longitude], { icon: customIcon }).addTo(map);

      // Popup safely created using DOM textContent (prevents DOM XSS)
      const popupContainer = document.createElement('div');
      popupContainer.className = 'p-1 text-slate-800 text-xs';

      const titleEl = document.createElement('div');
      titleEl.style.fontWeight = '800';
      titleEl.style.fontSize = '13px';
      titleEl.style.marginBottom = '2px';
      titleEl.style.color = '#134E39';
      titleEl.textContent = biz.nama_usaha;
      popupContainer.appendChild(titleEl);

      const metaEl = document.createElement('div');
      metaEl.style.fontSize = '11px';
      metaEl.style.color = '#C85A32';
      metaEl.style.fontWeight = '700';
      metaEl.style.marginBottom = '4px';
      metaEl.textContent = `${biz.sektor_usaha} • ${biz.rw}`;
      popupContainer.appendChild(metaEl);

      const addressEl = document.createElement('div');
      addressEl.style.fontSize = '11px';
      addressEl.style.color = '#64748b';
      addressEl.style.marginBottom = '8px';
      addressEl.textContent = biz.alamat_lengkap.length > 70 ? `${biz.alamat_lengkap.slice(0, 70)}...` : biz.alamat_lengkap;
      popupContainer.appendChild(addressEl);

      const btn = document.createElement('button');
      btn.style.width = '100%';
      btn.style.backgroundColor = '#134E39';
      btn.style.color = 'white';
      btn.style.padding = '4px 8px';
      btn.style.borderRadius = '6px';
      btn.style.fontWeight = '700';
      btn.style.fontSize = '11px';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.textContent = 'Lihat Detail Usaha';
      btn.onclick = () => onSelectBusiness(biz);
      popupContainer.appendChild(btn);

      marker.bindPopup(popupContainer);
    });

    return () => {
      // Map cleanup on unmount
    };
  }, [validMapBusinesses, onSelectBusiness]);

  // Top 3 businesses to showcase on homepage (matching screenshot)
  const previewBusinesses = businesses.slice(0, 3);

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* 1. Showcase Section: 3 Business Cards matching the user's reference screenshot */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                KATALOG USAHA UNGGULAN
              </span>
              <span className="text-xs text-slate-500 font-medium">• Penggilingan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Direktori Usaha Mikro Terverifikasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Eksplorasi usaha mikro lokal dengan dokumentasi foto asli, titik Google Maps, dan jalur kontak WhatsApp langsung ke pemilik usaha.
            </p>
          </div>
          <button
            onClick={onExploreMore}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition-colors shadow-xs"
          >
            <span>Buka Seluruh Katalog ({businesses.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Columns Business Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewBusinesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              onSelectBusiness={onSelectBusiness}
              onOpenMap={onOpenFullMap}
            />
          ))}
        </div>
      </div>

      {/* 2. Interactive Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Peta Interaktif Preview */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-emerald-950/10 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-[#F4F8F6]">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-forest-600" />
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Peta Interaktif Kelurahan Penggilingan
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {validMapBusinesses.length} usaha terverifikasi telah memiliki titik koordinat presisi
              </p>
            </div>
            <button
              onClick={onOpenFullMap}
              className="text-xs font-bold text-forest-600 hover:text-forest-700 flex items-center gap-1 hover:underline"
            >
              <span>Perbesar Peta</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Map Viewport */}
          <div className="relative flex-1 min-h-[380px] bg-slate-100">
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />
            <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-md">
              💡 Klik titik lokasi untuk melihat info usaha
            </div>
          </div>
        </div>

        {/* Right Column: Quick Stats & Discovery Callout */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-gradient-to-br from-[#134E39] to-[#0A2E22] text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Geotagging Terverifikasi
              </span>
              <h3 className="text-xl sm:text-2xl font-black mt-1">
                Eksplorasi UMKM Per Wilayah RW
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mt-2">
                Temukan kuliner legendaris, warung sembako, penjahit, dan jasa lokal terpercaya di seluruh 14 RW Kelurahan Penggilingan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <span className="text-2xl font-black text-white">{businesses.length}</span>
                <p className="text-[11px] text-emerald-200 mt-0.5">Total UMKM</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <span className="text-2xl font-black text-amber-300">14 RW</span>
                <p className="text-[11px] text-emerald-200 mt-0.5">Cakupan Wilayah</p>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={onExploreMore}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#C85A32] hover:bg-[#B84A22] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              <span>Jelajahi Direktori Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenFullMap}
              className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <span>Buka Peta Interaktif Layar Penuh</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

