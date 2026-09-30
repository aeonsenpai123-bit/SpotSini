import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles, MapPin, Users, Clock, Award, Compass, MessageCircle } from 'lucide-react';

interface FAQItem {
  tag: string;
  tagColor: string;
  question: string;
  answer: string | string[];
  icon: React.ReactNode;
}

const FAQ_DATA: FAQItem[] = [
  {
    tag: 'WHAT',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    question: 'Apa itu SpotsIni?',
    answer:
      'SpotsIni adalah direktori digital lokal berbasis komunitas yang mengumpulkan ragam usaha UMKM di sekitar warga, dilengkapi integrasi ulasan nyata Google Maps serta sistem reward poin interaktif.',
    icon: <Compass className="w-5 h-5 text-emerald-700" />
  },
  {
    tag: 'WHY',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
    question: 'Mengapa harus menggunakan SpotsIni dibanding mencari langsung di Google Maps biasa?',
    answer:
      'SpotsIni mengkurasi UMKM tersembunyi (hidden gems) di lingkungan setempat yang sering kali luput dari algoritma besar, memverifikasi kunjungan nyata warga (≤100m), dan memberikan reward poin yang nyata setiap kali Anda mendukung usaha tetangga.',
    icon: <Sparkles className="w-5 h-5 text-amber-600" />
  },
  {
    tag: 'WHO',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
    question: 'Siapa saja yang bisa menggunakan dan diuntungkan oleh SpotsIni?',
    answer:
      'Semua orang: Warga dan pendatang yang mencari rekomendasi jasa atau kuliner tepercaya, pelanggan yang ingin dapat poin hadiah dari ulasannya, serta para pelaku usaha UMKM lokal yang ingin usahanya makin dikenal luas tanpa biaya iklan.',
    icon: <Users className="w-5 h-5 text-blue-600" />
  },
  {
    tag: 'WHERE',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
    question: 'Di mana saya bisa mengklaim poin dan menemukan lokasi usaha?',
    answer:
      'Anda dapat menjelajahi seluruh lokasi usaha di menu Katalog dan Peta Interaktif. Untuk klaim poin kunjungan, buka detail usaha saat Anda berada langsung di radius ≤100 meter dari lokasi fisik toko.',
    icon: <MapPin className="w-5 h-5 text-rose-600" />
  },
  {
    tag: 'WHEN',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
    question: 'Kapan reward poin diberikan ke akun saya?',
    answer:
      'Poin ulasan langsung masuk ke profil akun Anda begitu Anda menekan tombol \'Sinkronkan Rating Real-Time\' setelah memberikan ulasan di Google Maps. Poin kunjungan juga langsung masuk secara instan saat Anda berhasil check-in via GPS.',
    icon: <Clock className="w-5 h-5 text-purple-600" />
  },
  {
    tag: 'HOW',
    tagColor: 'bg-teal-100 text-teal-800 border-teal-300',
    question: 'Bagaimana cara kerja sinkronisasi ulasan Google Maps dan penukaran poinnya?',
    answer: [
      '1. Berikan rating/ulasan di Google Maps menggunakan akun Google Anda.',
      '2. Buka halaman usaha tersebut di SpotsIni dan klik tombol \'Sinkronkan Rating Real-Time\'.',
      '3. Sistem kami mencocokkan nama akun Anda dengan ulasan Google Maps terbaru. Jika cocok, poin langsung ditambahkan dan dapat Anda tukarkan dengan berbagai voucher serta benefit komunitas.'
    ],
    icon: <Award className="w-5 h-5 text-teal-700" />
  },
  {
    tag: 'CHANNEL',
    tagColor: 'bg-[#E7FCE8] text-[#134E39] border-[#25D366]',
    question: 'Bagaimana cara mendapatkan pembaruan info bazar dan program usaha mikro di Penggilingan?',
    answer:
      'Anda dapat mengikuti pembaruan rutin mengenai pelatihan, kegiatan bazar, dan promosi usaha lokal melalui tautan resmi WhatsApp Channel Usaha Mikro kami di https://whatsapp.com/channel/0029Vb9EfNKJZg449M0D5D3B.',
    icon: <MessageCircle className="w-5 h-5 text-[#25D366]" />
  }
];

interface FAQSectionProps {
  onNavigate?: (tab: string) => void;
}

const renderAnswerText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 hover:text-emerald-900 font-bold underline break-all inline-flex items-center gap-1"
        >
          <span>{part}</span>
        </a>
      );
    }
    return part;
  });
};

export const FAQSection: React.FC<FAQSectionProps> = ({ onNavigate }) => {
  // First item open by default
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleAccordion = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-[#F8F9F8] border-t border-slate-200/80 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-extrabold uppercase tracking-wider shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>Panduan Warga 5W + 1H</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Kenal Lebih Dekat dengan <span className="text-[#134E39]">Spots</span><span className="text-[#C85A32]">Ini</span> (FAQ)
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Pertanyaan seputar cara kerja, fitur, dan manfaat platform untuk warga.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndices.includes(index);

            return (
              <div
                key={item.tag}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-emerald-300 shadow-md ring-1 ring-emerald-300/40'
                    : 'border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className="w-full p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 text-left transition-colors hover:bg-slate-50/70"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/70">
                      {item.icon}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 flex-1">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border uppercase tracking-wider w-fit shrink-0 ${item.tagColor}`}>
                        [{item.tag}]
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {item.question}
                      </h3>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-emerald-100 text-emerald-800' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-1 text-slate-700 text-xs sm:text-sm leading-relaxed border-t border-slate-100">
                    <div className="pl-0 sm:pl-14">
                      {Array.isArray(item.answer) ? (
                        <div className="space-y-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/70">
                          {item.answer.map((step, sIdx) => (
                            <p key={sIdx} className="font-medium text-slate-800">
                              {renderAnswerText(step)}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 font-normal">
                          {renderAnswerText(item.answer)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Help & CTA Box */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#134E39] via-[#0E3B2B] to-[#134E39] text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-black flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Punya pertanyaan lain atau ingin mendaftarkan usaha Anda?</span>
            </h4>
            <p className="text-xs sm:text-sm text-emerald-100/90">
              Tim admin dan pendamping UMKM Kelurahan Penggilingan siap membantu proses kurasi dan digitalisasi usaha.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('kontak')}
                className="px-4 py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-extrabold text-xs sm:text-sm transition-all shadow hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>Ajukan Usaha Baru</span>
                <span>→</span>
              </button>
            )}
            <a
              href="https://wa.me/6281287654321?text=Halo%20Admin%20SpotsIni,%20saya%20ingin%20bertanya%20seputar%20platform"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-300" />
              <span>Tanya Admin Kelurahan</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
