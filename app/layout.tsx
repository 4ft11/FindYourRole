import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://wayfarer-personality-compass.infuriate.chatgpt.site'),
  title: 'Wayfarer — System Interruption',
  description: 'Synchronization in progress. Traveler access temporarily unavailable.',
  openGraph: {
    title: 'Wayfarer — System Interruption',
    description: 'Synchronization in progress. Traveler access temporarily unavailable.',
    type: 'website',
    images: [{ url: '/og-roles-found.png', width: 1792, height: 925, alt: 'Roles Found — Identity Confirmation Required' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wayfarer — System Interruption',
    description: 'Synchronization in progress. Traveler access temporarily unavailable.',
    images: ['/og-roles-found.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
