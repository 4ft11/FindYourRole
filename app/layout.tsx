import type { Metadata } from 'next';
import './globals.css';
import './portal.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://wayfarer-personality-compass.infuriate.chatgpt.site'),
  title: 'The Chronicles of Rumerianne',
  description: 'A private campaign Chronicle for the travelers of Rumerianne.',
  openGraph: {
    title: 'The Chronicles of Rumerianne',
    description: 'A private campaign Chronicle for the travelers of Rumerianne.',
    type: 'website',
    images: [{ url: '/og-roles-found.png', width: 1792, height: 925, alt: 'Roles Found — Identity Confirmation Required' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Chronicles of Rumerianne',
    description: 'A private campaign Chronicle for the travelers of Rumerianne.',
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
