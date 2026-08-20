import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-jb',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TT Engineering Copilot',
  description: 'TT Manufacturing and Engineering Copilot POC — EVINV-POC-001',
};

/**
 * Applies the stored theme before first paint. Without this, the app always
 * renders dark and then snaps to light on hydration — a visible flash for
 * anyone who chose light mode. Kept inline and synchronous on purpose.
 */
const THEME_SCRIPT = `
try {
  if (localStorage.getItem('tt-theme') === 'light') {
    document.documentElement.classList.add('light');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
