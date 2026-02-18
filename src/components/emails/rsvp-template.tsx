/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/forbid-component-props */
/* eslint-disable react/no-unknown-property */
import * as React from 'react';

interface EmailTemplateProps {
    nome: string;
    confirmacao: string;
    livro: string;
    autor: string;
}

const styles = {
    container: { fontFamily: 'sans-serif', color: '#333' },
    card: { padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' },
    footer: { marginTop: '20px' }
};

export const RsvpEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
    nome,
    confirmacao,
    livro,
    autor,
}) => (
    <div style={styles.container}>
        <h1>Olá, {nome}!</h1>
        <p>
            Sua confirmação para o lançamento da obra <strong>"{livro}"</strong> de <strong>{autor}</strong> foi recebida com sucesso.
        </p>
        <div style={styles.card}>
            <p><strong>Status:</strong> {confirmacao === 'sim' ? 'Confirmado' : 'Talvez'}</p>
            <p><strong>Data:</strong> 05 de Março de 2026</p>
            <p><strong>Hora:</strong> 15:00</p>
            <p><strong>Local:</strong> ENAPP – Escola Nacional de Administração e Políticas Públicas</p>
        </div>
        <p style={styles.footer}>
            Apresente seu código QR no local do evento para ter acesso.
        </p>
        <p>Atenciosamente,<br />Equipa Santos Egas Moniz</p>
    </div>
);
