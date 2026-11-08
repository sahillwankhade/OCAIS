import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'One Click AIS | Instant Healthcare Appointments & Live Queue Tracker',
  description:
    'Patient appointment booking, live queue tracker, doctor cabin QR scan, and clinic display board system for India.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f766e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
