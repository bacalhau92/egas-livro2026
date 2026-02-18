const admin = require('firebase-admin');

// Manually set env since we are outside Next.js
const serviceAccount = {
    projectId: "egas-7eabe",
    clientEmail: "firebase-adminsdk-fbsvc@egas-7eabe.iam.gserviceaccount.com",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function reset() {
    const collectionRef = db.collection('rsvps');
    const snapshot = await collectionRef.get();
    if (snapshot.empty) {
        console.log('Banco de dados já está vazio.');
        return;
    }
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Sucesso: ${snapshot.size} registros removidos.`);
}

reset();
