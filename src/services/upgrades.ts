import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
export type { UpgradeSuggestion } from '../types';
import { UpgradeSuggestion } from '../types';

const COLLECTION_NAME = 'upgrades';

export const upgradesService = {
  async saveUpgrade(data: Omit<UpgradeSuggestion, 'id' | 'createdAt'>): Promise<string> {
    if (!db) throw new Error("Firebase DB not initialized");
    
    const docRef = doc(collection(db, COLLECTION_NAME));
    
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  },

  async getUpgrades(): Promise<UpgradeSuggestion[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UpgradeSuggestion));
    } catch (e) {
      console.error("Error fetching upgrades", e);
      return [];
    }
  },
  
  async updateStatus(id: string, status: 'merged' | 'rejected'): Promise<void> {
    if (!db) throw new Error("Firebase DB not initialized");
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status });
  }
};
