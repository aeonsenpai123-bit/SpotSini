import React, { useEffect, useRef, useState } from 'react';
import { Business, BusinessSector } from '../types/business';
import { MapPin, Navigation, Info, ExternalLink, Target, Layers } from 'lucide-react';
import { calculateDistanceMeters } from '../utils/reviewService';
import { GoogleMapView } from './GoogleMapView';
import L from 'leaflet';

interface InteractiveMapProps {
  businesses: Business[];
  onSelectBusiness: (biz: Business) => void;
  availableRws: string[];
  focusedBusiness?: Business | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  businesses,
  onSelectBusiness,
  availableRws,
  focusedBusiness
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Default to Google Maps as primary engine (Task 3)
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [selectedSector, setSelectedSector] = useState<BusinessSector | 'Semua'>('Semua');
  const [selectedRw, setSelectedRw] = useState<string>('Semua');
  const [mapRadius, setMapRadius] = useState<'Semua' | '1km' | '5km' | '10km'>('Semua');

  const PENGGILINGAN_CENTER = { lat: -6.2085, lng: 106.9420 };

  // Only verified businesses with valid coordinates
  const verifiedMapBusinesses = businesses.filter(
    (b) => b.status_verifikasi === 'Terverifikasi' && b.latitude !== null && b.longitude !== null
  );

  const filteredBusinesses = verifiedMapBusinesses.filter((b) => {
    if (selectedSector !== 'Semua' && b.sektor_usaha !== selectedSector) return false;
    if (selectedRw !== 'Semua' && b.rw !== selectedRw) return false;
    if (mapRadius !== 'Semua' && b.latitude !== null && b.longitude !== null) {
      const dist = calculateDistanceMeters(
        PENGGILINGAN_CENTER.lat,
        PENGGILINGAN_CENTER.lng,
        b.latitude,
        b.longitude
      );
      const limit = mapRadius === '1km' ? 1000 : mapRadius === '5km' ? 5000 : 10000;
      if (dist > limit) return false;
    }
    return true;
  });

  const getSectorPinColor = (s: BusinessSector) => {
    switch (s) {
      case 'Kuliner': return '#C85A32'; // terracotta
      case 'Jasa': return '#8B5CF6'; // purple
      case 'Perdagangan/Sembako': return '#10B981'; // emerald
      case 'Kriya & Konveksi': return '#3B82F6'; // blue
      default: return '#64748B';
    }
  };

  // Initialize Leaflet Map (used when engine === 'leaflet' or fallback)
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [PENGGILINGAN_CENTER.lat, PENGGILINGAN_CENTER.lng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | SpotSiNi Penggilingan',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    // Remove old radius circle
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }

    // Render radius circle if active
    if (mapRadius !== 'Semua') {
      const radiusMeters = mapRadius === '1km' ? 1000 : mapRadius === '5km' ? 5000 : 10000;
      const circle = L.circle([PENGGILINGAN_CENTER.lat, PENGGILINGAN_CENTER.lng], {
        radius: radiusMeters,
        color: '#134E39',
        fillColor: '#10B981',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(map);
      radiusCircleRef.current = circle;
    }

    // Add markers for filtered businesses
    filteredBusinesses.forEach((biz) => {
      if (biz.latitude === null || biz.longitude === null) return;

      const pinColor = getSectorPinColor(biz.sektor_usaha);

      const customIcon = L.divIcon({
        className: 'spotsini-map-pin',
        html: `
          <div style="
            background-color: ${pinColor};
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <span style="transform: rotate(45deg); font-size: 15px;">🏪</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      const marker = L.marker([biz.latitude, biz.longitude], { icon: customIcon }).addTo(map);
      markersRef.current[biz.id] = marker;

      // Popup safely created using DOM textContent
      const popupContainer = document.createElement('div');
      popupContainer.className = 'p-1 text-slate-800 text-xs';

      const titleEl = document.createElement('div');
      titleEl.style.fontWeight = '800';
      titleEl.style.fontSize = '14px';
      titleEl.style.marginBottom = '2px';
      titleEl.style.color = '#134E39';
      titleEl.textContent = biz.nama_usaha;
      popupContainer.appendChild(titleEl);

      const metaEl = document.createElement('div');
      metaEl.style.fontSize = '11px';
      metaEl.style.color = '#C85A32';
      metaEl.style.fontWeight = '700';
      metaEl.style.marginBottom = '4px';
      metaEl.textContent = `${biz.sektor_usaha} • ${biz.rw} (${biz.rt}) • ⭐ ${biz.google_rating || biz.rating_avg || '4.8'}`;
      popupContainer.appendChild(metaEl);

      const addressEl = document.createElement('div');
      addressEl.style.fontSize = '11px';
      addressEl.style.color = '#475569';
      addressEl.style.marginBottom = '8px';
      addressEl.textContent = biz.alamat_lengkap;
      popupContainer.appendChild(addressEl);

      const btn = document.createElement('button');
      btn.style.width = '100%';
      btn.style.backgroundColor = '#134E39';
      btn.style.color = 'white';
      btn.style.padding = '6px 12px';
      btn.style.borderRadius = '8px';
      btn.style.fontWeight = '700';
      btn.style.fontSize = '12px';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.textContent = 'Buka Detail Lengkap';
      btn.onclick = () => onSelectBusiness(biz);
      popupContainer.appendChild(btn);

      marker.bindPopup(popupContainer);
    });

  }, [filteredBusinesses, mapEngine, mapRadius, onSelectBusiness]);

  // Handle auto-focus from Catalog in Leaflet mode
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !focusedBusiness || !mapInstanceRef.current) return;

    if (focusedBusiness.latitude !== null && focusedBusiness.longitude !== null) {
      const map = mapInstanceRef.current;
      map.flyTo([focusedBusiness.latitude, focusedBusiness.longitude], 17, {
        duration: 1.2
      });

      const marker = markersRef.current[focusedBusiness.id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 1300);
      }
    }
  }, [focusedBusiness, mapEngine]);

  return (
    <section id="peta" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-sm overflow-hidden flex flex-col">
        
        {/* Map Header & Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F4F8F6]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Geotagging Terverifikasi Google Maps</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Peta Interaktif Usaha Mikro Penggilingan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Menampilkan {filteredBusinesses.length} titik usaha terverifikasi dari 14 RW di Kelurahan Penggilingan
            </p>
          </div>

          {/* Quick Filters for Map */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Map Engine Toggle */}
            <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setMapEngine('google')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mapEngine === 'google'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Google Maps JavaScript API"
              >
                Google Maps
              </button>
              <button
                type="button"
                onClick={() => setMapEngine('leaflet')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mapEngine === 'leaflet'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="OpenStreetMap Fallback"
              >
                OSM Fallback
              </button>
            </div>

            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as any)}
              className="text-xs font-bold py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs"
            >
              <option value="Semua">Semua Sektor</option>
              <option value="Kuliner">Kuliner</option>
              <option value="Jasa">Jasa</option>
              <option value="Perdagangan/Sembako">Perdagangan/Sembako</option>
              <option value="Kriya & Konveksi">Kriya & Konveksi</option>
              <option value="Lainnya">Lainnya</option>
            </select>

            <select
              value={selectedRw}
              onChange={(e) => setSelectedRw(e.target.value)}
              className="text-xs font-bold py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs"
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

        {/* Map Canvas */}
        <div className="relative w-full h-[520px] sm:h-[620px] bg-slate-100">
          {mapEngine === 'google' ? (
            <GoogleMapView
              businesses={businesses}
              onSelectBusiness={onSelectBusiness}
              focusedBusiness={focusedBusiness}
              selectedSector={selectedSector}
              selectedRw={selectedRw}
            />
          ) : (
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />
          )}
          
          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg text-xs space-y-1.5 hidden sm:block">
            <div className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider mb-2">
              Legenda Sektor
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#C85A32]" />
              <span className="text-slate-700 font-medium">Kuliner</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
              <span className="text-slate-700 font-medium">Jasa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10B981]" />
              <span className="text-slate-700 font-medium">Perdagangan/Sembako</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
              <span className="text-slate-700 font-medium">Kriya & Konveksi</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-md">
            📍 Klik titik pin untuk melihat profil lengkap
          </div>
        </div>

      </div>
    </section>
  );
};
