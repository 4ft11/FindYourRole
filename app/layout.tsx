import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://wayfarer-personality-compass.infuriate.chatgpt.site'),
  title: 'Wayfarer — Roles Found',
  description: 'The selection period has ended. Identity confirmation is required.',
  openGraph: {
    title: 'Roles Found!',
    description: 'The selection period has ended. Identity confirmation is required.',
    type: 'website',
    images: [{ url: '/og-roles-found.png', width: 1792, height: 925, alt: 'Roles Found — Identity Confirmation Required' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roles Found!',
    description: 'The selection period has ended. Identity confirmation is required.',
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
