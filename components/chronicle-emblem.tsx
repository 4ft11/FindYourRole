import type { Role } from '@/app/player-config';

/** One engraved vocabulary, also used on the book before a reader is known. */
export default function ChronicleEmblem({ role }: { role?: Role | string }) {
  return <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="50" cy="50" r="43" strokeWidth=".7" strokeDasharray="131 8 123 8" />
    <path d="M50 3v8M50 89v8M3 50h8M89 50h8" strokeWidth="1" />
    {role === 'The Sworn' ? <>
      <circle cx="40" cy="36" r="12" /><path d="M48 45l24 27m-8-9 7-6m-13 0 6-6M34 36h12M40 30v12" />
    </> : role === 'The Seer' ? <>
      <path d="M17 50Q50 14 83 50Q50 86 17 50Z" /><circle cx="50" cy="50" r="12" /><path d="M50 34v7m0 18v7M50 18v7M26 27l5 6m43-6-5 6" /><circle cx="50" cy="50" r="3" />
    </> : role === 'The Weaver' ? <>
      <path d="M23 29C65 24 78 78 47 75S20 32 74 26M24 72C34 38 76 35 76 58S34 65 37 22M21 30l7-1m44 0 4-3" />
    </> : role === 'The Shepherd' ? <>
      <path d="M55 80V33c0-18-25-20-25-2 0 12 16 11 16 2M43 80h22M55 56l15-8" />
    </> : role === 'The Justiciar' ? <>
      <path d="M50 23v54M29 33h42M23 60l10-25 11 25H23Zm34 0 10-25 10 25M58 60h8m7 0h5M37 78h26" /><circle cx="50" cy="25" r="3" />
    </> : role === 'The Sovereign' ? <>
      <path d="M26 64l-5-28 18 14 11-26 11 26 18-14-5 28H26Zm2 7h44M34 58h32" /><path d="M47 23h6" /><circle cx="50" cy="58" r="2" />
    </> : <>
      <circle cx="50" cy="50" r="27" strokeWidth=".8" />
      <path d="M50 15l5 29 30 6-30 5-5 30-5-30-30-5 30-6 5-29Z" />
      <path d="M29 29l15 15m12 12 15 15M71 29 56 44M44 56 29 71" strokeWidth=".8" />
      <circle cx="50" cy="50" r="6" />
    </>}
  </svg>;
}
