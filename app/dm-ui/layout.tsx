import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DM Creation Studio',
  robots: { index: false, follow: false, nocache: true },
};

export default function DmLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
