import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
export type { CompositionRun } from '../types';
import type { CompositionRun } from '../types';

const COLLECTION_NAME = 'runs';

export const runsService = {
  async saveRun(runData: Omit<CompositionRun, 'id' | 'createdAt'>, id?: string): Promise<string | null> {
    // Persistence is optional for the Composer. A missing Firebase config must not turn
    // a successful composition into a user-visible composition failure.
    if (!db) return null;

    const docRef = id ? doc(db, COLLECTION_NAME, id) : doc(collection(db, COLLECTION_NAME));
    await setDoc(docRef, {
      ...runData,
      createdAt: serverTimestamp(),
    }, { merge: true });
    return docRef.id;
  },

  async getAllRuns(): Promise<CompositionRun[]> {
    if (!db) return [];
    try {
      const runsQuery = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(runsQuery);
      return snapshot.docs.map((document: any) => ({ id: document.id, ...document.data() } as CompositionRun));
    } catch (cause) {
      console.error('Error fetching runs', cause);
      return [];
    }
  },
};
