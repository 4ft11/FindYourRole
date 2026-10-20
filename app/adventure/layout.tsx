import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Wayfarer — Private Thread', robots: { index: false, follow: false, nocache: true } };
export default function AdventureLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
