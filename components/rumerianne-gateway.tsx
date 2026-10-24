'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { CampaignEntry, CampaignPlayer } from '@/lib/campaign-types';
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
  const unsealed = true;
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [candidate, setCandidate] = useState<CampaignPlayer | null>(null);
  const [holding, setHolding] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { nameInput.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
    try {
      const remembered = JSON.parse(window.localStorage.getItem(rememberedIdentityKey) || 'null') as { name?: string } | null;
      if (remembered?.name) setName(remembered.name);
    } catch { /* A damaged local note is simply ignored. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function enter(event: FormEvent) {
    event.preventDefault();
    if (!agreed || !name.trim()) return;
    setSubmitting(true);
    setNotice('The ink searches for a familiar hand…');
    try {
      const response = await fetch('/api/player/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const result = await response.json() as { player: CampaignPlayer };
        try {
          window.localStorage.setItem(rememberedIdentityKey, JSON.stringify({ name: result.player.name }));
        } catch { /* Recognition also works when browser storage is unavailable. */ }
        setCandidate(result.player);
        setNotice(result.player.key === 'celis' ? 'No transport record answers. Something golden moves at the edge of the page.' : 'A damaged record has answered.');
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

  function completeRecognition() {
    if (!candidate) return;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setHolding(false);
    setNotice('The Chronicle recognizes you.');
    onRecognized(candidate);
  }

  function beginHold() {
    if (!candidate || candidate.key === 'celis' || holdTimer.current) return;
    setHolding(true);
    holdTimer.current = setTimeout(completeRecognition, 1100);
  }

  function cancelHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  }

  const transportRecord = candidate?.entries.find((entry) => entry.title === 'Transport Record');

  return <section className={`archive-composition rpg-entrance${unsealed ? ' is-unsealed' : ''}${recognizedPlayer ? ' is-recognized' : ''}`} aria-labelledby="rumerianne-title">
    <div className="archive-artifact">
      <form className="archive-spread" onSubmit={enter} aria-busy={submitting}>
        <div className="archive-inscription-page">
          <p className="archive-folio-number">I · The reader</p>
          <h2>A familiar hand.</h2>
          <p className="archive-page-copy">Write the name by which the Chronicle knows you.</p>
          <label className="archive-name-label" htmlFor="archive-reader">Your first name</label>
          <input id="archive-reader" className="archive-name" ref={nameInput} value={name} onChange={(event) => { setName(event.target.value.slice(0, 40)); setCandidate(null); setNotice(''); }} autoComplete="given-name" maxLength={40} required disabled={submitting || !!recognizedPlayer || !!candidate} spellCheck={false} />
          <label className="archive-agreement">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} disabled={submitting || !!recognizedPlayer} />
            <span>I enter only the pages written for me.</span>
          </label>
          <button className="archive-recognize" disabled={submitting || !!recognizedPlayer || !!candidate || !agreed || !name.trim()}>
            <span>{submitting ? 'Searching the archive…' : recognizedPlayer ? 'You are remembered' : candidate ? 'A record has answered' : 'Search for my record'}</span>
            <span aria-hidden="true">→</span>
          </button>
          <output className="archive-notice" aria-live="polite">{notice}</output>
        </div>
        <section className={`archive-seal-page archive-record-page${candidate ? ' has-record' : ''}`} aria-live="polite">
          <p className="archive-folio-number" aria-hidden="true">II · The record</p>
          {!candidate ? <><h2>The page waits.</h2><p className="archive-page-copy">A record cannot be summoned until a known name is written.</p><div className="archive-redaction-preview" aria-hidden="true"><i /><i /><i /></div></> : candidate.key === 'celis' ? <div className="archive-celis-passage">
            <p className="archive-record-stamp">NO TRANSPORT RECORD FOUND</p>
            <h2>The ink has nothing to return.</h2>
            <p className="archive-page-copy">For a moment, the page remains still. Then something golden moves near the binding.</p>
            <button className="archive-butterfly-key" type="button" onClick={completeRecognition} aria-label="Follow the golden butterfly into the Chronicle"><i /><i /><b /></button>
            <p className="archive-seal-caption">Follow what the light has hidden.</p>
          </div> : <div className="archive-transport-passage">
            <div className="archive-transport-card">
              <p>IMPERIAL TRANSPORT REGISTRY</p><strong>{candidate.name.toUpperCase()}</strong>
              <div className="archive-record-redactions" aria-hidden="true"><i /><i /><i /></div>
              <span>{transportRecord?.body || 'Record partially destroyed. Remaining transport information has been blacked out.'}</span>
            </div>
            <p className="archive-page-copy">If this record belongs to you, hold your hand upon the blacked-out ink.</p>
            <button className={`archive-ink-hold${holding ? ' is-holding' : ''}`} type="button" onPointerDown={beginHold} onPointerUp={cancelHold} onPointerCancel={cancelHold} onPointerLeave={cancelHold} onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) beginHold(); }} onKeyUp={(event) => { if (event.key === 'Enter' || event.key === ' ') cancelHold(); }}>
              <span>{holding ? 'The ink is remembering…' : 'Press and hold the redaction'}</span><i aria-hidden="true" />
            </button>
          </div>}
        </section>
      </form>
    </div>
    <div className="archive-introduction">
      <p className="archive-eyebrow">A private chronicle</p>
      <h1 id="rumerianne-title"><span>The Chronicle of</span>Rumerianne</h1>
      <div className="archive-title-rule" aria-hidden="true"><i /></div>
    </div>
  </section>;
}

type Invitation = { title: string; roomCode: string; player: string };
const chapters = ['Chronicle', 'Roles', 'Omen', 'Map', 'Archive'] as const;
type RoleRecord = { motto: string; summary: string; resonance: string; virtue: string; shadow: string; traits: [string, string, string] };
const roleDetails: Record<string, RoleRecord> = {
  'The Sworn': {
    motto: 'You preserve what others surrender.',
    summary: 'The Sworn value commitments that remain meaningful when circumstances become difficult. Their steadiness can protect what a group might otherwise abandon, while leaving them responsible for deciding which promises deserve to continue.',
    resonance: 'A strong pull toward duty, continuity, and promises that survive changing circumstances.', virtue: 'Reliability', shadow: 'Obedience', traits: ['Loyalty', 'Resolve', 'Remembrance'],
  },
  'The Seer': {
    motto: 'You seek what remains true when appearances fail.',
    summary: 'The Seer notices contradictions and tests what others take for granted. Curiosity helps a group see clearly when knowledge remains an invitation to better choices rather than a means of control.',
    resonance: 'A tendency to question appearances, follow evidence, and notice what others overlook.', virtue: 'Discernment', shadow: 'Withholding', traits: ['Perception', 'Wonder', 'Truth'],
  },
  'The Weaver': {
    motto: 'You make meaning where none was assigned.',
    summary: 'The Weaver recognizes possibilities inside rules, identities, and plans that seem fixed. They notice where actions connect, how movement creates consequence, and how a group can act together.',
    resonance: 'A habit of finding connections, alternatives, and meaning in situations that seem fixed.', virtue: 'Possibility', shadow: 'Evasion', traits: ['Pattern', 'Kinship', 'Momentum'],
  },
  'The Shepherd': {
    motto: 'You refuse to let anyone become expendable.',
    summary: 'The Shepherd notices who is frightened, excluded, or carrying too much. Their care becomes most powerful when protection and another person’s freedom can exist together.',
    resonance: 'An instinct to notice vulnerability, strengthen bonds, and keep people from being left behind.', virtue: 'Attunement', shadow: 'Possession', traits: ['Mercy', 'Patience', 'Guidance'],
  },
  'The Justiciar': {
    motto: 'You count the cost others refuse to name.',
    summary: 'The Justiciar compares consequences and faces difficult tradeoffs without pretending that inaction is neutral. Their judgment is strongest when every affected person remains visible.',
    resonance: 'A willingness to weigh consequences, confront tradeoffs, and name the cost of a decision.', virtue: 'Moral courage', shadow: 'Reduction', traits: ['Justice', 'Balance', 'Courage'],
  },
  'The Sovereign': {
    motto: 'You act when uncertainty becomes its own form of violence.',
    summary: 'The Sovereign steps forward when a group needs direction and turns competing intentions into action. Their authority becomes trustworthy when responsibility, consent, and the freedom to disagree remain connected.',
    resonance: 'A readiness to coordinate people, accept responsibility, and act when waiting has a cost.', virtue: 'Decisiveness', shadow: 'Entitlement', traits: ['Will', 'Command', 'Restraint'],
  },
};
const roleTabs = ['Overview', 'Abilities', 'Equipment', 'Records'] as const;
const archiveFilters = ['All Entries', 'Memories', 'Objects', 'People', 'Messages', 'Locked Pages'] as const;
function Chronicle({ player: initial, onClose }: { player: CampaignPlayer; onClose: () => void }) {
  const [player, setPlayer] = useState(initial);
  const [chapter, setChapter] = useState<typeof chapters[number]>('Chronicle');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [omen, setOmen] = useState('Some answers improve considerably after supper.');
  const [todayLabel, setTodayLabel] = useState('Today');
  const [notice, setNotice] = useState('');
  const [roleTab, setRoleTab] = useState<typeof roleTabs[number]>('Overview');
  const [archiveFilter, setArchiveFilter] = useState<typeof archiveFilters[number]>('All Entries');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [chapter]);
  useEffect(() => {
    setTodayLabel(new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()));
  }, []);
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
  const titles = entries.filter((entry) => entry.type === 'title');
  const inventory = entries.filter((entry) => entry.type === 'inventory');
  const records = entries.filter((entry) => ['title', 'memory', 'guide_message', 'private_notice', 'npc'].includes(entry.type));
  const filteredArchive = archive.filter((entry) => {
    if (archiveFilter === 'All Entries') return true;
    if (archiveFilter === 'Memories') return entry.type === 'memory';
    if (archiveFilter === 'Objects') return entry.type === 'inventory';
    if (archiveFilter === 'People') return entry.type === 'npc';
    if (archiveFilter === 'Messages') return entry.type === 'guide_message' || entry.type === 'private_notice';
    return entry.state === 'locked' || entry.state === 'corrupted' || entry.state === 'unknown' || entry.state === 'partial';
  });
  const written = (value: string) => value && !/pending|unconfirmed/i.test(value);
  const roleCopy = roleDetails[player.role] || { motto: 'The path remembers.', summary: 'A role still revealing the shape of its meaning.', resonance: 'The pattern has not yet been fully read.', virtue: 'Choice', shadow: 'Certainty', traits: ['Choice', 'Memory', 'Becoming'] as [string, string, string] };
  return <main className={`rpg-world rpg-chronicle${player.key === 'celis' ? ' is-celis-reader' : ''}`}>
    {player.key === 'celis' && <span className="celis-butterfly-glimmer" aria-hidden="true"><i /><i /><b /></span>}
    <header className="rpg-chrome">
      <button className="rpg-wordmark" type="button" onClick={() => setChapter('Chronicle')} aria-label="Return to the Chronicle"><span>The Chronicle of</span><strong>Rumerianne</strong></button>
      <nav className="rpg-bookmarks" aria-label="Your book">{chapters.map((item) => <button key={item} onClick={() => setChapter(item)} aria-current={chapter === item ? 'page' : undefined}>{item}{item === 'Map' && <span className="archive-sr-only"> — not yet charted</span>}</button>)}</nav>
      <button className="rpg-close-book" onClick={onClose}>Close <span aria-hidden="true">×</span></button>
    </header>
    {chapter === 'Omen' ? <section className="rpg-omen-desk" aria-label="Today’s omen">
      <div className="rpg-receding-chronicle" aria-hidden="true" />
      <div className="rpg-desk-vignette" aria-hidden="true"><span className="rpg-ink-bottle" /><span className="rpg-desk-candle"><i /></span><span className="rpg-brass-charm">☾</span></div>
      <div className="rpg-daily-calendar">
        <div className="rpg-calendar-pins" aria-hidden="true"><i /><i /></div>
        <div className="rpg-calendar-header"><span>Daily Omen</span><small>{todayLabel}</small></div>
        <div className="rpg-calendar-paper">
          <span className="rpg-calendar-star" aria-hidden="true">✦</span>
          <h2 ref={heading} tabIndex={-1}>Today’s Omen</h2>
          <blockquote>“{omen}”</blockquote>
          <div className="rpg-ornamental-rule" aria-hidden="true"><span>✦</span></div>
          <p>Advice of uncertain origin, but rarely disputed.</p>
        </div>
        <div className="rpg-calendar-base" aria-hidden="true" />
      </div>
      <p className="rpg-omen-source">Copied from a market almanac whose editor remains confidently anonymous.</p>
      <button className="rpg-tomorrow" type="button" disabled>Tomorrow remains unavailable</button>
    </section> : <div className={`rpg-manuscript rpg-chapter-${chapter.toLowerCase()}`}>
      {chapter === 'Chronicle' && <>
        <section className="rpg-leaf rpg-chronicle-overview">
          <div className="rpg-chronicle-banner" aria-hidden="true"><span className="rpg-banner-stars">✦ · ✦ · ✦</span><ChronicleEmblem role={player.role} /><strong>{player.displayRole}</strong><i /></div>
          <div className="rpg-chronicle-intro">
            <p className="rpg-kicker">The private Chronicle of</p>
            <h2 ref={heading} tabIndex={-1}>{player.name}</h2>
            <p className="rpg-opening-copy">{roleCopy.summary}</p>
            <blockquote>“{roleCopy.motto}”</blockquote>
          </div>
          <div className="rpg-traits" aria-label="Key traits">{roleCopy.traits.map((trait, index) => <div key={trait}><span aria-hidden="true">{index === 0 ? '✦' : index === 1 ? '❧' : '◇'}</span><strong>{trait}</strong></div>)}</div>
          <p className="rpg-page-number" aria-hidden="true">I</p>
        </section>
        <section className="rpg-leaf rpg-next-chapter" aria-label="Next chapter">
          <div className="rpg-next-heading"><p className="rpg-kicker">The road ahead</p><h3>The next chapter</h3><div className="rpg-ornamental-rule" aria-hidden="true"><span>✦</span></div></div>
          <div className="rpg-quest-list">{quests.length ? quests.map((entry) => <ChronicleEntry key={entry.id} entry={entry} />) : <p className="rpg-empty-page">No current quest has been inscribed. The page has been left open for what comes next.</p>}</div>
          {invitation ? <button className="rpg-invitation" onClick={join}><span className="rpg-envelope" aria-hidden="true"><i>R</i></span><span><small>A sealed invitation</small><strong>A new chapter is waiting</strong><em>{invitation.title}</em><span>Break the seal →</span></span></button> : <div className="rpg-waiting-page"><span className="rpg-envelope is-resting" aria-hidden="true"><i>R</i></span><div><p className="rpg-kicker">No letter has arrived</p><h4>The next adventure is still being written.</h4></div></div>}
          <p role="status">{notice}</p>
          <footer className="rpg-page-footer"><span>Kept for {player.name}</span><span aria-hidden="true">II</span></footer>
        </section>
      </>}

      {chapter === 'Roles' && <>
        <section className="rpg-leaf rpg-role-portrait">
          <div className="rpg-role-heraldry" aria-hidden="true"><span>✦ · ✦ · ✦</span><ChronicleEmblem role={player.role} /><i /></div>
          <p className="rpg-kicker">The role carried by</p>
          <h2 ref={heading} tabIndex={-1}>{player.displayRole}</h2>
          <p className="rpg-role-bearer">{player.name}</p>
          <div className="rpg-ornamental-rule" aria-hidden="true"><span>✦</span></div>
          <p className="rpg-manuscript-quote">“{roleCopy.motto}”</p>
          <div className="rpg-role-triad">{roleCopy.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
          <p className="rpg-page-number" aria-hidden="true">III</p>
        </section>
        <section className="rpg-leaf rpg-role-record" aria-label="Role record">
          <nav className="rpg-role-tabs" aria-label="Role record sections">{roleTabs.map((tab) => <button key={tab} type="button" aria-current={roleTab === tab ? 'page' : undefined} onClick={() => setRoleTab(tab)}>{tab}</button>)}</nav>
          {roleTab === 'Overview' && <div className="rpg-role-panel">
            <p className="rpg-kicker">Role summary</p><h3>{player.displayRole}</h3><p>{roleCopy.summary}</p>
            <div className="rpg-role-principles"><div><span>Resonance</span><p>{roleCopy.resonance}</p></div><div><span>Strength</span><strong>{roleCopy.virtue}</strong></div><div><span>Watch for</span><strong>{roleCopy.shadow}</strong></div></div>
            <p className="rpg-marginal-note">A role is a narrative identity, not another class or a source of unrestricted power.</p>
          </div>}
          {roleTab === 'Abilities' && <div className="rpg-role-panel">
            <p className="rpg-kicker">Known capabilities</p><h3>Your calling</h3>
            <dl className="rpg-identity">{[['Class', player.characterClass], ['Subclass', player.subclass], ['Manifestation', player.manifestation]].map(([label, value]) => written(value) && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            {player.key === 'michael' && <p className="rpg-record-note">You do not control the threads of reality. You notice where things connect—and your training determines what you can do about it.</p>}
            {!written(player.characterClass) && <p className="rpg-empty-page">No abilities have been confirmed in this record.</p>}
            <p className="rpg-marginal-note">Class and species determine what your character can do. The Chronicle does not add abilities that have not been earned.</p>
          </div>}
          {roleTab === 'Equipment' && <div className="rpg-role-panel"><p className="rpg-kicker">Important objects</p><h3>What you carry</h3>{inventory.length ? inventory.map((entry) => <ChronicleEntry key={entry.id} entry={entry} />) : <p className="rpg-empty-page">No important object has been entered into the Chronicle.</p>}</div>}
          {roleTab === 'Records' && <div className="rpg-role-panel"><p className="rpg-kicker">Personal record</p><h3>What has been written</h3>{records.length ? records.map((entry) => <ChronicleEntry key={entry.id} entry={entry} />) : <p className="rpg-empty-page">Titles, memories, people, and private revelations will gather here when they are earned or revealed.</p>}</div>}
          <footer className="rpg-page-footer"><span>Recognition confirmed</span><span aria-hidden="true">IV</span></footer>
        </section>
      </>}

      {chapter === 'Map' && <>
        <section className="rpg-leaf rpg-map-field" aria-label="Uncharted map">
          <div className="rpg-map-lines" aria-hidden="true"><i /><i /><i /><i /></div>
          <p className="rpg-kicker">Cartography withheld</p>
          <h2 ref={heading} tabIndex={-1}>Beyond these pages</h2>
          <p>No map has yet been entrusted to this book.</p>
          <span className="rpg-map-compass" aria-hidden="true">✦</span>
          <p className="rpg-page-number" aria-hidden="true">VII</p>
        </section>
        <section className="rpg-leaf rpg-map-legend">
          <p className="rpg-kicker">Uncharted</p>
          <h3>The world will arrive in fragments.</h3>
          <p>Places discovered, roads remembered, and borders questioned will gather here as the journey continues.</p>
          <div className="rpg-map-key" aria-hidden="true"><span /><i /><b /></div>
          <footer className="rpg-page-footer"><span>Nothing shown before it is found</span><span aria-hidden="true">VIII</span></footer>
        </section>
      </>}

      {chapter === 'Archive' && <>
        <section className="rpg-leaf rpg-archive-index">
          <p className="rpg-kicker">The private archive</p>
          <h2 ref={heading} tabIndex={-1}>Collected knowledge</h2>
          <p>Only what {player.name} has learned, carried, or been permitted to remember appears here.</p>
          <nav className="rpg-archive-filters" aria-label="Archive categories">{archiveFilters.map((filter) => {
            const count = filter === 'All Entries' ? archive.length : archive.filter((entry) => filter === 'Memories' ? entry.type === 'memory' : filter === 'Objects' ? entry.type === 'inventory' : filter === 'People' ? entry.type === 'npc' : filter === 'Messages' ? ['guide_message', 'private_notice'].includes(entry.type) : ['locked', 'corrupted', 'unknown', 'partial'].includes(entry.state)).length;
            return <button type="button" key={filter} aria-current={archiveFilter === filter ? 'page' : undefined} onClick={() => setArchiveFilter(filter)}><span>{filter}</span><small>{count || '—'}</small></button>;
          })}</nav>
          <p className="rpg-page-number" aria-hidden="true">IX</p>
        </section>
        <section className="rpg-leaf rpg-archive-entries" aria-label="Archive entries">
          <div className="rpg-archive-heading"><p className="rpg-kicker">{archiveFilter}</p><h3>{archiveFilter === 'All Entries' ? 'Things remembered' : archiveFilter}</h3><p>The book reveals no knowledge belonging to another reader.</p></div>
          {filteredArchive.length ? filteredArchive.map((entry) => <ChronicleEntry key={entry.id} entry={entry} />) : <div className="rpg-archive-empty"><ChronicleEmblem /><h3>No entry yet</h3><p>This part of {player.name}’s archive remains unwritten. It will grow only from discoveries made in the campaign.</p></div>}
          <footer className="rpg-page-footer"><span>Private to this reader</span><span aria-hidden="true">X</span></footer>
        </section>
      </>}
    </div>}
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
