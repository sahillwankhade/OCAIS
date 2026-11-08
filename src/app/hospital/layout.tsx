import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/hospital-manifest.json',
};

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
