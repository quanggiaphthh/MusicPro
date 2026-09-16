import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Archive, BookOpen, ChevronLeft, Database, GitPullRequest, Home, Menu, Settings, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigation } from '../hooks/useNavigation';

interface SidebarProps { isOpen?: boolean; onClose?: () => void; }

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentView, navigate } = useNavigation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => { const mobile = window.innerWidth < 1024; setIsMobile(mobile); if (mobile) setIsCollapsed(false); };
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, []);
  const go = (view: Parameters<typeof navigate>[0]) => { navigate(view); if (isMobile) onClose?.(); };
  const links = [
    ['home', 'Tổng quan', <Home className="h-5 w-5" />],
    ['compose', 'Sáng tác AI', <Sparkles className="h-5 w-5" />],
    ['knowledge', 'Kho kiến thức', <BookOpen className="h-5 w-5" />],
    ['runs', 'Dự án / Lịch sử', <Archive className="h-5 w-5" />],
    ['upgrade', 'Nâng cấp', <GitPullRequest className="h-5 w-5" />],
    ['demo', 'Dữ liệu mẫu', <Database className="h-5 w-5" />],
  ] as const;
  const body = (
    <motion.aside initial={isMobile ? { x: -300 } : false} animate={{ x: 0, width: isCollapsed ? 80 : 280 }} exit={isMobile ? { x: -300 } : undefined} className={cn('relative z-[60] flex h-full shrink-0 flex-col overflow-hidden border-r border-white/5 bg-zinc-950', isMobile && 'fixed inset-y-0 left-0 shadow-2xl')}>
      <div className={cn('flex min-h-20 items-center justify-between p-5', isCollapsed && 'justify-center px-0')}>
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600"><Sparkles className="h-6 w-6" /></div>{!isCollapsed && <span className="text-xl font-black tracking-tight">MusicPro</span>}</div>
        {isMobile && <button aria-label="Đóng menu" onClick={onClose} className="rounded-full p-3 text-zinc-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>}
      </div>
      <nav className="custom-scrollbar flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {links.map(([view, label, icon]) => <SidebarLink key={view} icon={icon} label={label} active={currentView === view} collapsed={isCollapsed} onClick={() => go(view)} />)}
      </nav>
      <div className="space-y-2 border-t border-white/5 p-3">
        <SidebarLink icon={<Settings className="h-5 w-5" />} label="Cài đặt" active={currentView === 'settings'} collapsed={isCollapsed} onClick={() => go('settings')} />
        {!isMobile && <button aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'} onClick={() => setIsCollapsed(value => !value)} className={cn('flex min-h-11 w-full items-center gap-4 rounded-xl px-3 py-3 text-sm font-bold text-zinc-500 hover:bg-white/5 hover:text-white', isCollapsed && 'justify-center px-0')}>{isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}{!isCollapsed && 'Thu gọn'}</button>}
      </div>
    </motion.aside>
  );
  return <><AnimatePresence>{isMobile && isOpen && <motion.button aria-label="Đóng menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[55] bg-black/80" />}</AnimatePresence>{!isMobile ? body : <AnimatePresence>{isOpen && body}</AnimatePresence>}</>;
};

const SidebarLink: React.FC<{ icon: React.ReactNode; label: string; active: boolean; collapsed: boolean; onClick: () => void }> = ({ icon, label, active, collapsed, onClick }) => (
  <button onClick={onClick} aria-label={label} title={collapsed ? label : undefined} className={cn('relative flex min-h-11 w-full items-center gap-4 rounded-xl px-3 py-3 text-sm font-bold transition', active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}><span className="shrink-0">{icon}</span>{!collapsed && <span className="truncate">{label}</span>}{active && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-white" />}</button>
);
