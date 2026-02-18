import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


export const metadata: Metadata = {
  metadataBase: new URL("https://convite.manualdegestao.ao"),
  title: "Convite: Cerimónia de Lançamento - Santos Egas Moniz",
  description: "Lançamento oficial da obra 'Manual de Gestão e Redacção de Documentos Oficiais e Pareceres Técnicos' por Santos Egas Moniz na ENAPP.",
  keywords: ["Santos Egas Moniz", "Manual de Gestão", "ENAPP", "Lançamento de Livro", "Redacção de Documentos", "Angola"],
  authors: [{ name: "Santos Egas Moniz" }],
  openGraph: {
    title: "Lançamento Oficial: Manual de Gestão e Redacção - Santos Egas Moniz",
    description: "Sua presença é fundamental. Confirme sua participação no lançamento oficial na ENAPP.",
    url: "https://convite.manualdegestao.ao", // Update with real URL if available
    siteName: "Manual de Gestão - Santos Egas Moniz",
    type: "website",
    images: [
      {
        url: "/images/capa.png",
        width: 1200,
        height: 630,
        alt: "Capa do Livro - Manual de Gestão e Redacção",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lançamento: Manual de Gestão e Redacção - Santos Egas Moniz",
    description: "Confirme sua participação no lançamento oficial na ENAPP.",
    images: ["/images/capa.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
