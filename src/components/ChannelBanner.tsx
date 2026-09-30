import React from 'react';
import { ExternalLink, Sparkles, Megaphone, CalendarCheck, ShieldCheck } from 'lucide-react';

interface ChannelBannerProps {
  className?: string;
}

export const ChannelBanner: React.FC<ChannelBannerProps> = ({ className = '' }) => {
  const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb9EfNKJZg449M0D5D3B';

  return (
    <section className={`py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3E2E] via-[#134E39] to-[#0A2D21] border border-emerald-500/20 shadow-xl text-white p-6 sm:p-10 lg:p-12">
        {/* Decorative background glow & shapes */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Left Text Content */}
          <div className="space-y-4 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-xs font-bold text-emerald-200 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <span className="tracking-wide uppercase text-[11px]">Saluran Resmi WhatsApp Warga</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Tumbuh Bersama Channel Usaha Mikro Penggilingan
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
              Wadahi informasi pelatihan, bazar warga, dan pembaruan program promosi lokal langsung di channel resmi kami.
            </p>

            {/* Sub-text Info */}
            <p className="text-xs sm:text-sm text-emerald-200/75 italic">
              Terbuka untuk seluruh pelaku usaha mikro dan warga Penggilingan untuk mendapatkan update berkala.
            </p>

            {/* Benefit Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-emerald-100 font-medium">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
                <Megaphone className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Info Bazar & Pelatihan</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
                <CalendarCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Agenda Komunitas</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-[#EEB79D] shrink-0" />
                <span>Terhubung Kelurahan</span>
              </div>
            </div>
          </div>

          {/* Right Action / CTA Card */}
          <div className="lg:shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-3">
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 transition-all text-center"
            >
              {/* WhatsApp Icon SVG */}
              <svg
                className="w-6 h-6 fill-current text-slate-950 shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>Gabung Channel WhatsApp Usaha Mikro</span>
              <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-200/80 font-medium text-center">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Gratis & Bebas Spam • Tanpa Perlu Simpan Nomor</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
