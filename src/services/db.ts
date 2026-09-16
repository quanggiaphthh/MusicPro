import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { AppSettings, UserProfile } from '../types';
import { settingsService } from './settings';

export const dbService = {
  // V1 settings are local-first so core product behavior never depends on Firebase.
  async getSettings(): Promise<AppSettings> {
    return settingsService.getSettings();
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    settingsService.saveSettings(settings);
  },

  // Profile helpers remain cloud-backed for backward compatibility.
  async getUserProfile(): Promise<UserProfile | null> {
    if (!db || !auth || !auth.currentUser) return null;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (!db || !auth || !auth.currentUser) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(docRef, profile, { merge: true });
  },
};
