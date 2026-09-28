import React, { useState, useEffect } from 'react';
import { User, Business, Voucher, Review, BusinessImage, BusinessImageType } from '../types/business';
import { getVouchers, createOwnerVoucher } from '../utils/rewardService';
import { getReviewsForBusiness } from '../utils/reviewService';
import { 
  getImagesForBusiness, addBusinessImage, deleteBusinessImage, 
  validateImageFile, compressImageFile 
} from '../utils/imageService';
import { 
  Camera, Upload, Trash2, CheckCircle2, Image as ImageIcon, 
  Star, Tag, Sparkles, AlertCircle, Eye, ArrowRight 
} from 'lucide-react';

interface OwnerDashboardProps {
  currentUser: User;
  businesses: Business[];
  onNavigate: (tab: string) => void;
  onSelectBusiness: (biz: Business) => void;
  onUpdateBusiness?: (updated: Business) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentUser,
  businesses,
  onNavigate,
  onSelectBusiness,
  onUpdateBusiness
}) => {
  // Find owner's business (e.g., Konveksi Ibu Ratu or match owner_id)
  const myBusiness = businesses.find(b => b.owner_id === currentUser.id) || businesses[0];
  const [activeTab, setActiveTab] = useState<'photos' | 'rewards' | 'reviews' | 'profile' | 'tips'>('photos');
  const [vouchers, setVouchers] = useState<Voucher[]>(() => getVouchers());
  const [businessReviews] = useState<Review[]>(() => (myBusiness ? getReviewsForBusiness(myBusiness.id) : []));

  // Business Images State (Task 2: Real Time Business Image Upload)
  const [businessImages, setBusinessImages] = useState<BusinessImage[]>(() => 
    myBusiness ? getImagesForBusiness(myBusiness.id) : []
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<BusinessImageType>('utama');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form states for creating new voucher partnership
  const [vTitle, setVTitle] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vDiscount, setVDiscount] = useState('');
  const [vPoints, setVPoints] = useState(50);
  const [vStock, setVStock] = useState(25);
  const [vExpiry, setVExpiry] = useState('2026-12-31');
  const [formSuccess, setFormSuccess] = useState(false);

  // Sync images when business changes
  useEffect(() => {
    if (myBusiness) {
      setBusinessImages(getImagesForBusiness(myBusiness.id));
    }
  }, [myBusiness?.id]);

  if (!myBusiness) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900">Belum Ada Profil Usaha Terhubung</h2>
        <p className="text-sm text-gray-500 mt-2">Hubungi admin SpotSiNi untuk menautkan usaha Anda ke akun pemilik ini.</p>
      </div>
    );
  }

  const growthScore = myBusiness.growth_score || 88;
  const ratingAvg = myBusiness.google_rating || myBusiness.rating_avg || 4.8;
  const reviewCount = myBusiness.google_review_count || myBusiness.review_count || 12;
  const viewCount = myBusiness.view_count || 540;
  const myVouchers = vouchers.filter(v => v.business_id === myBusiness?.id);

  // Handle File Input Selection & Live Preview with Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    // Validate size & format (Task 2)
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Berkas gambar tidak valid.');
      setSelectedFile(null);
      setPreviewDataUrl(null);
      return;
    }

    try {
      setSelectedFile(file);
      // Generate compressed preview
      const compressed = await compressImageFile(file, 900, 0.75);
      setPreviewDataUrl(compressed);
    } catch (err: any) {
      setUploadError('Gagal memproses gambar untuk pratinjau.');
    }
  };

  // Handle Save Image with Real-Time Progress Indicator
  const handleSaveImage = () => {
    if (!previewDataUrl || !myBusiness) return;

    setIsUploading(true);
    setUploadProgress(15);
    setUploadError(null);

    // Progress animation
    const timer1 = setTimeout(() => setUploadProgress(55), 180);
    const timer2 = setTimeout(() => setUploadProgress(85), 360);
    const timer3 = setTimeout(() => {
      setUploadProgress(100);

      // Save to business_images table in localStorage
      const newImg = addBusinessImage({
        businessId: myBusiness.id,
        imageUrl: previewDataUrl,
        imageType: selectedImageType
      });

      // Update business main photo if type is 'utama'
      if (selectedImageType === 'utama') {
        const updatedBiz: Business = {
          ...myBusiness,
          foto_usaha: previewDataUrl
        };
        if (onUpdateBusiness) {
          onUpdateBusiness(updatedBiz);
        }
      }

      setBusinessImages(getImagesForBusiness(myBusiness.id));
      setIsUploading(false);
      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewDataUrl(null);
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleDeleteImage = (imgId: string) => {
    deleteBusinessImage(imgId);
    setBusinessImages(getImagesForBusiness(myBusiness.id));
  };

  const handleSetMainPhoto = (img: BusinessImage) => {
    const updatedBiz: Business = {
      ...myBusiness,
      foto_usaha: img.image_url
    };
    if (onUpdateBusiness) {
      onUpdateBusiness(updatedBiz);
    }
    // Update image types
    addBusinessImage({
      businessId: myBusiness.id,
      imageUrl: img.image_url,
      imageType: 'utama'
    });
    setBusinessImages(getImagesForBusiness(myBusiness.id));
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vTitle || !vDiscount) return;

    const newV = createOwnerVoucher({
      businessId: myBusiness.id,
      businessName: myBusiness.nama_usaha,
      businessSector: myBusiness.sektor_usaha,
      title: vTitle,
      description: vDesc || `Dapatkan penawaran khusus dari ${myBusiness.nama_usaha}`,
      discountValue: vDiscount,
      pointsRequired: Number(vPoints),
      stock: Number(vStock),
      validUntil: vExpiry
    });

    setVouchers(prev => [newV, ...prev]);
    setFormSuccess(true);
    setVTitle('');
    setVDesc('');
    setVDiscount('');
    setTimeout(() => setFormSuccess(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Owner Overview */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 border-2 border-amber-400 flex items-center justify-center shadow-md overflow-hidden">
              {myBusiness.foto_usaha ? (
                <img 
                  src={myBusiness.foto_usaha} 
                  alt={myBusiness.nama_usaha}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-3xl">🏪</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Pelaku Usaha Mikro (Owner)
                </span>
                <span className="text-xs text-emerald-200">
                  {myBusiness.sektor_usaha} • {myBusiness.rw}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{myBusiness.nama_usaha}</h1>
              <p className="text-xs text-emerald-200">Pemilik: {myBusiness.nama_pemilik} ({currentUser.name})</p>
            </div>
          </div>

          {/* Growth score pill */}
          <div className="bg-emerald-900/80 backdrop-blur-md px-5 py-4 rounded-2xl border border-emerald-700/60 shadow-inner flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex flex-col items-center justify-center text-amber-300">
              <span className="text-xl font-extrabold">{growthScore}%</span>
              <span className="text-[9px] uppercase tracking-wider text-amber-200">Score</span>
            </div>
            <div>
              <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Skor Pertumbuhan Usaha</p>
              <p className="text-xs text-emerald-100 mt-0.5">Tingkat visibilitas tinggi di Penggilingan</p>
            </div>
          </div>
        </div>

        {/* Real-time stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-800/60 text-sm">
          <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/40">
            <span className="text-emerald-300 text-xs block font-medium">Tayangan Profil</span>
            <span className="text-xl font-bold">{viewCount} <span className="text-xs text-emerald-300 font-normal">pengunjung</span></span>
          </div>
          <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/40">
            <span className="text-emerald-300 text-xs block font-medium">Rating Google Maps</span>
            <span className="text-xl font-bold text-amber-300">⭐ {ratingAvg} <span className="text-xs text-emerald-300 font-normal">({reviewCount})</span></span>
          </div>
          <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/40">
            <span className="text-emerald-300 text-xs block font-medium">Status Verifikasi</span>
            <span className="text-base font-bold text-emerald-300">✓ {myBusiness.status_verifikasi}</span>
          </div>
          <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/40">
            <span className="text-emerald-300 text-xs block font-medium">Foto Terunggah</span>
            <span className="text-xl font-bold">{businessImages.length} <span className="text-xs text-emerald-300 font-normal">foto</span></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto mb-8 pb-1">
        {/* Task 2: Dedicated Photo Upload Menu */}
        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'photos'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-700" />
          <span>Kelola Foto Usaha</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {businessImages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rewards'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>🎟️</span>
          <span>Kemitraan Reward & Voucher</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {myVouchers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>⭐</span>
          <span>Ulasan Warga</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
            {businessReviews.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>📋</span>
          <span>Data Usaha Saya</span>
        </button>

        <button
          onClick={() => setActiveTab('tips')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tips'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>💡</span>
          <span>Tips Pertumbuhan</span>
        </button>
      </div>

      {/* TAB: KELOLA FOTO USAHA (Task 2) */}
      {activeTab === 'photos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Upload Form Box */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Camera className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-gray-900">Upload Foto Usaha Real-Time</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Foto yang diunggah akan langsung muncul pada <strong>katalog usaha</strong>, <strong>modal detail</strong>, dan <strong>popup Google Maps</strong>.
              </p>
            </div>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Foto berhasil disimpan dan langsung aktif di profil UMKM Anda!</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* 1. Pilih Kategori Foto */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Kategori Foto <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'utama', label: '1. Foto Utama', desc: 'Thumbnail di katalog & map' },
                  { id: 'produk', label: '2. Foto Produk', desc: 'Menu / produk unggulan' },
                  { id: 'tempat', label: '3. Foto Tempat', desc: 'Tampak depan toko / ruko' },
                  { id: 'gallery', label: '4. Gallery Usaha', desc: 'Aktivitas & suasana toko' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedImageType(cat.id as BusinessImageType)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedImageType === cat.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold block">{cat.label}</span>
                    <span className="text-[10px] text-gray-400 block leading-tight">{cat.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. File Input & Drag/Drop Area */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Pilih Berkas Gambar
              </label>
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl cursor-pointer bg-gray-50/60 hover:bg-emerald-50/30 transition-all p-4 text-center">
                <Upload className="w-7 h-7 text-gray-400 mb-2" />
                <span className="text-xs font-semibold text-gray-700">
                  {selectedFile ? selectedFile.name : 'Klik untuk memilih atau seret gambar'}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Mendukung JPG, JPEG, PNG, WEBP (Maksimal 5 MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* 3. Live Image Preview */}
            {previewDataUrl && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Pratinjau Gambar Terkompresi:</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Kompresi Canvas Otomatis (~50 KB)
                  </span>
                </div>
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-200 bg-slate-900">
                  <img
                    src={previewDataUrl}
                    alt="Pratinjau upload"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">
                    Kategori: {selectedImageType}
                  </div>
                </div>

                {/* Progress Bar Indicator (Task 2) */}
                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-gray-600">
                      <span>Mengunggah & Menyimpan...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-200 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleSaveImage}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sedang Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan & Terapkan Foto Ini</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Photo Gallery Grid */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Daftar Foto Usaha Aktif</h3>
                <p className="text-xs text-gray-500">
                  Total {businessImages.length} foto terpasang di direktori publik SpotSiNi.
                </p>
              </div>
              <button
                onClick={() => onSelectBusiness(myBusiness)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1"
              >
                <span>Lihat Tampilan Publik</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {businessImages.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-800">Belum Ada Foto Terunggah</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Unggah foto tempat usaha, produk andalan, atau banner utama menggunakan form di sebelah kiri.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {businessImages.map(img => (
                  <div
                    key={img.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="relative w-full h-40 bg-gray-100">
                      <img
                        src={img.image_url}
                        alt="Foto usaha"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow ${
                          img.image_type === 'utama'
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-black/60 text-white backdrop-blur-xs'
                        }`}>
                          {img.image_type === 'utama' ? '★ Foto Utama' : img.image_type}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white shadow transition-colors"
                        title="Hapus foto ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-400">ID: {img.id.slice(0, 12)}</span>
                      {img.image_type !== 'utama' && (
                        <button
                          type="button"
                          onClick={() => handleSetMainPhoto(img)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          Jadikan Utama
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab: Rewards (Existing Tab 1) */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create voucher form */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-bold text-gray-900">Buat Voucher Promosi</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Tawarkan diskon untuk menarik warga datang ke toko Anda. Voucher baru berstatus <span className="font-semibold text-amber-600">Pending Admin</span> dan akan ditinjau Admin sebelum tayang di Reward Center.
            </p>

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <span>✓</span>
                <span>Voucher berhasil didaftarkan! Menunggu verifikasi Admin SpotSiNi.</span>
              </div>
            )}

            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Judul Voucher / Tawaran *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Potongan Rp10.000 Pembelian Min. 50rb"
                  value={vTitle}
                  onChange={e => setVTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nominal Diskon / Manfaat *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Diskon 20% atau Rp15.000"
                  value={vDiscount}
                  onChange={e => setVDiscount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Poin Diperlukan *</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={vPoints}
                    onChange={e => setVPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kuota Stok *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={vStock}
                    onChange={e => setVStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Berlaku Hingga</label>
                <input
                  type="date"
                  value={vExpiry}
                  onChange={e => setVExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Catatan Tambahan Syarat & Ketentuan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Hanya berlaku untuk makan di tempat, tunjukkan kode ke kasir."
                  value={vDesc}
                  onChange={e => setVDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition-all hover:scale-[1.01]"
              >
                Ajukan Voucher ke Admin
              </button>
            </form>
          </div>

          {/* List of active & pending vouchers */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Daftar Voucher Usaha Anda</h2>
            <p className="text-xs text-gray-500 mb-5">
              Kelola penawaran yang sudah terdaftar di platform SpotSiNi.
            </p>

            {myVouchers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <div className="text-3xl mb-2">🏷️</div>
                <h3 className="text-sm font-bold text-gray-800">Belum Ada Voucher</h3>
                <p className="text-xs text-gray-500 mt-1">Gunakan formulir di samping untuk mengajukan voucher promosi pertama Anda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myVouchers.map(v => (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          v.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {v.status === 'Active' ? '✓ Aktif di Reward Center' : '⏳ Pending Persetujuan Admin'}
                        </span>
                        <span className="text-xs text-gray-400">ID: {v.id}</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{v.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{v.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                          Diskon: {v.discount_value}
                        </span>
                        <span className="font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                          🪙 {v.points_required} Poin
                        </span>
                        <span>Sisa Kuota: <strong>{v.stock}</strong></span>
                        <span>Hingga: {v.valid_until}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Reviews (Existing Tab 2) */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ulasan dari Warga & Pengunjung</h2>
              <p className="text-xs text-gray-500">Transparan dari pembeli yang mengunjungi toko Anda di Penggilingan.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-500">⭐ {ratingAvg}</span>
              <span className="text-xs text-gray-400 block">{reviewCount} Total Ulasan</span>
            </div>
          </div>

          {businessReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-3xl block mb-2">💬</span>
              <p className="text-sm">Belum ada ulasan yang masuk untuk usaha ini.</p>
              <p className="text-xs text-gray-400 mt-1">Ajak pelanggan Anda yang berkunjung untuk menulis review di SpotSiNi!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {businessReviews.map(r => (
                <div key={r.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {r.user_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{r.user_name}</span>
                          {r.is_verified_visit && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                              ✓ Kunjungan Terverifikasi GPS
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{r.created_at}</span>
                      </div>
                    </div>
                    <div className="text-amber-500 text-xs font-bold">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{r.comment}</p>
                  {r.proof_photo_url && (
                    <img
                      src={r.proof_photo_url}
                      alt="Bukti kunjungan"
                      className="w-24 h-24 rounded-lg object-cover border border-gray-200 mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile (Existing Tab 3) */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Informasi Profil Usaha</h2>
            <button
              onClick={() => onSelectBusiness(myBusiness)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
            >
              Lihat di Katalog →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nama Usaha</span>
              <div className="p-3 bg-gray-50 rounded-xl font-bold text-gray-900 border border-gray-200">{myBusiness.nama_usaha}</div>
            </div>

            <div>
              <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">Pemilik</span>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-800 border border-gray-200">{myBusiness.nama_pemilik}</div>
            </div>

            <div>
              <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">Wilayah RW / RT</span>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-800 border border-gray-200">{myBusiness.rw} / {myBusiness.rt}</div>
            </div>

            <div>
              <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">WhatsApp Terdaftar</span>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-emerald-800 border border-gray-200">{myBusiness.no_telepon}</div>
            </div>

            <div className="sm:col-span-2">
              <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">Alamat Lengkap</span>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-800 border border-gray-200">{myBusiness.alamat_lengkap}</div>
            </div>

            <div className="sm:col-span-2">
              <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">Produk & Layanan Unggulan</span>
              <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-800 border border-gray-200">{myBusiness.produk}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tips (Existing Tab 4) */}
      {activeTab === 'tips' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm max-w-3xl space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tips Meningkatkan Kunjungan UMKM di SpotSiNi</h2>
          
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <h3 className="font-bold text-sm text-emerald-950">1. Unggah Foto Asli Toko & Produk</h3>
            <p>Usaha dengan foto produk berkualitas tinggi dan tampak depan toko mendapatkan tayangan 3x lebih banyak di SpotSiNi.</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <h3 className="font-bold text-sm text-amber-950">2. Ajak Pelanggan Memberikan Review Terverifikasi</h3>
            <p>Saat pelanggan berbelanja di tempat (radius 100m), ingatkan mereka membuka SpotSiNi dan menekan tombol "Saya Berkunjung". Pelanggan mendapat +20 poin, dan rating toko Anda semakin naik!</p>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
            <h3 className="font-bold text-sm text-teal-950">3. Pastikan Nomor WhatsApp Selalu Responsif</h3>
            <p>SpotSiNi mengarahkan calon pembeli langsung ke WhatsApp tanpa biaya admin. Balas pesan warga dengan ramah dan cepat.</p>
          </div>
        </div>
      )}
    </div>
  );
};
