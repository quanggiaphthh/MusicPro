import React, { useState } from 'react';
import { CheckCircle, Database, Loader2, Music2 } from 'lucide-react';
import { motion } from 'motion/react';
import { createMultiInstrumentDemoProject } from '../demo/multi-instrument-demo';
import { useNavigation } from '../hooks/useNavigation';
import { useToast } from '../hooks/useToast';
import { projectService } from '../projects/project-service';
import { productErrorText } from '../utils/product-errors';

export const DemoDataView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { navigate } = useNavigation();

  const createDemo = async () => {
    setLoading(true);
    try {
      const bundle = createMultiInstrumentDemoProject();
      await projectService.saveProject(bundle);
      addToast('Đã tạo demo Piano + Bass + Strings + Drums trong Dự án / Lịch sử.');
      navigate('runs');
    } catch (cause) {
      addToast(productErrorText(cause, 'LOCAL_STORAGE_FAILED'));
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-center md:px-8 md:py-12">
      <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/20 text-indigo-400"><Database className="h-10 w-10" /></motion.div>
      <div className="space-y-3"><h1 className="text-3xl font-bold md:text-4xl">Demo kiểm thử sản phẩm V1</h1><p className="text-zinc-400">Tạo trực tiếp một dự án MusicXML khoảng 40 giây với 4 nhóm nhạc cụ. Không gọi Gemini, Lyria hay Firebase.</p></div>
      <button onClick={createDemo} disabled={loading} className="mx-auto flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white hover:bg-indigo-500 disabled:opacity-50">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Music2 className="h-6 w-6" />}Tạo demo nhiều nhạc cụ</button>
      <div className="grid grid-cols-1 gap-3 text-left md:grid-cols-2">
        {['Piano — GM Acoustic Grand','Bass — Electric Bass','Strings — String Ensemble','Drums — MIDI channel 10'].map(text => <div key={text} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"><CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" /><span className="text-sm text-zinc-300">{text}</span></div>)}
      </div>
      <p className="text-xs text-zinc-600">Sau khi tạo, dùng Mixer để thử mute/solo/volume/pan rồi xuất MusicXML, MIDI, WAV và Project ZIP.</p>
    </div>
  );
};
