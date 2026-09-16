import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, User, Bell, Menu } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { dbService } from '../services/db';
import { AppSettings } from '../types';

interface TopNavProps {
  onMenuClick?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    dbService.getSettings().then(setSettings);
  }, []);
  
  return (
    <header className="h-[calc(4rem+env(safe-area-inset-top))] flex items-center justify-between px-4 md:px-8 bg-zinc-950/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="md:hidden w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:block">
          <PWAInstallButton />
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full border-2 border-black" />
          </button>
          
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full p-1 pr-3 transition-colors border border-white/5 min-h-[44px]">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-white max-w-[120px] truncate hidden xs:block">
              {settings?.userName || 'Người dùng'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
