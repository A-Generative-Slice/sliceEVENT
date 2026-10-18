import React from 'react';
import { Home, PlusCircle, CheckCircle2, Database, Store, Sparkles, Headphones } from 'lucide-react';

export type NavTab = 'home' | 'create' | 'completed' | 'support' | 'supabase';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseModal: () => void;
  onOpenSupportModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  isSupabaseConnected,
  onOpenSupabaseModal,
  onOpenSupportModal,
}) => {
  return (
    <>
      {/* Desktop / PC Navbar (Hidden on Mobile) */}
      <nav className="hidden md:block sticky top-0 z-50 bg-[#fffbf7]/90 backdrop-blur-md border-b border-[#ffe0cc] shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 text-left focus:outline-hidden group"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#ffffff] border border-[#ffe0cc] p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden">
              <img
                src="agenerativeslicelogo.jpg"
                alt="SliceEVENT Logo"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#C2500A]">
                  SliceEVENT
                </span>
                <Sparkles className="w-4 h-4 text-[#E8621A]" />
              </div>
              <p className="text-[11px] text-[#7c6354] font-semibold tracking-wider uppercase">
                Event Concierge & Stall Manager
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                currentTab === 'home'
                  ? 'bg-[#C2500A] text-white shadow-xs'
                  : 'text-[#4a3b30] hover:bg-[#fff0e6] hover:text-[#C2500A]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onSelectTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                currentTab === 'create'
                  ? 'bg-[#C2500A] text-white shadow-xs'
                  : 'text-[#4a3b30] hover:bg-[#fff0e6] hover:text-[#C2500A]'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </button>

            <button
              onClick={() => onSelectTab('completed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                currentTab === 'completed'
                  ? 'bg-[#C2500A] text-white shadow-xs'
                  : 'text-[#4a3b30] hover:bg-[#fff0e6] hover:text-[#C2500A]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed Events</span>
            </button>

            <button
              onClick={onOpenSupportModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#4a3b30] hover:bg-[#fff0e6] hover:text-[#C2500A] transition-all"
            >
              <Headphones className="w-4 h-4 text-[#E8621A]" />
              <span>Support</span>
            </button>
          </div>

          {/* DB Sync & Supabase Status Button */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-2xs ${
              isSupabaseConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-[#fff0e6] text-[#C2500A] border-[#f5c9a8] hover:bg-[#ffe0cc]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{isSupabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (Hidden on PC/Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fffbf7]/95 backdrop-blur-lg border-t border-[#ffe0cc] pb-safe shadow-lg">
        <div className="max-w-md mx-auto h-16 flex items-center justify-around px-2">
          <button
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              currentTab === 'home'
                ? 'text-[#C2500A] font-bold scale-105'
                : 'text-[#7c6354] hover:text-[#C2500A]'
            }`}
          >
            <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[11px] font-medium tracking-wider uppercase mt-0.5">Home</span>
          </button>

          <button
            onClick={() => onSelectTab('create')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              currentTab === 'create'
                ? 'text-[#C2500A] font-bold scale-105'
                : 'text-[#7c6354] hover:text-[#C2500A]'
            }`}
          >
            <PlusCircle className={`w-5 h-5 ${currentTab === 'create' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[11px] font-medium tracking-wider uppercase mt-0.5">Create</span>
          </button>

          <button
            onClick={() => onSelectTab('completed')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              currentTab === 'completed'
                ? 'text-[#C2500A] font-bold scale-105'
                : 'text-[#7c6354] hover:text-[#C2500A]'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 ${currentTab === 'completed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[11px] font-medium tracking-wider uppercase mt-0.5">History</span>
          </button>

          <button
            onClick={onOpenSupportModal}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              currentTab === 'support'
                ? 'text-[#C2500A] font-bold scale-105'
                : 'text-[#7c6354] hover:text-[#C2500A]'
            }`}
          >
            <Headphones className={`w-5 h-5 ${currentTab === 'support' ? 'stroke-[2.5] text-[#C2500A]' : 'stroke-2 text-[#E8621A]'}`} />
            <span className="text-[11px] font-medium tracking-wider uppercase mt-0.5">Support</span>
          </button>
        </div>
      </nav>
    </>
  );
};
