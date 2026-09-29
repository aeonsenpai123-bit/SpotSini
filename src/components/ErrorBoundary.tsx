import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrandMark } from './BrandMark';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SpotSiNi Uncaught UI Exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9F8] p-4 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#134E39] border border-emerald-200 mx-auto flex items-center justify-center p-2 shadow-sm">
              <BrandMark />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Kendala Pemulihan Sistem</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Spot<span className="text-[#C85A32]">SiNi</span> Penggilingan
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Halaman sedang dipulihkan secara otomatis. Silakan muat ulang atau kembali ke beranda direktori.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-[#134E39] hover:bg-[#0E3B2B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
