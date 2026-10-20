'use client';

import { useEffect, useState } from 'react';

const waitingPhrases = [
  'The path is forming.',
  'The Guide is listening.',
  'The unseen hand is writing.',
  'The stars reconsider their course.',
  'A response gathers beyond the veil.',
  'The next page has not yet chosen its words.',
];

export default function MagicalBookPortal({ active = true, phrase, majorReveal = false }: { active?: boolean; phrase?: string; majorReveal?: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (phrase || !active) return;
    const timer = window.setInterval(() => setPhraseIndex((current) => (current + 1) % waitingPhrases.length), 6200);
    return () => window.clearInterval(timer);
  }, [active, phrase]);

  return <section className={`book-portal${active ? ' is-active' : ''}${majorReveal ? ' is-revealing' : ''}`} aria-label="The Threshold Page">
    <div className="portal-ink" aria-hidden="true">
      <i className="portal-star-field portal-stars-one" />
      <i className="portal-star-field portal-stars-two" />
      <i className="portal-constellation portal-constellation-one" />
      <i className="portal-constellation portal-constellation-two" />
      <span className="portal-boundary" />
      <b className="portal-mark">✦</b>
    </div>
    <p aria-live="polite">{phrase || waitingPhrases[phraseIndex]}</p>
  </section>;
}
