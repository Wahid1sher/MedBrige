import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, type Auth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';

export interface FirebaseServices {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly firestore: Firestore;
  readonly appCheck: AppCheck | null;
}
let services: FirebaseServices | undefined;
export const isExtension = () =>
  typeof location !== 'undefined' && location.protocol === 'chrome-extension:';
export function firebaseConfigured(): boolean {
  const e = import.meta.env;
  return !!(e.VITE_FIREBASE_API_KEY && e.VITE_FIREBASE_PROJECT_ID && e.VITE_FIREBASE_APP_ID);
}
/** Lazy initialization: scrubbing/rendering alone makes no Firebase requests. */
export function getFirebaseServices(
  options: { cloud: boolean } = { cloud: false },
): FirebaseServices {
  if (!firebaseConfigured())
    throw new Error('Firebase is not configured. Add the public web configuration to .env.local.');
  const e = import.meta.env;
  if (options.cloud && (isExtension() || !e.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY))
    throw new Error('Cloud AI needs the web companion and a registered App Check provider.');
  if (!services) {
    const app = getApps().some((a) => a.name === 'medbridge')
      ? getApp('medbridge')
      : initializeApp(
          {
            apiKey: e.VITE_FIREBASE_API_KEY,
            authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: e.VITE_FIREBASE_PROJECT_ID,
            appId: e.VITE_FIREBASE_APP_ID,
          },
          'medbridge',
        );
    const auth = initializeAuth(app, { persistence: inMemoryPersistence });
    const firestore = initializeFirestore(app, { localCache: memoryLocalCache() });
    services = { app, auth, firestore, appCheck: null };
  }
  // AI Logic captures its App Check provider when first constructed, including
  // local-only instances. Install it before that point so later consented cloud
  // fallback cannot accidentally reuse an AI instance with no attestation.
  if (!services.appCheck && !isExtension() && e.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) {
    if (
      import.meta.env.DEV &&
      import.meta.env.VITE_APPCHECK_DEBUG === 'true' &&
      ['localhost', '127.0.0.1'].includes(location.hostname)
    ) {
      (
        self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }
      ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    const appCheck = initializeAppCheck(services.app, {
      provider: new ReCaptchaEnterpriseProvider(e.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    services = { ...services, appCheck };
  }
  return services;
}
