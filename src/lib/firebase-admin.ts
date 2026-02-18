import * as admin from 'firebase-admin';

let _db: admin.firestore.Firestore | null = null;

function getFirestoreInstance(): admin.firestore.Firestore | null {
    if (_db) return _db;

    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            console.warn('Firebase Admin environment variables missing. Initialization skipped.');
            return null;
        }

        try {
            // Safeguard: Remove potential wrapping quotes and fix newlines
            const formattedKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    privateKey: formattedKey,
                }),
            });
        } catch (error) {
            console.error('Firebase admin initialization error:', error);
            return null;
        }
    }
    _db = admin.firestore();
    return _db;
}

// Export a proxy for 'db' that only initializes when accessed
export const db = new Proxy({} as admin.firestore.Firestore, {
    get(_, prop) {
        const instance = getFirestoreInstance();
        if (!instance) {
            throw new Error('Firebase Admin SDK não foi inicializado. Verifique se as variáveis de ambiente (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) estão configuradas corretamente no Netlify.');
        }
        return (instance as any)[prop];
    }
});
