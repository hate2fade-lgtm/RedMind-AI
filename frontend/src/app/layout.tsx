import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'RedMind AI - Анализ отношений с помощью ИИ',
  description: 'Проанализируйте токсичность отношений, манипуляции и психологические паттерны с помощью искусственного интеллекта',
  keywords: 'анализ отношений, токсичные отношения, AI, психология, манипуляции, газлайтинг',
  authors: [{ name: 'RedMind AI' }],
  openGraph: {
    title: 'RedMind AI - Анализ отношений',
    description: 'AI-сервис для анализа токсичности отношений',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}