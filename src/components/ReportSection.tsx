import React, { useState } from 'react';
import { Business } from '../types/business';
import { FileText, Download, Printer, Filter, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportSectionProps {
  businesses: Business[];
}

export const ReportSection: React.FC<ReportSectionProps> = ({ businesses }) => {
  const [selectedFilterRw, setSelectedFilterRw] = useState<string>('Semua');

  // ONLY businesses with status "Terverifikasi" appear in the recap table & export
  const verifiedBusinesses = businesses.filter(b => b.status_verifikasi === 'Terverifikasi');

  const filtered = selectedFilterRw === 'Semua'
    ? verifiedBusinesses
    : verifiedBusinesses.filter(b => b.rw === selectedFilterRw);

  // Dynamic RW list from verified data
  const rws = Array.from(new Set(verifiedBusinesses.map(b => b.rw))).sort();

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const exportData = filtered.map((b, idx) => ({
      'No': idx + 1,
      'Nama Usaha Mikro': b.nama_usaha,
      'Nama Pemilik': b.nama_pemilik || '-',
      'Sektor': b.sektor_usaha,
      'Lokasi': `${b.rt}/${b.rw}`,
      'Alamat Lengkap': b.alamat_lengkap,
      'No. Telepon': b.no_telepon || '-',
      'Titik Koordinat': (b.latitude && b.longitude) ? `${b.latitude}, ${b.longitude}` : 'Belum Ada',
      'Status': b.status_verifikasi,
      'Tanggal Verifikasi': b.tanggal_verifikasi || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usaha Mikro Terverifikasi');

    // Generate buffer & trigger download
    XLSX.writeFile(workbook, `Rekapitulasi_Usaha_Mikro_Penggilingan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Trigger PDF print with clean print stylesheet
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <section id="cetak" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* SCREEN VIEW (Hidden on Print) */}
      <div className="no-print bg-white rounded-3xl p-6 sm:p-10 border border-emerald-950/10 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-forest-700 mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Dokumen Resmi Kelurahan</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pratinjau Rekapitulasi Data Usaha Mikro
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelurahan Penggilingan, Kecamatan Cakung, Kota Administrasi Jakarta Timur
            </p>
          </div>

          {/* Download Buttons from Mockup */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrintPdf}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#134E39] hover:bg-[#0E3B2B] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF (Logo PDF)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B84A22] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel (.XLSX)</span>
            </button>
          </div>
        </div>

        {/* Filter bar for Preview */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filter Wilayah:</span>
            <select
              value={selectedFilterRw}
              onChange={(e) => setSelectedFilterRw(e.target.value)}
              className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-forest-600"
            >
              <option value="Semua">Semua RW ({verifiedBusinesses.length})</option>
              {rws.map((rw) => (
                <option key={rw} value={rw}>
                  {rw}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Menampilkan <span className="text-slate-900 font-bold">{filtered.length}</span> entri terverifikasi
          </div>
        </div>

        {/* Table Preview matching Mockup Page 1 */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#134E39] text-white font-extrabold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Usaha Mikro</th>
                <th className="py-3.5 px-4">Sektor</th>
                <th className="py-3.5 px-4">Lokasi</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-600 text-center">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{item.nama_usaha}</div>
                    {item.nama_pemilik && item.nama_pemilik !== '-' && (
                      <div className="text-[11px] font-normal text-slate-500">Pemilik: {item.nama_pemilik}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700">{item.sektor_usaha}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {item.rt}/{item.rw}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {item.status_verifikasi}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL DOCUMENT VIEW (Formatted for high-res PDF generation) */}
      <div className="print-only p-8 bg-white text-black">
        {/* Official Kop Surat */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider">Pemerintah Provinsi Daerah Khusus Ibukota Jakarta</h2>
          <h3 className="text-base font-bold uppercase">Kota Administrasi Jakarta Timur • Kecamatan Cakung</h3>
          <h1 className="text-xl font-extrabold uppercase mt-1">Kantor Kelurahan Penggilingan</h1>
          <p className="text-xs mt-1">Jl. Penggilingan No. 1, RT 01/RW 07, Penggilingan, Kec. Cakung, Kota Jakarta Timur 13940</p>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-base font-bold uppercase underline">Rekapitulasi Data Usaha Mikro Terverifikasi (SpotSiNi)</h2>
          <p className="text-xs text-slate-700 mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
        </div>

        <table className="w-full text-left text-xs border border-black border-collapse">
          <thead>
            <tr className="bg-slate-200">
              <th className="border border-black p-2 text-center w-10">No</th>
              <th className="border border-black p-2">Nama Usaha Mikro</th>
              <th className="border border-black p-2">Pemilik</th>
              <th className="border border-black p-2">Sektor</th>
              <th className="border border-black p-2">Wilayah</th>
              <th className="border border-black p-2">Alamat & Kontak</th>
              <th className="border border-black p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black p-1.5 text-center font-bold">{index + 1}</td>
                <td className="border border-black p-1.5 font-bold">{item.nama_usaha}</td>
                <td className="border border-black p-1.5">{item.nama_pemilik || '-'}</td>
                <td className="border border-black p-1.5">{item.sektor_usaha}</td>
                <td className="border border-black p-1.5">{item.rt}/{item.rw}</td>
                <td className="border border-black p-1.5">{item.alamat_lengkap} ({item.no_telepon || '-'})</td>
                <td className="border border-black p-1.5 text-center font-semibold">{item.status_verifikasi}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Official Signatures */}
        <div className="mt-12 flex justify-between text-xs">
          <div className="text-center w-48">
            <p>Mengetahui,</p>
            <p className="font-bold">Lurah Penggilingan</p>
            <div className="h-16" />
            <p className="font-bold underline">(..............................................)</p>
            <p>NIP. .....................................</p>
          </div>
          <div className="text-center w-48">
            <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Admin Verifikasi SpotSiNi</p>
            <div className="h-16" />
            <p className="font-bold underline">( Tim Akselerator UKM )</p>
            <p>Penggilingan Digital</p>
          </div>
        </div>
      </div>

    </section>
  );
};
