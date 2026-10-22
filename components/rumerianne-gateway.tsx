'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { CampaignEntry, CampaignPlayer } from '@/lib/campaign-types';
import { roles } from '@/app/player-config';
import ChronicleEmblem from '@/components/chronicle-emblem';

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

function ArchiveEnvironment() {
  return <div className="archive-environment" aria-hidden="true">
    <div className="archive-light" />
    <div className="archive-motes">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${9 + i * 7}%`, top: `${18 + (i * 13) % 68}%`, animationDelay: `${-i * 1.7}s` }} />)}</div>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="archive-hanging-lantern" src="/art/lantern-lit.png" alt="" />
  </div>;
}

function ClosedBook({ onRecognized, recognizedPlayer }: { onRecognized: (player: CampaignPlayer) => void; recognizedPlayer: CampaignPlayer | null }) {
  const [unsealed, setUnsealed] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (unsealed) nameInput.current?.focus({ preventScroll: true });
  }, [unsealed]);

  useEffect(() => {
    const timer = setTimeout(() => {
    try {
      const remembered = JSON.parse(window.localStorage.getItem(rememberedIdentityKey) || 'null') as { name?: string; role?: string } | null;
      if (remembered?.name) setName(remembered.name);
      if (remembered?.role && roles.includes(remembered.role as typeof roles[number])) setRole(remembered.role);
    } catch { /* A damaged local note is simply ignored. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function enter(event: FormEvent) {
    event.preventDefault();
    if (!agreed || !name.trim() || !role) return;
    setSubmitting(true);
    setNotice('The ink searches for a familiar hand…');
    try {
      const response = await fetch('/api/player/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role }),
      });
      if (response.ok) {
        const result = await response.json() as { player: CampaignPlayer };
        try {
          window.localStorage.setItem(rememberedIdentityKey, JSON.stringify({ name: result.player.name, role: result.player.role }));
        } catch { /* Recognition also works when browser storage is unavailable. */ }
        setNotice('The Chronicle recognizes you.');
        onRecognized(result.player);
      } else if (response.status === 409) {
        setNotice('Record conflict. This name and seal do not belong to the same hand.');
      } else if (response.status === 404) {
        setNotice('Record not found. The pages remain still.');
      } else {
        setNotice('The archive cannot answer just now. Please try again.');
      }
    } catch {
      setNotice('The connection to the archive was lost. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <section className={`archive-composition rpg-entrance${unsealed ? ' is-unsealed' : ''}${recognizedPlayer ? ' is-recognized' : ''}`} aria-labelledby="rumerianne-title">
    <div className="archive-artifact">
      {!unsealed ? <button className="archive-cover" type="button" onClick={() => setUnsealed(true)} aria-label="Open the Chronicle of Rumerianne">
        <span className="archive-sr-only">Open the Chronicle</span>
      </button> : <form className="archive-spread" onSubmit={enter} aria-busy={submitting}>
        <div className="archive-inscription-page">
          <p className="archive-folio-number">I · The reader</p>
          <h2>A familiar hand.</h2>
          <p className="archive-page-copy">Write the name by which the Chronicle knows you.</p>
          <label className="archive-name-label" htmlFor="archive-reader">Your first name</label>
          <input id="archive-reader" className="archive-name" ref={nameInput} value={name} onChange={(event) => { setName(event.target.value.slice(0, 40)); setNotice(''); }} autoComplete="given-name" maxLength={40} required disabled={submitting || !!recognizedPlayer} spellCheck={false} />
          <label className="archive-agreement">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} disabled={submitting || !!recognizedPlayer} />
            <span>I enter only the pages written for me.</span>
          </label>
          <button className="archive-recognize" disabled={submitting || !!recognizedPlayer || !agreed || !name.trim() || !role}>
            <span>{submitting ? 'Reading the inscription…' : recognizedPlayer ? 'You are remembered' : 'Let the Chronicle recognize me'}</span>
            <span aria-hidden="true">→</span>
          </button>
          <output className="archive-notice" aria-live="polite">{notice}</output>
        </div>
        <fieldset className="archive-seal-page" disabled={submitting || !!recognizedPlayer}>
          <legend className="archive-sr-only">Choose your assigned role</legend>
          <p className="archive-folio-number" aria-hidden="true">II · The seal</p>
          <h2>Your given role.</h2>
          <p className="archive-page-copy">Choose the seal already entrusted to you.</p>
          <div className="archive-role-grid">
            {roles.map((item) => <label className={`archive-role${role === item ? ' is-selected' : ''}`} key={item}>
              <input type="radio" name="chronicle-role" value={item} checked={role === item} onChange={() => { setRole(item); setNotice(''); }} />
              <span className="archive-role-emblem"><ChronicleEmblem role={item} /></span>
              <span>{item}</span>
            </label>)}
          </div>
          <p className="archive-seal-caption">{role ? 'A seal is offered. The reader is yet to be known.' : 'Six seals. Only your own will answer.'}</p>
        </fieldset>
      </form>}
      {unsealed && !recognizedPlayer && <button className="archive-return" type="button" onClick={() => { setUnsealed(false); setNotice(''); }}>← Close the cover</button>}
    </div>
    <div className="archive-introduction">
      <p className="archive-eyebrow">A private chronicle</p>
      <h1 id="rumerianne-title"><span>The Chronicle of</span>Rumerianne</h1>
      <div className="archive-title-rule" aria-hidden="true"><i /></div>
      {!unsealed && <><p className="archive-invocation">Some stories remember their reader.</p><button className="rpg-open-action" onClick={() => setUnsealed(true)}>Open the Chronicle <span aria-hidden="true">→</span></button></>}
    </div>
  </section>;
}

type Invitation = { title: string; roomCode: string; player: string };
const chapters = ['Chronicle', 'Roles', 'Omen', 'Map', 'Archive'] as const;
function Chronicle({ player: initial, onClose }: { player: CampaignPlayer; onClose: () => void }) {
  const [player, setPlayer] = useState(initial);
  const [chapter, setChapter] = useState<typeof chapters[number]>('Chronicle');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [omen, setOmen] = useState('Some answers improve considerably after supper.');
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [chapter]);
  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const response = await fetch('/api/player/me', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { player: CampaignPlayer; invitation: Invitation | null; omen: string };
        if (alive) { setPlayer(data.player); setInvitation(data.invitation); setOmen(data.omen); }
      } catch { /* A quiet network interruption must not remove the current page. */ }
    }
    void refresh();
    const timer = setInterval(refresh, 10000);
    return () => { alive = false; clearInterval(timer); };
  }, []);
  function join() {
    if (!invitation) return;
    try {
      sessionStorage.setItem('rumerianne-session-invitation', JSON.stringify(invitation));
      window.location.assign('/adventure');
    } catch { setNotice('Your browser could not carry the invitation. Open /adventure with the key supplied by your Guide.'); }
  }
  const entries = player.entries.filter((entry) => entry.state !== 'hidden');
  const quests = entries.filter((entry) => entry.type === 'quest' || entry.type === 'objective').sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  const archive = entries.filter((entry) => !['quest', 'objective', 'title'].includes(entry.type)).sort((a, b) => a.sortOrder - b.sortOrder);
  const written = (value: string) => value && !/pending|unconfirmed/i.test(value);
  return <main className="rpg-world rpg-chronicle">
    <header className="rpg-masthead"><span>The Chronicle of</span><h1>Rumerianne</h1></header>
    <nav className="rpg-bookmarks" aria-label="Your book">{chapters.map((item) => <button key={item} onClick={() => setChapter(item)} aria-current={chapter === item ? 'page' : undefined}>{item}{item === 'Map' && <span className="archive-sr-only"> — not yet charted</span>}</button>)}</nav>
    <div className="rpg-manuscript">
      <section className="rpg-leaf rpg-identity-leaf">
        <div className="rpg-role-banner" aria-hidden="true"><ChronicleEmblem role={player.role} /><span>{player.displayRole}</span></div>
        <div className="rpg-reader-intro"><p className="rpg-kicker">Written for</p><h2>{player.name}</h2><p className="rpg-role-name">{player.displayRole}</p><div className="rpg-ink-rule" />
          <p className="rpg-manuscript-quote">{chapter === 'Omen' ? 'A little wisdom, left between the pages.' : chapter === 'Archive' ? 'What you learn need not be lost.' : 'Your story is still being written.'}</p>
          {chapter === 'Roles' && <dl className="rpg-identity">{[['Path', player.path], ['Calling', [player.characterClass, player.subclass].filter(written).join(' · ')], ['Form', player.species]].map(([label, value]) => written(value) && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        </div>
      </section>
      <section className="rpg-leaf rpg-content-leaf" aria-label={chapter}>
        <p className="rpg-kicker">{chapter === 'Chronicle' ? 'The road ahead' : chapter === 'Roles' ? 'Your character' : chapter === 'Omen' ? 'From the tavern wall' : chapter === 'Map' ? 'Uncharted' : 'Collected knowledge'}</p>
        <h2 ref={heading} tabIndex={-1}>{chapter === 'Chronicle' ? 'The next chapter' : chapter === 'Roles' ? 'The role you carry' : chapter === 'Omen' ? 'Today’s omen' : chapter === 'Map' ? 'Beyond these pages' : 'Things remembered'}</h2>
        <div className="rpg-page-content">
          {chapter === 'Chronicle' && <>{quests.length ? quests.map((entry) => <ChronicleEntry key={entry.id} entry={entry} />) : <p className="rpg-empty-page">No new quest has been inscribed. There is room here for what comes next.</p>}
            {invitation && <button className="rpg-invitation" onClick={join}><span className="rpg-envelope" aria-hidden="true"><i>R</i></span><span><small>A sealed invitation</small><strong>A new chapter is waiting</strong><em>{invitation.title}</em><span>Break the seal →</span></span></button>}</>}
          {chapter === 'Roles' && <><p>Your role is a thread in your story. Your class and training determine what you can do.</p>{entries.filter((entry) => entry.type === 'title').map((entry) => <ChronicleEntry key={entry.id} entry={entry} />)}<p className="rpg-marginal-note">Further details will appear as your Guide records them.</p></>}
          {chapter === 'Omen' && <><blockquote className="rpg-omen">{omen}</blockquote><p className="rpg-marginal-note">A new saying each day. Take it as seriously as you like.</p></>}
          {chapter === 'Map' && <div className="rpg-unmapped" aria-label="Map available later"><ChronicleEmblem /><p>No map has been entrusted to this book.</p></div>}
          {chapter === 'Archive' && (archive.length ? archive.map((entry) => <ChronicleEntry key={entry.id} entry={entry} />) : <p className="rpg-empty-page">Discoveries, letters, and memories will find their place here when they are revealed.</p>)}
        </div>
        <p role="status">{notice}</p>
        <footer className="rpg-page-footer"><span>Kept for {player.name}</span><button onClick={onClose}>Close the book</button></footer>
      </section>
    </div>
  </main>;
}

export default function RumerianneGateway() {
  const [stage, setStage] = useState<EntranceStage>('lantern');
  const [player, setPlayer] = useState<CampaignPlayer | null>(null);
  const openingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completePrelude = useCallback(() => {
    setStage('book');
    void fetch('/api/player/me', { cache: 'no-store' }).then(async (response) => {
      if (response.ok) { const data = await response.json() as { player: CampaignPlayer }; setPlayer(data.player); setStage('chronicle'); }
    }).catch(() => undefined);
  }, []);

  useEffect(() => () => { if (openingTimer.current) clearTimeout(openingTimer.current); }, []);

  function recognized(next: CampaignPlayer) {
    setPlayer(next);
    setStage('opening');
    openingTimer.current = setTimeout(() => setStage('chronicle'), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 2300);
  }

  if (stage === 'lantern') return <LanternPrelude onComplete={completePrelude} />;
  if (stage === 'chronicle' && player) return <Chronicle player={player} onClose={() => { void fetch('/api/player/me', { method: 'DELETE' }); setPlayer(null); setStage('book'); }} />;

  return <main className={`archive-screen${stage === 'opening' ? ' is-opening' : ''}`}>
    <ArchiveEnvironment />
    <ClosedBook onRecognized={recognized} recognizedPlayer={stage === 'opening' ? player : null} />
    {stage === 'opening' && player && <div className="archive-recognition" role="status" aria-live="polite">
      <ChronicleEmblem role={player.role} />
      <p>The Chronicle recognizes</p><strong>{player.name}</strong><span>{player.displayRole}</span>
    </div>}
  </main>;
}
