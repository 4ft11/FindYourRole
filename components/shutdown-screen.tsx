'use client';

import { useEffect, useState } from 'react';

const repairLines = [
  'THE MARGIN IS MENDING ITSELF',
  'A LINE OF INK HAS GONE MISSING',
  'THE RECORD TURNS ANOTHER PAGE',
  'THE MARGIN IS MENDING ITSELF',
];

const lanterns = Array.from({ length: 7 }, (_, index) => ({
  index,
  stasis: index === 2,
  moon: index === 6,
}));

export default function ShutdownScreen() {
  const [repairIndex, setRepairIndex] = useState(0);

  useEffect(() => {
    const repairTimer = window.setInterval(() => setRepairIndex((current) => (current + 1) % repairLines.length), 2800);
    return () => window.clearInterval(repairTimer);
  }, []);

  return <main className="shutdown-shell">
    <div className="shutdown-night" aria-hidden="true" />
    <div className="shutdown-glass" aria-hidden="true" />
    <svg className="shutdown-cracks" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0 94 83 61 152 172 223 151 334" /><path d="M94 83 218 39 293 117" /><path d="M61 152 17 260 104 304" />
      <path d="M1440 0 1348 91 1381 169 1280 225 1307 344" /><path d="M1348 91 1230 43 1157 126" /><path d="M1381 169 1431 269 1350 320" />
      <path d="M0 900 93 818 57 747 169 684 144 584" /><path d="M1440 900 1349 815 1383 742 1274 677 1304 572" />
    </svg>

    <section className="shutdown-notice" aria-labelledby="shutdown-title">
      <p>THE SEVEN LIGHTS</p>
      <h1 id="shutdown-title">The way remains unfinished.</h1>
      <p>One by one, the lanterns remember their flame.</p>
      <ol className="seven-lanterns" aria-label="Seven lanterns. Six are illuminated and the moon-marked seventh is dark.">
        {lanterns.map((lantern) => <li className={`manuscript-lantern${lantern.stasis ? ' is-stasis' : ''}${lantern.moon ? ' is-moon' : ''}`} key={lantern.index} style={{ animationDelay: `${lantern.index * 420}ms` }}>
          <span className="lantern-crown" aria-hidden="true" />
          <span className="lantern-body" aria-hidden="true"><i className="lantern-flame" />{lantern.stasis && <b className="lantern-line">—</b>}{lantern.moon && <b className="lantern-moon">☾</b>}</span>
          <span className="lantern-foot" aria-hidden="true" />
          <span className="sr-only">Lantern {lantern.index + 1}{lantern.stasis ? ', marked with a line and already lit' : lantern.moon ? ', marked with a moon and unlit' : ', lit'}</span>
        </li>)}
      </ol>
      <div className="repair-line" aria-live="polite"><i /><span>{repairLines[repairIndex]}</span><b>{String(repairIndex + 1).padStart(2, '0')}</b></div>
    </section>

  </main>;
}
