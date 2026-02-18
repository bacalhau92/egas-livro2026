import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const collectionRef = db.collection('rsvps');
        const snapshot = await collectionRef.get();

        const batchSize = snapshot.size;
        if (batchSize === 0) {
            return NextResponse.json({ message: 'Collection is already empty', success: true });
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return NextResponse.json({
            message: `Successfully deleted ${batchSize} records`,
            success: true
        });
    } catch (error) {
        console.error('Error resetting database:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
