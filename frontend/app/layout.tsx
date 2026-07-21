import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'INDUSMIND AI | Industrial Knowledge Intelligence Platform',
  description: 'One AI Brain for Every Industrial Asset. Transform documents, manual SOPs, drawings, and records into intelligent searchable knowledge bases.',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Outfit', sans-serif !important;
          }
        `}</style>
      </head>
      <body className="h-full antialiased dark bg-slate-950 text-slate-100 transition-colors duration-300">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

