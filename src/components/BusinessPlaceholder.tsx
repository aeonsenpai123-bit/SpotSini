import React from 'react';
import { BusinessSector } from '../types/business';
import { Utensils, Scissors, ShoppingBag, Wrench, Package } from 'lucide-react';

interface BusinessPlaceholderProps {
  businessName: string;
  sector: BusinessSector;
  className?: string;
}

export const BusinessPlaceholder: React.FC<BusinessPlaceholderProps> = ({
  businessName,
  sector,
  className = "w-full h-full"
}) => {
  // Sector color theme & icon
  const getSectorMeta = (s: BusinessSector) => {
    switch (s) {
      case 'Kuliner':
        return {
          bg: 'from-amber-700 to-amber-900',
          badgeBg: 'bg-amber-100 text-amber-900',
          icon: <Utensils className="w-8 h-8 text-amber-200" />
        };
      case 'Kriya & Konveksi':
        return {
          bg: 'from-blue-700 to-blue-900',
          badgeBg: 'bg-blue-100 text-blue-900',
          icon: <Scissors className="w-8 h-8 text-blue-200" />
        };
      case 'Perdagangan/Sembako':
        return {
          bg: 'from-emerald-700 to-emerald-900',
          badgeBg: 'bg-emerald-100 text-emerald-900',
          icon: <ShoppingBag className="w-8 h-8 text-emerald-200" />
        };
      case 'Jasa':
        return {
          bg: 'from-purple-700 to-purple-900',
          badgeBg: 'bg-purple-100 text-purple-900',
          icon: <Wrench className="w-8 h-8 text-purple-200" />
        };
      default:
        return {
          bg: 'from-slate-700 to-slate-900',
          badgeBg: 'bg-slate-100 text-slate-900',
          icon: <Package className="w-8 h-8 text-slate-200" />
        };
    }
  };

  const meta = getSectorMeta(sector);
  const initials = businessName
    .split(' ')
    .filter(w => w.length > 0)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${meta.bg} flex flex-col items-center justify-center p-4 text-center select-none ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-2 shadow-inner">
          {meta.icon}
        </div>
        <span className="text-xl font-black text-white/90 tracking-wider">
          {initials || 'UM'}
        </span>
        <span className="text-[10px] font-semibold text-white/70 uppercase tracking-widest mt-0.5">
          {sector}
        </span>
      </div>
    </div>
  );
};
