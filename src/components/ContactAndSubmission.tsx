import React, { useState, useEffect, useRef } from 'react';
import { Business, BusinessSector, AiValidationResult } from '../types/business';
import { generateSubmissionWhatsAppUrl, ADMIN_WHATSAPP_NUMBER } from '../utils/whatsapp';
import { analyzeBusinessSubmission } from '../utils/aiValidationService';
import { 
  attachGooglePlacesAutocomplete, 
  SAMPLE_PENGGILINGAN_PLACES, 
  PlaceAutocompleteResult 
} from '../utils/googleMapsService';
import { 
  Send, CheckCircle, ArrowRight, ArrowLeft, Building, 
  Mail, Phone, Instagram, Linkedin, MessageCircle, MapPin, Upload, AlertCircle, Sparkles, Check, Compass
} from 'lucide-react';

interface ContactAndSubmissionProps {
  onAddSubmission: (newBiz: Business) => void;
  availableRws: string[];
  businesses?: Business[];
}

export const ContactAndSubmission: React.FC<ContactAndSubmissionProps> = ({
  onAddSubmission,
  availableRws,
  businesses = []
}) => {
  // Step state: 1 = Isi Profil, 2 = Review Data (AI Assisted), 3 = Konfirmasi Berhasil
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [namaPemilik, setNamaPemilik] = useState('');
  const [namaUsaha, setNamaUsaha] = useState('');
  const [sektorUsaha, setSektorUsaha] = useState<BusinessSector>('Kuliner');
  const [telepon, setTelepon] = useState('');
  const [alamat, setAlamat] = useState('');
  const [rt, setRt] = useState('RT 01');
  const [rw, setRw] = useState('RW 06');
  const [mapsLink, setMapsLink] = useState('');
  const [produk, setProduk] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Google Places & Geocoding Integration (Task 3 & 8)
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [googlePlaceId, setGooglePlaceId] = useState<string>('');
  const [googleRating, setGoogleRating] = useState<number | undefined>(undefined);
  const [googleReviewCount, setGoogleReviewCount] = useState<number | undefined>(undefined);
  const [showManualCoords, setShowManualCoords] = useState<boolean>(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // AI Validation result
  const [aiResult, setAiResult] = useState<AiValidationResult | null>(null);
  const [submittedBiz, setSubmittedBiz] = useState<Business | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    if (step === 1 && addressInputRef.current) {
      attachGooglePlacesAutocomplete(addressInputRef.current, (result) => {
        setAlamat(result.formatted_address);
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        setGooglePlaceId(result.google_place_id);
        if (result.google_rating) setGoogleRating(result.google_rating);
        if (result.google_review_count) setGoogleReviewCount(result.google_review_count);
      }).then((fn) => {
        cleanup = fn;
      });
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [step]);

  const handleSelectSamplePlace = (p: PlaceAutocompleteResult) => {
    setAlamat(p.formatted_address);
    setLatitude(p.latitude);
    setLongitude(p.longitude);
    setGooglePlaceId(p.google_place_id);
    if (p.google_rating) setGoogleRating(p.google_rating);
    if (p.google_review_count) setGoogleReviewCount(p.google_review_count);
  };

  // Validate Step 1 & Run AI Analysis
  const handleNextToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaUsaha.trim()) {
      setErrorMessage('Nama usaha wajib diisi.');
      return;
    }
    if (!telepon.trim()) {
      setErrorMessage('Nomor telepon / kontak WhatsApp wajib diisi.');
      return;
    }
    if (!alamat.trim()) {
      setErrorMessage('Alamat usaha wajib diisi.');
      return;
    }

    setErrorMessage('');

    // Run AI analysis
    const analysis = analyzeBusinessSubmission(
      {
        namaUsaha: namaUsaha,
        namaPemilik: namaPemilik,
        sektorInput: sektorUsaha,
        alamat: alamat,
        telepon: telepon,
        produk: produk,
        fotoUrl: fotoUrl
      },
      businesses
    );

    setAiResult(analysis);
    setStep(2);
  };

  // Submit and launch WhatsApp
  const handleFinalSubmit = () => {
    // Generate new business entry with status "Menunggu Verifikasi"
    const newEntry: Business = {
      id: `BIZ-SUB-${Date.now()}`,
      no: Date.now(),
      nama_usaha: namaUsaha.trim(),
      nama_pemilik: namaPemilik.trim() || '-',
      no_telepon: telepon.trim(),
      alamat_lengkap: `${alamat.trim()}, ${rt}/${rw}, Penggilingan, Kec. Cakung, Jakarta Timur 13940`,
      rt: rt.trim() || 'RT 01',
      rw: rw.trim() || 'RW 06',
      sektor_usaha: sektorUsaha,
      latitude: latitude,
      longitude: longitude,
      google_place_id: googlePlaceId || undefined,
      google_rating: googleRating || 4.8,
      google_review_count: googleReviewCount || 1,
      maps_url: mapsLink.trim() || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : ''),
      foto_usaha: fotoUrl.trim() || null,
      status_verifikasi: 'Menunggu Verifikasi',
      produk: produk.trim() || 'Produk belum dirinci',
      sumber_data: 'Form Ajukan Usaha',
      catatan_perbaikan: aiResult ? `AI Status: ${aiResult.quality_status}. Rekomendasi: ${aiResult.recommended_sector}. ${aiResult.suggestions.join('; ')}` : undefined,
      tanggal_input: new Date().toISOString().slice(0, 10),
      tanggal_verifikasi: null,
      diverifikasi_oleh: null
    };

    onAddSubmission(newEntry);
    setSubmittedBiz(newEntry);
    setStep(3);

    // Deep-link to WhatsApp with pre-filled message per PRD Section 11.2
    const waUrl = generateSubmissionWhatsAppUrl({
      namaPemilik: namaPemilik.trim(),
      namaUsaha: namaUsaha.trim(),
      sektorUsaha,
      teleponAtauEmail: telepon.trim(),
      alamatUsaha: `${alamat.trim()} (${rt}/${rw})`
    });

    // Automatically open WhatsApp in a new tab
    window.open(waUrl, '_blank');
  };

  const handleApplyAiSector = (sec: BusinessSector) => {
    setSektorUsaha(sec);
    if (aiResult) {
      setAiResult({
        ...aiResult,
        recommended_sector: sec
      });
    }
  };

  const handleResetForm = () => {
    setNamaPemilik('');
    setNamaUsaha('');
    setSektorUsaha('Kuliner');
    setTelepon('');
    setAlamat('');
    setRt('RT 01');
    setRw('RW 06');
    setMapsLink('');
    setProduk('');
    setFotoUrl('');
    setLatitude(null);
    setLongitude(null);
    setGooglePlaceId('');
    setGoogleRating(undefined);
    setGoogleReviewCount(undefined);
    setShowManualCoords(false);
    setErrorMessage('');
    setAiResult(null);
    setStep(1);
    setSubmittedBiz(null);
  };

  return (
    <section id="kontak" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Banner CTA */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#134E39] via-[#0E3B2B] to-[#134E39] p-8 sm:p-14 text-center text-white shadow-xl overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            Temukan, Dukung, dan Tumbuhkan Usaha Mikro di SpotSiNi!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
            Jadikan usaha Anda mudah ditemukan oleh ribuan warga Penggilingan melalui peta digital resmi.
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Mari Berkolaborasi */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-950/10 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold text-terracotta-500 uppercase tracking-wider block mb-1">
              Hubungi Kami
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Mari Berkolaborasi
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Jangan sungkan untuk menghubungi kami. Tim kelurahan dan komunitas SpotSiNi siap membantu digitalisasi usaha Anda.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#F8F9F8]">
              <div className="w-8 h-8 rounded-xl bg-[#134E39] text-white flex items-center justify-center flex-shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Alamat SpotSiNi</span>
                <p className="font-semibold text-slate-800 leading-snug mt-0.5">
                  Kantor Kelurahan Penggilingan, Jl. Penggilingan No. 1, RT 01/RW 07, Kec. Cakung, Jakarta Timur 13940
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#F8F9F8]">
              <div className="w-8 h-8 rounded-xl bg-[#134E39] text-white flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">WhatsApp Admin Kelurahan</span>
                <p className="font-semibold text-slate-800 leading-snug mt-0.5">
                  {ADMIN_WHATSAPP_NUMBER} (Layanan Hari Kerja 08.00 - 16.00 WIB)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#F8F9F8]">
              <div className="w-8 h-8 rounded-xl bg-[#134E39] text-white flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Email Resmi</span>
                <p className="font-semibold text-slate-800 leading-snug mt-0.5">
                  halo@spotsini.id / kelurahan.penggilingan@jakarta.go.id
                </p>
              </div>
            </div>
          </div>

          {/* Verification Benefit notice */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-emerald-950">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Keuntungan Terdaftar di SpotSiNi:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Mendapatkan centang biru verifikasi resmi dari Kelurahan/RW</li>
              <li>Muncul di Peta Interaktif GPS Penggilingan</li>
              <li>Terhubung langsung via tombol WhatsApp tanpa perantara</li>
              <li>Dapat menerbitkan voucher reward loyalitas warga</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Multi-step Ajukan Usaha Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-950/10 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Formulir Pendaftaran
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Ajukan Usaha Mikro Anda
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Lengkapi data di bawah ini untuk diverifikasi oleh Pengurus RW & Admin Kelurahan Penggilingan.
            </p>
          </div>

          {/* Stepper Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className={`flex-1 text-center pb-1 text-xs font-extrabold border-b-2 transition-colors ${
              step >= 1 ? 'border-emerald-700 text-emerald-800' : 'border-slate-200 text-slate-400'
            }`}>
              1. Isi Profil Usaha
            </div>
            <div className={`flex-1 text-center pb-1 text-xs font-extrabold border-b-2 transition-colors flex items-center justify-center gap-1 ${
              step >= 2 ? 'border-emerald-700 text-emerald-800' : 'border-slate-200 text-slate-400'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Review & Validasi AI</span>
            </div>
            <div className={`flex-1 text-center pb-1 text-xs font-extrabold border-b-2 transition-colors ${
              step === 3 ? 'border-[#C85A32] text-[#C85A32]' : 'border-slate-200 text-slate-400'
            }`}>
              3. Konfirmasi
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: FORM INPUT */}
          {step === 1 && (
            <form onSubmit={handleNextToReview} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Pemilik Usaha
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ibu Ratu / Pak Budi"
                    value={namaPemilik}
                    onChange={(e) => setNamaPemilik(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Usaha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Konveksi Berkah Mandiri"
                    value={namaUsaha}
                    onChange={(e) => setNamaUsaha(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sektor Usaha <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={sektorUsaha}
                    onChange={(e) => setSektorUsaha(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50 font-medium"
                  >
                    <option value="Kuliner">Kuliner</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Perdagangan/Sembako">Perdagangan/Sembako</option>
                    <option value="Kriya & Konveksi">Kriya & Konveksi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Telepon / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0812-8734-7903"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Alamat Lengkap Usaha <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      Google Places Autocomplete
                    </span>
                  </div>
                  <input
                    ref={addressInputRef}
                    type="text"
                    required
                    placeholder="Ketik alamat atau cari di Google Maps..."
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                  />
                  {googlePlaceId ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Place ID: <strong>{googlePlaceId.slice(0, 16)}...</strong> • Lat/Lng: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGooglePlaceId('');
                          setLatitude(null);
                          setLongitude(null);
                        }}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Reset Titik
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ketik nama jalan atau pilih rekomendasi titik lokasi Kelurahan Penggilingan di bawah.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Wilayah RW <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rw}
                    onChange={(e) => setRw(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50 font-medium"
                  >
                    {availableRws.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick sample places in Penggilingan */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-700" />
                  <span>Rekomendasi Titik Lokasi Penggilingan:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PENGGILINGAN_PLACES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSamplePlace(p)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 text-left transition-colors font-medium shadow-2xs"
                    >
                      📍 {p.formatted_address.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Coordinate Override (Task 8 fallback: Place ID tidak ditemukan -> input manual) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowManualCoords(!showManualCoords)}
                  className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <span>{showManualCoords ? '▼ Sembunyikan Input Koordinat Manual' : '▶ Input Koordinat Manual (Jika Place ID Tidak Ditemukan)'}</span>
                </button>

                {showManualCoords && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-150">
                    <div>
                      <label className="block font-bold text-amber-950 mb-1">Latitude (Lintang)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="-6.2085"
                        value={latitude !== null ? latitude : ''}
                        onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-amber-950 mb-1">Longitude (Bujur)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="106.9420"
                        value={longitude !== null ? longitude : ''}
                        onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Produk / Layanan Unggulan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kaos sablon katun, seragam komunitas, jahit cepat"
                  value={produk}
                  onChange={(e) => setProduk(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tautan Google Maps / Foto Produk (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Tempel tautan Google Maps jika ada"
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#134E39] hover:bg-[#0E3B2B] text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Cek Validasi AI & Review Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: REVIEW DATA + AI ASSISTANT CARD */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* AI Assistant Advisory Card */}
              {aiResult && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-white shadow-md border border-emerald-700/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="font-extrabold text-xs sm:text-sm text-white">
                        Asistensi AI SpotSiNi
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      aiResult.quality_status === 'Data siap dikirim ke admin'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {aiResult.quality_status}
                    </span>
                  </div>

                  {/* Sektor recommendation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-emerald-900/60 p-3 rounded-xl border border-emerald-800/60">
                    <div>
                      <span className="text-emerald-300 block text-[11px]">Rekomendasi Klasifikasi Sektor:</span>
                      <strong className="text-amber-300 text-sm">{aiResult.recommended_sector}</strong>
                      <span className="text-emerald-200 text-[11px] ml-1">
                        ({Math.round(aiResult.confidence * 100)}% kecocokan kata kunci)
                      </span>
                    </div>

                    {sektorUsaha !== aiResult.recommended_sector && (
                      <button
                        type="button"
                        onClick={() => handleApplyAiSector(aiResult.recommended_sector)}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 self-start sm:self-auto shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Terapkan Rekomendasi</span>
                      </button>
                    )}
                  </div>

                  {/* Duplicate warning */}
                  {aiResult.is_duplicate && (
                    <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl text-xs text-amber-200">
                      ⚠️ <strong>Peringatan Potensi Duplikasi:</strong> Ditemukan usaha serupa yang sudah terdaftar ({aiResult.duplicate_candidates.join(', ')}). Pastikan Anda bukan mendaftarkan usaha yang sama.
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                      Catatan Kelayakan Dokumen:
                    </span>
                    <ul className="text-xs text-emerald-100/90 space-y-1">
                      {aiResult.suggestions.map((sug, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-amber-400">✓</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Data Summary */}
              <div className="p-5 rounded-2xl bg-[#F8F9F8] border border-slate-200 space-y-3 text-xs sm:text-sm">
                <div className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 text-sm flex items-center justify-between">
                  <span>Ringkasan Data Usaha</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Status Awal: Menunggu Verifikasi
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-slate-500">Nama Usaha:</span>
                  <span className="font-bold text-slate-900">{namaUsaha}</span>

                  <span className="text-slate-500">Nama Pemilik:</span>
                  <span className="font-bold text-slate-900">{namaPemilik || '-'}</span>

                  <span className="text-slate-500">Sektor Usaha:</span>
                  <span className="font-bold text-terracotta-500">{sektorUsaha}</span>

                  <span className="text-slate-500">Telepon / WhatsApp:</span>
                  <span className="font-bold text-slate-900">{telepon}</span>

                  <span className="text-slate-500">Wilayah:</span>
                  <span className="font-bold text-slate-900">{rw} ({rt})</span>

                  <span className="text-slate-500">Alamat Lengkap:</span>
                  <span className="font-medium text-slate-800">{alamat}</span>

                  <span className="text-slate-500">Produk Unggulan:</span>
                  <span className="font-medium text-slate-800">{produk || '-'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                ℹ️ <strong>Alur Verifikasi:</strong> Setelah konfirmasi, pengajuan akan masuk ke antrean <em>“Menunggu Verifikasi”</em> pada Panel Admin Kelurahan dan membuka WhatsApp untuk konfirmasi langsung.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Data</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="flex-1 py-3 rounded-2xl bg-[#C85A32] hover:bg-[#B84A22] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Kirim & Buka WhatsApp</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 3 && submittedBiz && (
            <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Pengajuan Berhasil Dikirim!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Usaha <strong>{submittedBiz.nama_usaha}</strong> telah tercatat dengan status <em>“Menunggu Verifikasi”</em>.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 text-left text-xs max-w-sm mx-auto space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Pengajuan:</span>
                  <span className="font-mono font-bold text-slate-800">{submittedBiz.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sektor:</span>
                  <span className="font-bold text-terracotta-500">{submittedBiz.sektor_usaha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wilayah:</span>
                  <span className="font-bold text-slate-800">{submittedBiz.rw}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Pengajuan:</span>
                  <span className="font-bold text-slate-800">{submittedBiz.tanggal_input}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow transition-colors"
                >
                  Ajukan Usaha Lainnya
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
