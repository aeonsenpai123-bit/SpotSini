import { Business, BusinessSector, AiValidationResult } from '../types/business';

/**
 * AI Pre-Review Assistant according to Task 7:
 * 1. Klasifikasi kategori usaha
 * 2. Quality check (data lengkap, foto, deskripsi)
 * 3. Duplicate checking (kemiripan nama usaha)
 * 4. Rekomendasi ("Data siap dikirim ke admin" / "Perlu perbaikan")
 */
export function analyzeBusinessSubmission(
  submission: {
    namaUsaha: string;
    namaPemilik: string;
    sektorInput: BusinessSector;
    alamat: string;
    telepon: string;
    produk: string;
    fotoUrl?: string | null;
  },
  existingBusinesses: Business[]
): AiValidationResult {
  const suggestions: string[] = [];
  const textCorpus = `${submission.namaUsaha} ${submission.produk}`.toLowerCase();

  // 1. Sector Classification Logic
  let recommendedSector: BusinessSector = submission.sektorInput;
  let confidence = 0.85;

  const kulinerKeywords = ['nasi', 'ayam', 'bebek', 'kopi', 'martabak', 'seblak', 'bakso', 'mie', 'cireng', 'rujak', 'gorengan', 'kebab', 'es teler', 'gulai', 'sate', 'kuliner', 'warteg', 'makan'];
  const kriyaKeywords = ['konveksi', 'jahit', 'bordir', 'sablon', 'kaos', 'seragam', 'kain', 'kriya', 'tas', 'kebaya'];
  const sembakoKeywords = ['sembako', 'toko', 'beras', 'minyak', 'kelontong', 'telur', 'warung sembako'];
  const jasaKeywords = ['laundry', 'londre', 'bengkel', 'cuci', 'servis', 'dinamo', 'tambal', 'potong rambut', 'barber', 'salon'];

  const countMatches = (keywords: string[]) => keywords.filter(k => textCorpus.includes(k)).length;

  const kulinerScore = countMatches(kulinerKeywords);
  const kriyaScore = countMatches(kriyaKeywords);
  const sembakoScore = countMatches(sembakoKeywords);
  const jasaScore = countMatches(jasaKeywords);

  const maxScore = Math.max(kulinerScore, kriyaScore, sembakoScore, jasaScore);
  if (maxScore > 0) {
    if (kulinerScore === maxScore) recommendedSector = 'Kuliner';
    else if (kriyaScore === maxScore) recommendedSector = 'Kriya & Konveksi';
    else if (sembakoScore === maxScore) recommendedSector = 'Perdagangan/Sembako';
    else if (jasaScore === maxScore) recommendedSector = 'Jasa';
    confidence = 0.95;
  }

  // 2. Duplicate Checking
  const duplicates: string[] = [];
  const cleanInputName = submission.namaUsaha.toLowerCase().replace(/[^a-z0-9]/g, '');

  existingBusinesses.forEach(b => {
    const cleanExisting = b.nama_usaha.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanInputName.length > 3 && (cleanExisting.includes(cleanInputName) || cleanInputName.includes(cleanExisting))) {
      duplicates.push(`${b.nama_usaha} (${b.rw})`);
    }
  });

  const isDuplicate = duplicates.length > 0;
  if (isDuplicate) {
    suggestions.push(`Terdeteksi kemungkinan duplikasi dengan: ${duplicates.join(', ')}. Pastikan bukan usaha yang sama.`);
  }

  // 3. Quality Checks
  let isComplete = true;

  if (submission.namaUsaha.trim().length < 3) {
    suggestions.push('Nama usaha terlalu singkat.');
    isComplete = false;
  }

  if (!submission.alamat.toLowerCase().includes('rw')) {
    suggestions.push('Disarankan menyertakan nomor RW (misal: RW 06) pada alamat agar otomatis terdeteksi peta.');
  }

  if (submission.produk.trim().length < 5) {
    suggestions.push('Deskripsi produk/layanan disarankan lebih mendetail (minimal sebutkan 2 menu/produk andalan).');
  }

  if (!submission.fotoUrl || submission.fotoUrl.trim() === '') {
    suggestions.push('Belum ada foto usaha. Sistem akan memasang placeholder resmi, namun foto asli sangat disarankan untuk menarik pelanggan.');
  }

  // 4. Recommendation
  const qualityStatus = (!isDuplicate && isComplete) 
    ? 'Data siap dikirim ke admin' 
    : 'Perlu perbaikan';

  return {
    recommended_sector: recommendedSector,
    confidence,
    quality_status: qualityStatus,
    is_duplicate: isDuplicate,
    duplicate_candidates: duplicates,
    suggestions
  };
}
