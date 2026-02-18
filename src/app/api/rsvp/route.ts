import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { RsvpEmailTemplate } from '@/components/emails/rsvp-template';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Add to Firestore
        const docRef = await db.collection('rsvps').add({
            ...data,
            createdAt: FieldValue.serverTimestamp(),
        });

        // Send Email via Resend
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey && data.email) {
            try {
                const resend = new Resend(apiKey);
                await resend.emails.send({
                    from: 'Convite Oficinal <onboarding@resend.dev>', // Should be updated to verified domain later
                    to: [data.email],
                    subject: 'Confirmação de Presença - Lançamento Santos Egas Moniz',
                    react: RsvpEmailTemplate({
                        nome: data.nome,
                        confirmacao: data.confirmacao,
                        livro: 'Manual de Gestão e Redacção de Documentos Oficiais e Pareceres Técnicos',
                        autor: 'Santos Egas Moniz'
                    }),
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Don't fail the whole request if email fails
            }
        }

        return NextResponse.json({ id: docRef.id, success: true }, { status: 200 });
    } catch (error) {
        console.error('Error adding RSVP:', error);
        return NextResponse.json({ error: 'Erro ao processar RSVP', success: false }, { status: 500 });
    }
}
