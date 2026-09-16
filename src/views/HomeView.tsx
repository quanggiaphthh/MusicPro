import React, { useEffect, useState } from 'react';
import { Archive, ArrowRight, BookOpen, Settings, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigation } from '../hooks/useNavigation';
import { projectService } from '../projects/project-service';
import { knowledgeService } from '../services/knowledge';
import { settingsService } from '../services/settings';

export const HomeView: React.FC = () => {
  const { navigate } = useNavigation();
  const [stats, setStats] = useState({ projects: 0, docs: 0 });
  const settings = settingsService.getSettings();
  useEffect(() => {
    let cancelled = false;
    void Promise.all([projectService.listProjects(), knowledgeService.getAllDocs()]).then(([projects, docs]) => {
      if (!cancelled) setStats({ projects: projects.length, docs: docs.length });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const greeting = settings.userName ? `Chào quay trở lại, ${settings.userName}!` : 'Chào mừng bạn đến với MusicPro!';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex h-full max-w-6xl flex-col space-y-10 px-4 py-8 md:px-8 md:py-12">
      <div className="space-y-4"><h1 className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl">{greeting}</h1><p className="max-w-2xl text-lg text-zinc-400">Từ ý tưởng đến MusicXML master: sáng tác, nghe bằng nhạc cụ mẫu, chỉnh sửa, quản lý phiên bản và xuất sản phẩm.</p></div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ActionCard icon={<Sparkles className="h-6 w-6" />} title="Sáng tác" description="Quy trình 4 bước tạo bản nhạc MusicXML, nghe và chỉnh ngay." action="Bắt đầu ngay" onClick={() => navigate('compose')} />
        <ActionCard icon={<Archive className="h-6 w-6" />} title="Dự án / Lịch sử" description={`${stats.projects} dự án cục bộ với phiên bản, mixer và export.`} action="Mở dự án" onClick={() => navigate('runs')} />
        <ActionCard icon={<BookOpen className="h-6 w-6" />} title="Kho tri thức" description={`${stats.docs} tài liệu cloud đang khả dụng.`} action="Quản lý" onClick={() => navigate('knowledge')} />
      </div>
      <button onClick={() => navigate('settings')} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-5 text-left hover:border-white/20"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-400"><Settings className="h-5 w-5" /></div><div className="flex-1"><div className="font-bold">Cài đặt sản phẩm</div><div className="text-xs text-zinc-500">Playback, autosave, phong cách mặc định và xuất file. API key/model được cấu hình an toàn ở máy chủ.</div></div><ArrowRight className="h-5 w-5 text-zinc-600" /></button>
    </motion.div>
  );
};

const ActionCard: React.FC<{ icon: React.ReactNode; title: string; description: string; action: string; onClick: () => void }> = ({ icon, title, description, action, onClick }) => (
  <div className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-7 hover:bg-white/[0.07]"><div><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">{icon}</div><h2 className="mb-2 text-2xl font-bold">{title}</h2><p className="mb-6 text-sm text-zinc-500">{description}</p></div><button onClick={onClick} className="flex items-center gap-2 font-bold text-indigo-400">{action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></div>
);
