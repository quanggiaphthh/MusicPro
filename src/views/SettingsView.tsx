import React, { useState } from 'react';
import { RotateCcw, Save, Settings, Sliders, User, Volume2 } from 'lucide-react';
import type { AppSettings } from '../types';
import { settingsService } from '../services/settings';
import { useToast } from '../hooks/useToast';

const STYLE_OPTIONS = [
  ['STYLE.VN.VPOP-BALLAD', 'V-Pop Ballad'],
  ['STYLE.VN.BOLERO-TRU-TINH', 'Bolero / Trữ tình'],
  ['STYLE.VN.DAN-CA-CONTEMPORARY', 'Dân ca đương đại'],
  ['STYLE.VN.ACOUSTIC-INDIE', 'Acoustic Indie'],
  ['STYLE.VN.HEROIC-MARCH', 'Hành khúc'],
] as const;

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => settingsService.getSettings());
  const { addToast } = useToast();

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };

  const handleSave = () => {
    settingsService.saveSettings(settings);
    addToast('Đã lưu cài đặt trên thiết bị.');
  };

  const handleReset = () => {
    setSettings(settingsService.resetSettings());
    addToast('Đã khôi phục cài đặt mặc định.');
  };

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-500/20 text-zinc-300 flex items-center justify-center"><Settings className="w-6 h-6" /></div>
          <div><h1 className="text-3xl font-bold">Cài đặt</h1><p className="text-zinc-400">Cá nhân hóa sáng tác, playback và xuất file</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold"><RotateCcw className="w-4 h-4" /> Mặc định</button>
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-bold"><Save className="w-4 h-4" /> Lưu</button>
        </div>
      </div>

      <div className="space-y-6 pb-12">
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5 font-bold"><User className="w-5 h-5 text-indigo-400" /> Thông tin cơ bản</div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-zinc-400">Tên người dùng<input value={settings.userName} onChange={e => updateSetting('userName', e.target.value)} className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" /></label>
            <label className="text-sm text-zinc-400">Vai trò<input value={settings.userRole} onChange={e => updateSetting('userRole', e.target.value)} className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" /></label>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5 font-bold"><Sliders className="w-5 h-5 text-emerald-400" /> Sáng tác</div>
          <div className="grid md:grid-cols-2 gap-5">
            <label className="text-sm text-zinc-400">Phong cách mặc định<select value={settings.defaultStyleId} onChange={e => updateSetting('defaultStyleId', e.target.value)} className="mt-2 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white">{STYLE_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <label className="text-sm text-zinc-400">Độ sáng tạo: {settings.temperature.toFixed(1)}<input aria-label="Độ sáng tạo" type="range" min={0} max={1} step={0.1} value={settings.temperature} onChange={e => updateSetting('temperature', Number(e.target.value))} className="mt-5 w-full accent-emerald-500" /></label>
            <label className="flex items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={settings.autoSave} onChange={e => updateSetting('autoSave', e.target.checked)} /> Tự động lưu dự án trên thiết bị</label>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5 font-bold"><Volume2 className="w-5 h-5 text-sky-400" /> Playback & xuất file</div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-zinc-400">Chất lượng nghe thử<select value={settings.playbackQuality} onChange={e => updateSetting('playbackQuality', e.target.value as AppSettings['playbackQuality'])} className="mt-2 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white"><option value="standard">Tiêu chuẩn</option><option value="high">Cao</option></select></label>
            <label className="text-sm text-zinc-400">Định dạng xuất mặc định<select value={settings.defaultExportFormat} onChange={e => updateSetting('defaultExportFormat', e.target.value as AppSettings['defaultExportFormat'])} className="mt-2 w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white"><option value="wav">WAV</option><option value="midi">MIDI</option><option value="musicxml">MusicXML</option></select></label>
            <label className="flex items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={settings.normalizeWav} onChange={e => updateSetting('normalizeWav', e.target.checked)} /> Chuẩn hóa âm lượng WAV</label>
          </div>
          <p className="mt-4 text-xs text-zinc-500">API key và model AI được cấu hình an toàn ở máy chủ, không lưu trong trình duyệt.</p>
        </section>
      </div>
    </div>
  );
};
