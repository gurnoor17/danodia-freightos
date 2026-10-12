import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Danodia FreightOS — Shipment Manager',
  description: 'Enterprise Global Logistics & Shipment Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased font-sans selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
