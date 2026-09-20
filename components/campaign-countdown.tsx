'use client';

import { useEffect, useMemo, useState } from 'react';

export const CAMPAIGN_RELEASE_TIME = '2026-09-20T20:00:00-04:00';

function timeRemaining(target: number, now: number) {
  const total = Math.max(0, target - now);
  const seconds = Math.floor(total / 1000);
  return {
    total,
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export default function CampaignCountdown({ onComplete }: { onComplete: () => void }) {
  const target = useMemo(() => new Date(CAMPAIGN_RELEASE_TIME).getTime(), []);
  const [now, setNow] = useState<number | null>(null);
  const remaining = timeRemaining(target, now ?? target);

  useEffect(() => {
    const starter = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.clearTimeout(starter); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (now !== null && remaining.total === 0) onComplete();
  }, [now, onComplete, remaining.total]);

  return <main className="countdown-shell">
    <div className="countdown-stars" aria-hidden="true" />
    <div className="countdown-surface" aria-hidden="true" />
    <div className="glass-corner glass-corner-nw" aria-hidden="true"><i /><i /><i /><i /></div>
    <div className="glass-corner glass-corner-ne" aria-hidden="true"><i /><i /><i /><i /></div>
    <div className="glass-corner glass-corner-sw" aria-hidden="true"><i /><i /><i /></div>
    <div className="glass-corner glass-corner-se" aria-hidden="true"><i /><i /><i /></div>
    <svg className="glass-fractures" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0 106 82 70 151 179 230 157 325" />
      <path d="M106 82 211 42 284 116" />
      <path d="M70 151 18 247 91 301" />
      <path d="M1440 0 1346 105 1382 177 1278 246 1307 348" />
      <path d="M1346 105 1241 55 1165 134" />
      <path d="M1382 177 1435 277 1364 326" />
      <path d="M0 900 91 819 58 747 166 687 143 595" />
      <path d="M1440 900 1347 821 1380 748 1276 681 1304 597" />
    </svg>

    <section className="countdown-message" aria-labelledby="countdown-title">
      <p className="countdown-system">WAYFARER // SEALED TRANSMISSION</p>
      <div className="countdown-mark" aria-hidden="true"><span>◈</span></div>
      <h1 id="countdown-title">The record is not ready.</h1>
      <p className="countdown-copy">Return when the night has opened.</p>
      <div className="countdown-clock" role="timer" aria-live="off" aria-label={`${remaining.hours} hours, ${remaining.minutes} minutes, and ${remaining.seconds} seconds until access`}>
        <div><strong>{String(remaining.hours).padStart(2, '0')}</strong><span>HOURS</span></div>
        <b aria-hidden="true">:</b>
        <div><strong>{String(remaining.minutes).padStart(2, '0')}</strong><span>MINUTES</span></div>
        <b aria-hidden="true">:</b>
        <div><strong>{String(remaining.seconds).padStart(2, '0')}</strong><span>SECONDS</span></div>
      </div>
      <p className="countdown-release">ACCESS RESTORES // SEPTEMBER 20 // 8:00 PM EDT</p>
      <div className="countdown-status"><span /><p>SURFACE INTEGRITY FAILING AT EDGES</p></div>
    </section>
  </main>;
}
