import React from 'react';
import { Store, Database, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSupabaseModal,
  isSupabaseConnected,
  onGoHome,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#fffbf7]/90 backdrop-blur-md border-b border-[#ffe0cc] pt-safe shadow-xs">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left focus:outline-hidden group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C2500A] to-[#a8400a] text-white flex items-center justify-center shadow-md group-active:scale-95 transition-transform">
            <Store className="w-5 h-5 text-[#f7b0eb]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-[#C2500A]">
                A Generative Slice
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#E8621A]" />
            </div>
            <p className="text-[10px] text-[#7c6354] font-medium tracking-wide uppercase">
              Event Concierge
            </p>
          </div>
        </button>

        {/* Database & Profile Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
              isSupabaseConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-[#fff0e6] text-[#C2500A] border-[#f5c9a8] hover:bg-[#ffe0cc]'
            }`}
            title="Database Sync Status"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSupabaseConnected ? 'Supabase Connected' : 'Local / Supabase'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
