import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  // Read config safely using Vite's glob import
  const configs = import.meta.glob('../../firebase-applet-config.json', { eager: true });
  const configModule = configs['../../firebase-applet-config.json'] as any;

  let config = null;

  if (configModule && configModule.default) {
    config = configModule.default;
  } else if (import.meta.env.VITE_FIREBASE_CONFIG) {
    // Fallback to Env Variable
    const envConfig = import.meta.env.VITE_FIREBASE_CONFIG;
    config = typeof envConfig === 'object' ? envConfig : JSON.parse(envConfig);
  }

  if (config && config.projectId) {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    // CRITICAL: Must use firestoreDatabaseId from config for correct routing
    db = getFirestore(app, config.firestoreDatabaseId || '(default)');
    auth = getAuth(app);
  } else {
    console.warn('Firebase configuration is missing or invalid.');
  }
} catch (e) {
  console.error('Failed to initialize Firebase:', e);
}

export { app, db, auth };
export const googleProvider = new GoogleAuthProvider();
