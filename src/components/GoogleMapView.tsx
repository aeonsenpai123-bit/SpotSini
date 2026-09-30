import React, { useEffect, useRef, useState } from 'react';
import { Business, BusinessSector } from '../types/business';
import { loadGoogleMaps, getGoogleMapsApiKey, setGoogleMapsApiKey } from '../utils/googleMapsService';
import { getPrimaryImageForBusiness } from '../utils/imageService';
import { getBusinessWhatsAppUrl } from '../utils/whatsapp';
import { MapPin, Navigation, MessageCircle, AlertTriangle, Key, ExternalLink } from 'lucide-react';

interface GoogleMapViewProps {
  businesses: Business[];
  onSelectBusiness: (biz: Business) => void;
  focusedBusiness?: Business | null;
  selectedSector?: BusinessSector | 'Semua';
  selectedRw?: string;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  businesses,
  onSelectBusiness,
  focusedBusiness,
  selectedSector = 'Semua',
  selectedRw = 'Semua'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [id: string]: google.maps.Marker }>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputApiKey, setInputApiKey] = useState(() => getGoogleMapsApiKey());

  // Kelurahan Penggilingan default center
  const DEFAULT_CENTER = { lat: -6.2085, lng: 106.9420 };

  // Task 3: Marker HANYA menampilkan usaha dengan status 'Terverifikasi'
  const verifiedMapBusinesses = businesses.filter(
    (b) => b.status_verifikasi === 'Terverifikasi' && b.latitude !== null && b.longitude !== null
  );

  const filteredBusinesses = verifiedMapBusinesses.filter((b) => {
    if (selectedSector !== 'Semua' && b.sektor_usaha !== selectedSector) return false;
    if (selectedRw !== 'Semua' && selectedRw !== 'Semua RW' && b.rw !== selectedRw) return false;
    return true;
  });

  const getPinColor = (s: BusinessSector) => {
    switch (s) {
      case 'Kuliner': return '#C85A32'; // terracotta
      case 'Jasa': return '#8B5CF6'; // purple
      case 'Perdagangan/Sembako': return '#10B981'; // emerald
      case 'Kriya & Konveksi': return '#3B82F6'; // blue
      default: return '#134E39';
    }
  };

  // Initialize Google Maps with IntersectionObserver & DOM guard
  useEffect(() => {
    let isMounted = true;
    let observer: IntersectionObserver | null = null;

    async function initMap() {
      // Guard: Ensure component is mounted and container DOM element exists
      if (!isMounted || !mapRef.current) return;

      try {
        setLoading(true);
        setLoadError(null);

        const google = await loadGoogleMaps();
        if (!google || !google.maps) {
          if (isMounted) {
            setLoadError('Google Maps API Key belum dikonfigurasi atau tidak valid.');
            setLoading(false);
          }
          return;
        }

        // Guard: Re-check that container element is valid and mounted after async loader completes
        if (!isMounted || !mapRef.current || !(mapRef.current instanceof Element)) {
          return;
        }

        if (!googleMapInstance.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: 15,
            mapId: 'SPOTSINI_GOOGLE_MAP',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });
          googleMapInstance.current = map;
          infoWindowRef.current = new google.maps.InfoWindow();
        }

        const map = googleMapInstance.current;
        const infoWindow = infoWindowRef.current;
        if (!map || !infoWindow) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(m => m.setMap(null));
        markersRef.current = {};

        // Render markers for verified businesses
        filteredBusinesses.forEach((biz) => {
          if (biz.latitude === null || biz.longitude === null) return;

          const pinColor = getPinColor(biz.sektor_usaha);

          // SVG Marker Pin
          const markerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
              <path d="M19 0 C8.5 0 0 8.5 0 19 C0 33 19 46 19 46 C19 46 38 33 38 19 C38 8.5 29.5 0 19 0 Z" fill="${pinColor}" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="19" cy="18" r="8" fill="#FFFFFF"/>
            </svg>
          `)}`;

          const marker = new google.maps.Marker({
            position: { lat: biz.latitude, lng: biz.longitude },
            map,
            title: biz.nama_usaha,
            icon: {
              url: markerSvg,
              scaledSize: new google.maps.Size(38, 46),
              anchor: new google.maps.Point(19, 46)
            }
          });

          markersRef.current[biz.id] = marker;

          // On Marker Click -> Open InfoWindow with required specs
          marker.addListener('click', () => {
            if (!infoWindow) return;

            const photoUrl = getPrimaryImageForBusiness(biz.id) || biz.foto_usaha || '';
            const whatsappUrl = biz.no_telepon ? getBusinessWhatsAppUrl(biz.no_telepon, biz.nama_usaha) : '';
            const gpsUrl = biz.maps_url || biz.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}`;
            const ratingText = biz.google_rating || biz.rating_avg || 4.8;

            const contentDiv = document.createElement('div');
            contentDiv.style.width = '240px';
            contentDiv.style.fontFamily = 'inherit';
            contentDiv.style.padding = '4px';

            contentDiv.innerHTML = `
              ${photoUrl ? `<div style="width: 100%; height: 110px; border-radius: 12px; overflow: hidden; margin-bottom: 8px;">
                <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${biz.nama_usaha}"/>
              </div>` : ''}
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #C85A32; letter-spacing: 0.5px; margin-bottom: 2px;">
                ${biz.sektor_usaha} • ${biz.rw}
              </div>
              <div style="font-size: 14px; font-weight: 900; color: #0f172a; line-height: 1.2; margin-bottom: 4px;">
                ${biz.nama_usaha}
              </div>
              <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #d97706; margin-bottom: 6px;">
                <span>⭐ ${ratingText}</span>
                <span style="color: #64748b; font-weight: 500;">Google Maps</span>
              </div>
              <div style="font-size: 11px; color: #475569; margin-bottom: 10px; line-height: 1.3;">
                ${biz.alamat_lengkap}
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <button id="btn-detail-${biz.id}" style="width: 100%; background-color: #134E39; color: white; border: none; border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 700; cursor: pointer;">
                  Lihat Detail
                </button>
                <div style="display: flex; gap: 6px;">
                  ${whatsappUrl ? `
                    <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #C85A32; color: white; text-decoration: none; border-radius: 8px; padding: 6px; font-size: 11px; font-weight: 700;">
                      WhatsApp
                    </a>
                  ` : ''}
                  <a href="${gpsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #f1f5f9; color: #334155; text-decoration: none; border-radius: 8px; padding: 6px; font-size: 11px; font-weight: 700; border: 1px solid #cbd5e1;">
                    Navigasi
                  </a>
                </div>
              </div>
            `;

            // Bind button click cleanly
            setTimeout(() => {
              const btnDetail = document.getElementById(`btn-detail-${biz.id}`);
              if (btnDetail) {
                btnDetail.onclick = () => {
                  infoWindow.close();
                  onSelectBusiness(biz);
                };
              }
            }, 50);

            infoWindow.setContent(contentDiv);
            infoWindow.open(map, marker);
          });
        });

        if (isMounted) setLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err?.message || 'Gagal memuat Google Maps.');
          setLoading(false);
        }
      }
    }

    // IntersectionObserver to initialize map when container is in viewport
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          if (mapRef.current) {
            observer?.unobserve(mapRef.current);
          }
          initMap();
        }
      }, { rootMargin: '100px', threshold: 0.1 });

      if (mapRef.current) observer.observe(mapRef.current);
    } else {
      initMap();
    }

    return () => {
      isMounted = false;
      if (observer) {
        if (mapRef.current) observer.unobserve(mapRef.current);
        observer.disconnect();
      }
    };
  }, [filteredBusinesses]);

  // Task 3: Sync Map & Catalog (Pan, Zoom, & Open InfoWindow when focusedBusiness changes)
  useEffect(() => {
    if (!focusedBusiness || !googleMapInstance.current) return;

    if (focusedBusiness.latitude !== null && focusedBusiness.longitude !== null) {
      const map = googleMapInstance.current;
      const targetPos = { lat: focusedBusiness.latitude, lng: focusedBusiness.longitude };

      map.panTo(targetPos);
      map.setZoom(17);

      const marker = markersRef.current[focusedBusiness.id];
      if (marker && infoWindowRef.current) {
        google.maps.event.trigger(marker, 'click');
      }
    }
  }, [focusedBusiness]);

  const handleSaveApiKey = () => {
    setGoogleMapsApiKey(inputApiKey);
    setShowKeyModal(false);
    window.location.reload();
  };

  return (
    <div className="relative w-full h-full min-h-[480px]">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[480px] rounded-2xl overflow-hidden" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center rounded-2xl z-20">
          <div className="bg-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-800">Memuat Google Maps Penggilingan...</span>
          </div>
        </div>
      )}

      {/* Task 8 Fallback: If Google Maps API fails or Key is not provided */}
      {loadError && (
        <div className="absolute inset-0 bg-[#F4F8F6] border-2 border-dashed border-emerald-950/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center z-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mb-3 shadow-xs">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mb-1">
            Lokasi tidak tersedia di tampilan peta interaktif
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
            {loadError} Anda tetap dapat menavigasi titik usaha melalui Google Maps eksternal atau beralih ke mode OpenStreetMap (OSM Fallback) di bilah atas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Penggilingan+Cakung+Jakarta+Timur"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Google Maps Eksternal</span>
            </a>

            <button
              onClick={() => setShowKeyModal(true)}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5 text-emerald-800" />
              <span>Konfigurasi API Key</span>
            </button>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-extrabold text-slate-900">Google Maps API Key</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Masukkan Google Maps JavaScript API Key dengan izin <strong>Maps JavaScript API</strong> dan <strong>Places API</strong> untuk menampilkan peta satelit dan fitur Autocomplete langsung.
            </p>

            <input
              type="text"
              placeholder="AIzaSy..."
              value={inputApiKey}
              onChange={(e) => setInputApiKey(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-600 mb-4"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow"
              >
                Simpan & Muat Ulang Peta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
