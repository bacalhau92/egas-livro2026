import { db } from '../src/lib/firebase-admin';

async function resetDB() {
    console.log('Resetting Database...');
    try {
        const collectionRef = db.collection('rsvps');
        const snapshot = await collectionRef.get();

        if (snapshot.empty) {
            console.log('Collection is already empty.');
            return;
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Successfully deleted ${snapshot.size} records.`);
    } catch (error) {
        console.error('Error resetting database:', error);
    }
}

resetDB();
