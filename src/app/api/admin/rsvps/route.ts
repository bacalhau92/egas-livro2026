import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Simple security check
        if (!secret || secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const snapshot = await db.collection('rsvps').orderBy('createdAt', 'desc').get();
        const rsvps = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ rsvps }, { status: 200 });
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        return NextResponse.json({ error: 'Erro ao buscar RSVPs' }, { status: 500 });
    }
}
