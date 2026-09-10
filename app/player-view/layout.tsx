import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Wayfarer Tactical Display', robots: { index: false, follow: false, nocache: true } };
export default function PlayerViewLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
