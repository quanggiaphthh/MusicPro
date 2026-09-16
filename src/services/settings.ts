import type { AppSettings } from '../types';

const SETTINGS_KEY = 'music_pro_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  userRole: 'Composer',
  temperature: 0.7,
  defaultStyleId: 'STYLE.VN.VPOP-BALLAD',
  playbackQuality: 'standard',
  defaultExportFormat: 'wav',
  normalizeWav: true,
  autoSave: true,
};

function normalizeSettings(value: Partial<AppSettings> | null | undefined): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(value || {}) };
  return {
    userName: String(merged.userName || ''),
    userRole: String(merged.userRole || 'Composer'),
    temperature: Math.max(0, Math.min(1, Number(merged.temperature) || 0)),
    defaultStyleId: String(merged.defaultStyleId || DEFAULT_SETTINGS.defaultStyleId),
    playbackQuality: merged.playbackQuality === 'high' ? 'high' : 'standard',
    defaultExportFormat: ['wav', 'midi', 'musicxml'].includes(merged.defaultExportFormat) ? merged.defaultExportFormat : 'wav',
    normalizeWav: merged.normalizeWav !== false,
    autoSave: merged.autoSave !== false,
  };
}

export const settingsService = {
  getSettings(): AppSettings {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return { ...DEFAULT_SETTINGS };
    try {
      return normalizeSettings(JSON.parse(saved));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings: AppSettings): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
  },

  resetSettings(): AppSettings {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS };
  },
};
