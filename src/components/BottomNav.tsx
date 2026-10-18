import React from 'react';
import { Home, PlusCircle, CheckCircle2, Database } from 'lucide-react';

export type NavTab = 'home' | 'create' | 'completed' | 'supabase';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#fffbf7]/95 backdrop-blur-lg border-t border-[#ffe0cc] pb-safe shadow-lg">
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
          onClick={() => onSelectTab('supabase')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'supabase'
              ? 'text-[#C2500A] font-bold scale-105'
              : 'text-[#7c6354] hover:text-[#C2500A]'
          }`}
        >
          <Database className={`w-5 h-5 ${currentTab === 'supabase' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium tracking-wider uppercase mt-0.5">DB Sync</span>
        </button>
      </div>
    </nav>
  );
};
