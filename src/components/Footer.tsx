import React from 'react';
import { MapPin, Heart, ShieldCheck } from 'lucide-react';
import { BrandMark } from './BrandMark';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0A2D21] text-white border-t border-emerald-950/60 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center border border-white/20">
                {/* spotsini-logo.png official branding */}
                <BrandMark />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-white">
                    Spot<span className="text-[#EEB79D]">SiNi</span>
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-white/10 text-emerald-200 rounded-full">
                    Penggilingan
                  </span>
                </div>
                <p className="text-[10px] text-emerald-300 font-semibold tracking-wider uppercase">
                  Direktori Digital Usaha Mikro
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-200/80 max-w-md leading-relaxed">
              Platform Akselerator Pemetaan Digital untuk Efisiensi Akses Data dan Integritas Informasi Usaha Mikro Kelurahan Penggilingan, Kecamatan Cakung, Jakarta Timur.
            </p>
            <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-900/60 inline-block">
              <p className="text-xs italic text-[#EEB79D] font-bold">
                "Menjangkau yang Tersembunyi, Memajukan yang Ada"
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Navigasi Halaman
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100/70 font-medium">
              <li>
                <button onClick={() => onNavigate('beranda')} className="hover:text-white transition-colors">
                  Beranda Utama
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('katalog')} className="hover:text-white transition-colors">
                  Katalog Usaha Mikro
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('peta')} className="hover:text-white transition-colors">
                  Peta Interaktif Wilayah
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tentang')} className="hover:text-white transition-colors">
                  Tentang SpotSiNi
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors">
                  Tanya Jawab (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cetak')} className="hover:text-white transition-colors">
                  Cetak Rekapitulasi (PDF/Excel)
                </button>
              </li>
            </ul>
          </div>

          {/* Administration & Internal */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Pengelolaan Data
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100/70 font-medium">
              <li>
                <button onClick={() => onNavigate('kontak')} className="hover:text-white transition-colors">
                  Ajukan Usaha Baru
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors flex items-center gap-1.5 text-[#EEB79D]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Panel Verifikasi Admin</span>
                </button>
              </li>
              <li>
                <a href="https://kel-penggilingan.jakarta.go.id" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Portal Resmi Kelurahan
                </a>
              </li>
            </ul>
          </div>

        </div>

        <hr className="border-emerald-900/50 my-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-200/60 gap-3">
          <p>© {new Date().getFullYear()} SpotSiNi Kelurahan Penggilingan. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">
            <span>Dikelola bersama komunitas RW 01 – RW 14 Penggilingan, Cakung, Jakarta Timur</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
