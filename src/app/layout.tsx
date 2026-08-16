import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TT Engineering Copilot',
  description: 'TT Manufacturing and Engineering Copilot — EV Traction Inverter POC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 font-sans">
        {children}
      </body>
    </html>
  );
}
