import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Users, ShieldCheck, MapPin, Award } from 'lucide-react';

export const AboutUs: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section id="tentang" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-950/10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Visual / Graphic */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-tr from-[#134E39] to-[#1F7A5B] p-8 text-white flex flex-col justify-between aspect-square">
              <div className="space-y-2">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-emerald-100">
                  Kelurahan Penggilingan
                </span>
                <h3 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                  Gotong Royong Ekonomi Digital
                </h3>
              </div>

              {/* Graphic badges */}
              <div className="space-y-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C85A32] flex items-center justify-center font-bold text-sm">
                    14
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Cakupan Wilayah RW</div>
                    <div className="text-[10px] text-emerald-200">RW 01 hingga RW 14 Penggilingan</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">100% Data Tervalidasi</div>
                    <div className="text-[10px] text-emerald-200">Verifikasi lapangan bersama pengurus RW</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-emerald-200/80 italic">
                Cakung, Jakarta Timur • DKI Jakarta
              </div>
            </div>
          </div>

          {/* Right Column: Text matching Mockup Page 2 */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-forest-700">
              Tentang Kami
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Menjangkau yang Tersembunyi, Memajukan yang Ada
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              Platform pemetaan digital berbasis komunitas yang dirancang untuk mengakselerasi pendataan, 
              efisiensi akses informasi, dan visibilitas Usaha Kecil dan Menengah (UKM) di Kelurahan Penggilingan. 
              Kami hadir untuk menjembatani pelaku usaha lokal dengan masyarakat melalui integrasi data berbasis 
              lokasi (geotagging) yang akurat dan transparan, sekaligus mendorong digitalisasi inklusif demi 
              memperkuat ekosistem ekonomi kreatif di tingkat wilayah.
            </p>

            {/* Read More Accordion */}
            {expanded && (
              <div className="pt-4 border-t border-slate-100 space-y-4 text-xs sm:text-sm text-slate-600 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-emerald-950/5">
                    <div className="font-extrabold text-forest-700 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-forest-600" />
                      <span>Integritas Informasi</span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      Setiap data profil, kontak WhatsApp, dan koordinat GPS melalui peninjauan administratif sebelum dipublikasikan ke peta umum.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FDF6F2] border border-terracotta-100">
                    <div className="font-extrabold text-[#C85A32] mb-1 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#C85A32]" />
                      <span>Dukungan Komunitas</span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      Membantu usaha rumahan dan warung warga menjangkau pembeli di lingkungan sekitar tanpa biaya pendaftaran maupun potongan transaksi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#134E39] hover:bg-[#0E3B2B] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <span>{expanded ? 'Tutup Rincian' : 'Baca Selengkapnya'}</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
