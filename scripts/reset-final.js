const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        env[key.trim()] = value;
    }
});

const serviceAccount = {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function reset() {
    console.log('Iniciando limpeza do banco de dados...');
    const collectionRef = db.collection('rsvps');
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log('O banco de dados já está vazio.');
        process.exit(0);
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Sucesso: ${snapshot.size} registros removidos.`);
    process.exit(0);
}

reset().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
