import React, { useState } from 'react';
import { Menu, X, ShieldCheck, Bell, User as UserIcon, LogOut, Award, ChevronDown, FileText } from 'lucide-react';
import { User, AppNotification } from '../types/business';
import { NotificationCenter } from './NotificationCenter';
import { BrandMark } from './BrandMark';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  pendingCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  notifications: AppNotification[];
  onNotificationClick: (notif: AppNotification) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  pendingCount,
  currentUser,
  onOpenAuth,
  onLogout,
  notifications,
  onNotificationClick
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'katalog', label: 'Katalog Usaha' },
    { id: 'peta', label: 'Peta Interaktif' },
    { id: 'reward-center', label: 'Reward Center' },
    { id: 'tentang', label: 'Tentang Kami' },
    { id: 'faq', label: 'FAQ' },
    { id: 'kontak', label: 'Ajukan Usaha' },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
    setUserDropdownOpen(false);
  };

  const getDashboardTabForUser = (role: string) => {
    if (role === 'owner') return 'dashboard-owner';
    if (role === 'admin') return 'admin';
    return 'dashboard-user';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#134E39] border-b border-emerald-950/40 shadow-lg text-white no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Kelurahan Branding */}
          <button 
            onClick={() => onNavigate('beranda')}
            className="flex shrink-0 items-center gap-2 text-left group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            aria-label="SpotSiNi — Beranda"
          >
            <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl bg-white p-1 sm:p-1.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center border border-white/20">
              {/* spotsini-logo.png official logo */}
              <BrandMark />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  Spot<span className="text-[#EEB79D]">SiNi</span>
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-emerald-100 rounded-full border border-white/15">
                  Penggilingan
                </span>
              </div>
              <p className="hidden sm:block text-[10px] sm:text-xs text-emerald-200/70 -mt-0.5 line-clamp-1">
                Direktori & Peta Usaha Mikro
              </p>
            </div>
          </button>

          {/* Desktop Nav Items */}
          <nav className="spotsini-desktop-nav items-center gap-1" aria-label="Navigasi utama">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-sm font-bold'
                      : 'text-emerald-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                  {item.id === 'reward-center' && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase">
                      Poin
                    </span>
                  )}
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => handleItemClick('admin-rekapitulasi')}
                className={`px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'admin-rekapitulasi'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                    : 'bg-emerald-900/80 text-amber-200 hover:bg-emerald-800 hover:text-white border border-amber-300/40'
                }`}
                title="Akses Dokumen Rekapitulasi Resmi Khusus Admin"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>Rekapitulasi</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                  ADMIN
                </span>
              </button>
            )}
          </nav>

          {/* Right Action: Notifications & Auth User Pill */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-all focus:outline-none"
                title="Notifikasi & Rekomendasi"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse shadow">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <NotificationCenter
                notifications={notifications}
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
                onNotificationClick={(n) => {
                  setNotifOpen(false);
                  onNotificationClick(n);
                }}
              />
            </div>

            {/* User Profile or Login Trigger */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-emerald-950/70 hover:bg-emerald-950 border border-emerald-700/60 pl-2 pr-3 py-1.5 rounded-2xl transition-all focus:outline-none shadow-sm"
                >
                  <img
                    src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-amber-400/80"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white line-clamp-1 max-w-[100px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400 text-slate-900 uppercase">
                        {currentUser.role === 'customer' ? 'Warga' : currentUser.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-extrabold block">
                      🪙 {currentUser.points_balance} Poin
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 text-slate-800 animate-in fade-in duration-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900">{currentUser.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                      <div className="mt-1 text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <span>🪙 {currentUser.points_balance} Poin Komunitas</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => handleItemClick(getDashboardTabForUser(currentUser.role))}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {currentUser.role === 'customer'
                            ? 'Dashboard Warga & Voucher'
                            : currentUser.role === 'owner'
                            ? 'Dashboard Pemilik Usaha'
                            : 'Panel Admin Kelurahan'}
                        </span>
                      </button>

                      {currentUser.role !== 'admin' && (
                        <button
                          onClick={() => handleItemClick('reward-center')}
                          className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 flex items-center gap-2"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tukar Poin Hadiah</span>
                        </button>
                      )}

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleItemClick('admin')}
                            className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#C85A32]" />
                              <span>Panel Verifikasi Admin</span>
                            </div>
                            {pendingCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#C85A32] text-white rounded-full">
                                {pendingCount}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => handleItemClick('admin-rekapitulasi')}
                            className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-amber-50 text-amber-900 flex items-center gap-2"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>Panel Rekapitulasi Kelurahan</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#C85A32] hover:bg-[#B84A22] text-white shadow transition-all active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span><span className="sm:hidden">Masuk</span><span className="hidden sm:inline">Masuk / Akun</span></span>
              </button>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="spotsini-mobile-nav p-2 rounded-xl text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="spotsini-mobile-nav bg-[#0E3B2B] border-t border-white/10 px-4 pt-3 pb-5 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                activeTab === item.id
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{item.label}</span>
              {item.id === 'reward-center' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase">
                  Poin
                </span>
              )}
            </button>
          ))}

          {currentUser && (
            <div className="pt-2 border-t border-white/10 space-y-1">
              <button
                onClick={() => handleItemClick(getDashboardTabForUser(currentUser.role))}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-300 hover:bg-white/10 flex items-center justify-between"
              >
                <span>Dashboard ({currentUser.role})</span>
                <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                  🪙 {currentUser.points_balance} Poin
                </span>
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="pt-1 border-t border-white/10 space-y-1">
              <button
                onClick={() => handleItemClick('admin')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-200 hover:text-white hover:bg-white/10 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#EEB79D]" />
                  <span>Panel Verifikasi Admin</span>
                </span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#C85A32] text-white text-xs font-bold rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleItemClick('admin-rekapitulasi')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-amber-300 hover:bg-white/10 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Panel Rekapitulasi Kelurahan</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
