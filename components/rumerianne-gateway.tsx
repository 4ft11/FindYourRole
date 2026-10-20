'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CampaignEntry, CampaignPlayer } from '@/lib/campaign-types';
import { roles } from '@/app/player-config';

type EntranceStage = 'lantern' | 'book' | 'opening' | 'chronicle';

const rememberedIdentityKey = 'rumerianne-last-identity-v1';

function ChronicleEntry({ entry }: { entry: CampaignEntry }) {
  if (entry.state === 'hidden') return null;
  const body = entry.state === 'locked'
    ? 'This page has not yet consented to be read.'
    : entry.state === 'corrupted'
      ? 'The ink refuses to remain in the same order.'
      : entry.body;

  return <article className={`chronicle-entry chronicle-entry-${entry.state}`}>
    <p>{entry.type.replace('_', ' ')}</p>
    <h3>{entry.title}</h3>
    <div>{body}</div>
  </article>;
}

function LanternPrelude({ onComplete }: { onComplete: () => void }) {
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lightTimer = window.setTimeout(() => setLit(true), reduced ? 80 : 900);
    const finishTimer = window.setTimeout(onComplete, reduced ? 900 : 5200);
    return () => { window.clearTimeout(lightTimer); window.clearTimeout(finishTimer); };
  }, [onComplete]);

  return <section className={`lantern-prelude${lit ? ' is-lit' : ''}`} aria-label="A parchment lantern slowly illuminates">
    <div className="lantern-aura" aria-hidden="true" />
    {/* The paired images intentionally share one canvas so the fade stays perfectly aligned. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="lantern-art lantern-art-off" src="/art/lantern-off.png" alt="An unlit ceremonial parchment lantern" />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="lantern-art lantern-art-lit" src="/art/lantern-lit.png" alt="" aria-hidden="true" />
    <p>The light remembers.</p>
    <button type="button" onClick={onComplete}>Continue to the book</button>
  </section>;
}

function ClosedBook({ onRecognized }: { onRecognized: (player: CampaignPlayer) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [notice, setNotice] = useState('The clasp awaits a recognized hand.');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const remembered = JSON.parse(window.localStorage.getItem(rememberedIdentityKey) || 'null') as { name?: string; role?: string } | null;
      if (remembered?.name) setName(remembered.name);
      if (remembered?.role && roles.includes(remembered.role as typeof roles[number])) setRole(remembered.role);
    } catch { /* A damaged local note is simply ignored. */ }
  }, []);

  async function enter(event: FormEvent) {
    event.preventDefault();
    if (!agreed || !name.trim() || !role) return;
    setSubmitting(true);
    setNotice('The book is comparing the hand to its record…');
    const response = await fetch('/api/player/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role }),
    });

    if (response.ok) {
      const result = await response.json() as { player: CampaignPlayer };
      window.localStorage.setItem(rememberedIdentityKey, JSON.stringify({ name: result.player.name, role: result.player.role }));
      onRecognized(result.player);
    } else if (response.status === 409) {
      setNotice('RECORD CONFLICT. The inscription and the hand do not belong to the same account.');
    } else {
      setNotice('RECORD NOT FOUND. The book offers no other names.');
    }
    setSubmitting(false);
  }

  return <section className="closed-book-stage" aria-labelledby="rumerianne-title">
    <div className="closed-book">
      <div className="book-spine" aria-hidden="true" />
      <div className="book-corners" aria-hidden="true"><i /><i /><i /><i /></div>
      <header>
        <p>The private chronicle of</p>
        <h1 id="rumerianne-title">Rumerianne</h1>
        <span>✦</span>
      </header>
      <form className="book-inscription" onSubmit={enter}>
        <p>Declare the name by which the Chronicle knows you.</p>
        <label><span>First name</span><input value={name} onChange={(event) => setName(event.target.value.slice(0, 40))} autoComplete="given-name" /></label>
        <label><span>Assigned role</span><select value={role} onChange={(event) => setRole(event.target.value)}><option value="">Choose the role already given to you</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="book-agreement"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>I enter only the pages written for me.</span></label>
        <button disabled={submitting || !agreed || !name.trim() || !role}>{submitting ? 'The clasp is turning…' : 'Unfasten the clasp'}</button>
        <output aria-live="polite">{notice}</output>
      </form>
      <div className="book-clasp" aria-hidden="true"><i /></div>
    </div>
  </section>;
}

function Chronicle({ player, onClose }: { player: CampaignPlayer; onClose: () => void }) {
  const visibleEntries = useMemo(() => player.entries.filter((entry) => entry.state !== 'hidden'), [player.entries]);
  const currentQuest = visibleEntries.find((entry) => entry.type === 'quest' && entry.isCurrent);
  const memories = visibleEntries.filter((entry) => entry.type === 'memory');
  const objects = visibleEntries.filter((entry) => entry.type === 'inventory');
  const people = visibleEntries.filter((entry) => entry.type === 'npc');
  const messages = visibleEntries.filter((entry) => entry.type === 'guide_message' || entry.type === 'private_notice');
  const isWritten = (value: string) => Boolean(value && !value.toUpperCase().includes('UNCONFIRMED') && !value.toUpperCase().includes('PENDING'));

  return <main className="chronicle-stage">
    <div className="chronicle-book" aria-label={`${player.name}'s personal Chronicle`}>
      <section className="chronicle-page chronicle-left-page">
        <div className="page-number">I</div>
        <p className="chronicle-kicker">This Chronicle belongs to</p>
        <h1>{player.name}</h1>
        <div className="chronicle-seal" aria-hidden="true"><span>✦</span></div>
        <dl className="identity-lines">
          <div><dt>Role</dt><dd>{player.displayRole}</dd></div>
          {isWritten(player.path) && <div><dt>Current path</dt><dd>{player.path}</dd></div>}
          {isWritten(player.characterClass) && <div><dt>Calling</dt><dd>{player.characterClass}{isWritten(player.subclass) ? ` · ${player.subclass}` : ''}</dd></div>}
          {isWritten(player.species) && <div><dt>Form</dt><dd>{player.species}</dd></div>}
        </dl>
        {objects.length > 0 && <section className="chronicle-list"><h2>Important objects</h2>{objects.map((entry) => <ChronicleEntry entry={entry} key={entry.id} />)}</section>}
        {people.length > 0 && <section className="chronicle-list"><h2>People encountered</h2>{people.map((entry) => <ChronicleEntry entry={entry} key={entry.id} />)}</section>}
      </section>

      <div className="book-gutter" aria-hidden="true" />

      <section className="chronicle-page chronicle-right-page">
        <div className="page-number">II</div>
        <p className="chronicle-kicker">The road presently written</p>
        <h2>{currentQuest?.title || 'The next page is waiting.'}</h2>
        <p className="chronicle-opening">{currentQuest?.body || 'No quest has been inscribed here yet. The Chronicle remains yours even while the road is quiet.'}</p>
        {memories.length > 0 && <section className="chronicle-list"><h2>Recovered memories</h2>{memories.map((entry) => <ChronicleEntry entry={entry} key={entry.id} />)}</section>}
        {messages.length > 0 && <section className="chronicle-list"><h2>Letters kept between the pages</h2>{messages.map((entry) => <ChronicleEntry entry={entry} key={entry.id} />)}</section>}
        <aside className="chronicle-marginalia">No live chapter is calling for you. The book will reveal an invitation here when one has been prepared.</aside>
        <footer>
          <span>Last amended: {player.lastSystemUpdate || 'The date was not written'}</span>
          <button type="button" onClick={onClose}>Close the Chronicle</button>
        </footer>
      </section>
    </div>
  </main>;
}

export default function RumerianneGateway() {
  const [stage, setStage] = useState<EntranceStage>('lantern');
  const [player, setPlayer] = useState<CampaignPlayer | null>(null);

  function recognized(next: CampaignPlayer) {
    setPlayer(next);
    setStage('opening');
    window.setTimeout(() => setStage('chronicle'), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 1100);
  }

  if (stage === 'lantern') return <LanternPrelude onComplete={() => setStage('book')} />;
  if (stage === 'chronicle' && player) return <Chronicle player={player} onClose={() => { setPlayer(null); setStage('book'); }} />;

  return <main className={`rumerianne-entrance${stage === 'opening' ? ' is-opening' : ''}`}>
    <ClosedBook onRecognized={recognized} />
    {stage === 'opening' && <div className="opening-veil" aria-live="polite"><span>The Chronicle recognizes you.</span></div>}
  </main>;
}
