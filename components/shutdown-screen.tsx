'use client';

import { FormEvent, useEffect, useState } from 'react';

const repairLines = [
  'RECONSTRUCTING ACCESS LAYER',
  'REPAIR ATTEMPT INTERRUPTED',
  'SEARCHING FOR A STABLE THREAD',
  'RECONSTRUCTING ACCESS LAYER',
];

export default function ShutdownScreen() {
  const [sunVisible, setSunVisible] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [name, setName] = useState('');
  const [denied, setDenied] = useState(false);
  const [repairIndex, setRepairIndex] = useState(0);

  useEffect(() => {
    const sunTimer = window.setTimeout(() => setSunVisible(true), 5200);
    const repairTimer = window.setInterval(() => setRepairIndex((current) => (current + 1) % repairLines.length), 2800);
    return () => { window.clearTimeout(sunTimer); window.clearInterval(repairTimer); };
  }, []);

  function enterLight(event: FormEvent) {
    event.preventDefault();
    if (name.trim().toLocaleLowerCase() !== 'celis') { setDenied(true); return; }
    window.sessionStorage.setItem('sunny-corner-recognized', 'celis');
    window.location.assign('/sunny-corner');
  }

  return <main className="shutdown-shell">
    <div className="shutdown-night" aria-hidden="true" />
    <div className="shutdown-glass" aria-hidden="true" />
    <svg className="shutdown-cracks" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0 94 83 61 152 172 223 151 334" /><path d="M94 83 218 39 293 117" /><path d="M61 152 17 260 104 304" />
      <path d="M1440 0 1348 91 1381 169 1280 225 1307 344" /><path d="M1348 91 1230 43 1157 126" /><path d="M1381 169 1431 269 1350 320" />
      <path d="M0 900 93 818 57 747 169 684 144 584" /><path d="M1440 900 1349 815 1383 742 1274 677 1304 572" />
    </svg>

    <section className="shutdown-notice" aria-labelledby="shutdown-title">
      <p>SYSTEM INTERRUPTION</p>
      <h1 id="shutdown-title">Synchronization in progress.</h1>
      <p>Traveler access temporarily unavailable.</p>
      <div className="repair-line" aria-live="polite"><i /><span>{repairLines[repairIndex]}</span><b>{String(repairIndex + 1).padStart(2, '0')}</b></div>
    </section>

    {sunVisible && <button className="sun-fracture" type="button" onClick={() => setGateOpen(true)} aria-label="A small warm light has appeared">
      <span aria-hidden="true">✦</span>
    </button>}

    {gateOpen && <div className="sun-identity-gate" role="dialog" aria-modal="true" aria-labelledby="sun-gate-title">
      <form onSubmit={enterLight}>
        <button className="sun-gate-close" type="button" onClick={() => { setGateOpen(false); setDenied(false); }}>×</button>
        <div className="sun-gate-symbol" aria-hidden="true">✦</div>
        <p id="sun-gate-title">Who is standing in the light?</p>
        <label><span>YOUR NAME</span><input autoFocus value={name} onChange={(event) => { setName(event.target.value.slice(0, 30)); setDenied(false); }} autoComplete="given-name" /></label>
        {denied && <small>The light does not answer.</small>}
        <button className="sun-gate-enter" type="submit" disabled={!name.trim()}>STEP CLOSER</button>
      </form>
    </div>}
  </main>;
}
