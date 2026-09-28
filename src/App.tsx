import React, { useState, useEffect, useMemo } from 'react';
import { Business, BusinessSector, VerificationStatus, User, AppNotification } from './types/business';
import { loadBusinesses, saveBusinesses, resetToSeedData } from './utils/storage';
import { getCurrentUser, logoutUser, updateUserPoints } from './utils/authService';
import { getNotifications, markNotificationRead } from './utils/notificationService';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HomePreview } from './components/HomePreview';
import { Catalog } from './components/Catalog';
import { InteractiveMap } from './components/InteractiveMap';
import { AboutUs } from './components/AboutUs';
import { ReportSection } from './components/ReportSection';
import { ContactAndSubmission } from './components/ContactAndSubmission';
import { AdminVerificationPanel } from './components/AdminVerificationPanel';
import { BusinessDetailModal } from './components/BusinessDetailModal';
import { AuthModal } from './components/AuthModal';
import { ReviewModal } from './components/ReviewModal';
import { UserDashboard } from './components/UserDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { RewardCenter } from './components/RewardCenter';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeTab, setActiveTab] = useState<string>('beranda');

  // Auth & Notifications
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => 
    getNotifications(currentUser?.id)
  );

  // Filter and search states
  const [selectedSector, setSelectedSector] = useState<BusinessSector | 'Semua'>('Semua');
  const [selectedRw, setSelectedRw] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Map Focus
  const [detailBusiness, setDetailBusiness] = useState<Business | null>(null);
  const [reviewingBusiness, setReviewingBusiness] = useState<Business | null>(null);
  const [focusedBusiness, setFocusedBusiness] = useState<Business | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const data = loadBusinesses();
    setBusinesses(data);

    // Read initial URL hash
    const validTabs = [
      'beranda', 'katalog', 'peta', 'reward-center', 
      'dashboard-user', 'dashboard-owner', 'tentang', 
      'kontak', 'cetak', 'admin'
    ];
    const hash = window.location.hash.replace('#', '');
    if (validTabs.includes(hash)) {
      setActiveTab(hash);
    }

    const handleHashChange = () => {
      const current = window.location.hash.replace('#', '');
      if (validTabs.includes(current)) {
        setActiveTab(current);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when tab changes
  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamically extract all unique RWs from dataset
  const availableRws = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => {
      if (b.rw && b.rw.trim() !== '') {
        set.add(b.rw.trim());
      }
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [businesses]);

  // Auth actions
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setNotifications(getNotifications(user.id));
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setNotifications(getNotifications());
    handleNavigate('beranda');
  };

  // Map synchronization: Locate business from card
  const handleLocateOnMap = (biz: Business) => {
    setFocusedBusiness(biz);
    handleNavigate('peta');
  };

  // Review submission trigger
  const handleOpenReview = (biz: Business) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setReviewingBusiness(biz);
  };

  const handleReviewSuccess = (earnedPoints: number) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, points_balance: prev.points_balance + earnedPoints } : null);
      setNotifications(getNotifications(currentUser.id));
    }
    // Refresh business data
    setBusinesses(loadBusinesses());
  };

  // Notification click handler
  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationRead(currentUser?.id, notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    if (notif.action_url) {
      const tab = notif.action_url.replace('#', '');
      handleNavigate(tab);
    }
  };

  // Handler for adding a new business from the Ajukan Usaha form
  const handleAddSubmission = (newBiz: Business) => {
    const updated = [newBiz, ...businesses];
    setBusinesses(updated);
    saveBusinesses(updated);
  };

  // Handler for Admin status update (Approve / Reject)
  const handleUpdateStatus = (id: string, newStatus: VerificationStatus, note?: string) => {
    const updated = businesses.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          status_verifikasi: newStatus,
          tanggal_verifikasi: newStatus === 'Terverifikasi' ? new Date().toISOString().slice(0, 10) : b.tanggal_verifikasi,
          diverifikasi_oleh: newStatus === 'Terverifikasi' ? 'Admin Kelurahan Penggilingan' : b.diverifikasi_oleh,
          catatan_perbaikan: note !== undefined ? note : b.catatan_perbaikan
        };
      }
      return b;
    });

    setBusinesses(updated);
    saveBusinesses(updated);
  };

  // Handler for Admin editing business details / coordinates
  const handleUpdateBusiness = (updatedBiz: Business) => {
    const updated = businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
    setBusinesses(updated);
    saveBusinesses(updated);
  };

  // Handler for resetting data back to initial seed
  const handleResetSeed = () => {
    const seed = resetToSeedData();
    setBusinesses(seed);
  };

  const pendingCount = businesses.filter(b => b.status_verifikasi === 'Menunggu Verifikasi').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F8] text-slate-900 selection:bg-forest-600 selection:text-white">
      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        pendingCount={pendingCount}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
      />

      <main className="flex-1">
        {/* TAB 1: BERANDA */}
        {activeTab === 'beranda' && (
          <div>
            <Hero
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSector={selectedSector}
              onSectorChange={setSelectedSector}
              selectedRw={selectedRw}
              onRwChange={setSelectedRw}
              availableRws={availableRws}
              onExploreClick={() => handleNavigate('katalog')}
              onContactClick={() => handleNavigate('kontak')}
            />

            {/* Side-by-side interactive preview */}
            <HomePreview
              businesses={businesses}
              onSelectBusiness={(biz) => setDetailBusiness(biz)}
              onExploreMore={() => handleNavigate('katalog')}
              onOpenFullMap={() => handleNavigate('peta')}
            />

            {/* Tentang Kami snippet */}
            <AboutUs />

            {/* Contact & Ajukan Usaha with AI Assistant */}
            <ContactAndSubmission
              onAddSubmission={handleAddSubmission}
              availableRws={availableRws}
              businesses={businesses}
            />
          </div>
        )}

        {/* TAB 2: KATALOG USAHA */}
        {activeTab === 'katalog' && (
          <div>
            <div className="bg-[#134E39] text-white py-8 px-4 text-center">
              <h1 className="text-2xl sm:text-4xl font-black">Katalog Usaha Mikro Penggilingan</h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                Eksplorasi lengkap direktori produk dan jasa warga di 14 RW dengan filter radius & rating
              </p>
            </div>

            <Catalog
              businesses={businesses}
              selectedSector={selectedSector}
              onSelectSector={setSelectedSector}
              selectedRw={selectedRw}
              onSelectRw={setSelectedRw}
              availableRws={availableRws}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectBusiness={(biz) => setDetailBusiness(biz)}
              onLocateOnMap={handleLocateOnMap}
              currentUser={currentUser}
              onRequireAuth={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {/* TAB 3: PETA INTERAKTIF */}
        {activeTab === 'peta' && (
          <InteractiveMap
            businesses={businesses}
            onSelectBusiness={(biz) => setDetailBusiness(biz)}
            availableRws={availableRws}
            focusedBusiness={focusedBusiness}
          />
        )}

        {/* TAB: REWARD CENTER */}
        {activeTab === 'reward-center' && (
          <RewardCenter
            currentUser={currentUser}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onNavigate={handleNavigate}
            onPointsUpdated={(newPts) => {
              if (currentUser) {
                setCurrentUser({ ...currentUser, points_balance: newPts });
              }
            }}
          />
        )}

        {/* TAB: USER DASHBOARD */}
        {activeTab === 'dashboard-user' && currentUser && (
          <UserDashboard
            currentUser={currentUser}
            businesses={businesses}
            onNavigate={handleNavigate}
            onSelectBusiness={(biz) => setDetailBusiness(biz)}
          />
        )}

        {/* TAB: OWNER DASHBOARD */}
        {activeTab === 'dashboard-owner' && currentUser && (
          <OwnerDashboard
            currentUser={currentUser}
            businesses={businesses}
            onNavigate={handleNavigate}
            onSelectBusiness={(biz) => setDetailBusiness(biz)}
            onUpdateBusiness={handleUpdateBusiness}
          />
        )}

        {/* TAB 4: TENTANG KAMI */}
        {activeTab === 'tentang' && (
          <div>
            <div className="bg-[#134E39] text-white py-8 px-4 text-center">
              <h1 className="text-2xl sm:text-4xl font-black">Tentang SpotSiNi</h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                Inisiatif Pemetaan & Akselerator Digitalisasi Usaha Mikro Kelurahan Penggilingan
              </p>
            </div>
            <AboutUs />
          </div>
        )}

        {/* TAB 5: CETAK PDF/EXCEL */}
        {activeTab === 'cetak' && (
          <ReportSection businesses={businesses} />
        )}

        {/* TAB 6: KONTAK & AJUKAN USAHA */}
        {activeTab === 'kontak' && (
          <div className="py-6">
            <ContactAndSubmission
              onAddSubmission={handleAddSubmission}
              availableRws={availableRws}
              businesses={businesses}
            />
          </div>
        )}

        {/* TAB 7: ADMIN VERIFICATION PANEL */}
        {activeTab === 'admin' && (
          <AdminVerificationPanel
            businesses={businesses}
            onUpdateStatus={handleUpdateStatus}
            onUpdateBusiness={handleUpdateBusiness}
            onResetSeed={handleResetSeed}
            onSelectBusinessModal={(biz) => setDetailBusiness(biz)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Detail Usaha Overlay Modal */}
      <BusinessDetailModal
        business={detailBusiness}
        isOpen={!!detailBusiness}
        onClose={() => setDetailBusiness(null)}
        currentUser={currentUser}
        onOpenReview={handleOpenReview}
        onRequireAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Modal (Register / Login / Demo Accounts) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleLoginSuccess}
      />

      {/* Review Modal (Rating 1-5, Photo, GPS verification) */}
      {reviewingBusiness && (
        <ReviewModal
          business={reviewingBusiness}
          isOpen={!!reviewingBusiness}
          onClose={() => setReviewingBusiness(null)}
          currentUser={currentUser}
          onReviewSubmitted={handleReviewSuccess}
          onRequireLogin={() => setIsAuthModalOpen(true)}
        />
      )}
    </div>
  );
};

export default App;
