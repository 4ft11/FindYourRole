'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RoleStatus } from '@/lib/campaign-types';
import RoleStatusBar, { defaultRoleStatus } from './role-status-bar';

type HubView = 'status' | 'quests' | 'memories' | 'players' | 'world';

const navigation: { id: HubView; label: string; shortLabel: string }[] = [
  { id: 'status', label: 'Party Status', shortLabel: 'Status' },
  { id: 'quests', label: 'Quest Log', shortLabel: 'Quests' },
  { id: 'memories', label: 'Memory Archive', shortLabel: 'Memories' },
  { id: 'players', label: 'Player Records', shortLabel: 'Records' },
  { id: 'world', label: 'Known World', shortLabel: 'World' },
];

const worldEntries = [
  {
    category: 'Divine Powers',
    title: 'The Moon',
    summary: 'A divine record with incompatible versions.',
    common: 'The Moon sought to destroy the world and was defeated.',
    discovered: 'Moonlight was once required during the baptism rite.',
    reliability: 'CONFLICT DETECTED',
    state: 'conflict',
  },
  {
    category: 'Locations',
    title: 'Sun Territory',
    summary: 'The party arrived on an unidentified road within its borders.',
    common: 'Roads are watched by the Sun Guard and their allied patrols.',
    discovered: 'The party awoke here in unfamiliar bodies.',
    reliability: 'PARTIAL RECORD',
    state: 'partial',
  },
  {
    category: 'Factions',
    title: 'The Sun Guard',
    summary: 'An armed order recognized by its shield insignia.',
    common: 'The Guard claims authority throughout the Sun Territory.',
    discovered: 'One shield was present at the cart incident.',
    reliability: 'UNVERIFIED',
    state: 'partial',
  },
  {
    category: 'History',
    title: 'The Baptism',
    summary: 'Historical access remains restricted.',
    common: 'No stable public account is available.',
    discovered: 'A forged set of baptism papers appears connected to the party.',
    reliability: 'ENTRY LOCKED',
    state: 'locked',
  },
];

function SectionHeading({ index, eyebrow, title, headingId, children }: { index: string; eyebrow: string; title: string; headingId: string; children?: React.ReactNode }) {
  return <header className="hub-section-heading">
    <div className="hub-index" aria-hidden="true">{index}</div>
    <div><p>{eyebrow}</p><h1 id={headingId}>{title}</h1>{children}</div>
  </header>;
}

function PartyStatus({ status, changeView }: { status: RoleStatus; changeView: (view: HubView) => void }) {
  return <section className="hub-panel panel-fade" aria-labelledby="party-status-title">
    <SectionHeading index="01" eyebrow="LIVE PARTY RECORD" title="Party Status" headingId="party-status-title">
      <p className="hub-lead">The group is present. The Index is not entirely convinced.</p>
    </SectionHeading>

    <div className="party-status-grid">
      <article className="hub-card party-connection-card">
        <p className="hub-label">PARTY CONNECTION</p>
        <RoleStatusBar status={status} />
        <p>Four signatures confirmed. One compatible signature remains unregistered.</p>
      </article>

      <article className="hub-card hub-objective-card">
        <p className="hub-label">CURRENT OBJECTIVE</p>
        <h2>Survive transportation.</h2>
        <dl className="hub-readout">
          <div><dt>Location</dt><dd>Unknown Road — Sun Territory</dd></div>
          <div><dt>System Condition</dt><dd className="warning-value">Memory synchronization incomplete</dd></div>
          <div><dt>Current Era</dt><dd>Arrival // Day One</dd></div>
        </dl>
        <button className="hub-text-button" type="button" onClick={() => changeView('quests')}>OPEN ACTIVE QUEST ›</button>
      </article>
    </div>

    <div className="hub-card memory-preview">
      <div className="memory-preview-number" aria-hidden="true">001</div>
      <div>
        <p className="hub-label">MOST RECENT MEMORY // THE CART</p>
        <blockquote>“You awoke wearing unfamiliar faces. Four prisoners recognized one another. The fifth place remained empty.”</blockquote>
        <div className="recovery-row"><span>RECOVERED 82%</span><i><b style={{ width: '82%' }} /></i></div>
        <p className="discrepancy-line">Discrepancy: the surviving guard remembers five prisoners.</p>
        <button className="hub-text-button" type="button" onClick={() => changeView('memories')}>ENTER MEMORY ARCHIVE ›</button>
      </div>
    </div>
  </section>;
}

function QuestLog() {
  const leads = ['Examine the wanted posters', 'Question the surviving guard', 'Investigate the Sun Guard shield', 'Locate the owner of the forged baptism papers'];
  return <section className="hub-panel panel-fade" aria-labelledby="quest-log-title">
    <SectionHeading index="02" eyebrow="ACTIVE OBJECTIVES" title="Quest Log" headingId="quest-log-title">
      <p className="hub-lead">What you know, what you suspect, and what the road still demands.</p>
    </SectionHeading>
    <article className="quest-main-card">
      <div className="quest-rank">MAIN QUEST</div>
      <div className="quest-body">
        <p className="hub-label">ACTIVE // DISCOVERY</p>
        <h2>Whose Bodies Are These?</h2>
        <p className="quest-description">Discover why the bodies you woke inside are wanted—and who expected them to be on that cart.</p>
        <div className="quest-divider" />
        <h3>Leads</h3>
        <ol className="quest-leads">{leads.map((lead, index) => <li key={lead}><span>{String(index + 1).padStart(2, '0')}</span><p>{lead}</p><small>{index === 0 ? 'AVAILABLE' : 'UNRESOLVED'}</small></li>)}</ol>
      </div>
    </article>
    <article className="quest-optional-card">
      <div><p className="hub-label">OPTIONAL QUEST</p><h2>Return the Merchant’s Stolen Goat</h2></div>
      <p>Additional condition: learn why it keeps staring at Noah.</p>
      <span>PRIORITY // QUESTIONABLE</span>
    </article>
  </section>;
}

function MemoryArchive() {
  return <section className="hub-panel panel-fade" aria-labelledby="memory-title">
    <SectionHeading index="03" eyebrow="RECOVERED EVENTS" title="Memory Archive" headingId="memory-title">
      <p className="hub-lead">Campaign records are arranged as recovered memory, not as a perfect history.</p>
    </SectionHeading>
    <article className="archive-memory-card">
      <header><div><span>MEMORY 001</span><h2>The Cart</h2></div><strong>82% RECOVERED</strong></header>
      <div className="archive-memory-body">
        <blockquote>“You awoke wearing unfamiliar faces. Four prisoners recognized one another. The fifth place remained empty.”</blockquote>
        <div className="memory-facts">
          <section><h3>Party Recollection</h3><ul><li>Four conscious prisoners recognized one another.</li><li>Each prisoner wore an unfamiliar face.</li><li>The road lay within the Sun Territory.</li></ul></section>
          <section><h3>Known Names &amp; Objects</h3><ul><li>The surviving guard</li><li>A Sun Guard shield</li><li>Forged baptism papers</li></ul></section>
        </div>
        <div className="archive-warning"><span>DISCREPANCY</span><p>The surviving guard remembers five prisoners.</p></div>
      </div>
      <footer><span>RECORDED: ARRIVAL // DAY ONE</span><span>RELIABILITY: CONFLICTING</span></footer>
    </article>
    <article className="locked-memory"><span aria-hidden="true">×</span><div><strong>MEMORY 002</strong><p>Entry locked. Recognition threshold not met.</p></div></article>
  </section>;
}

function PlayerRecords({ onOpenRecords }: { onOpenRecords: () => void }) {
  return <section className="hub-panel panel-fade" aria-labelledby="players-title">
    <SectionHeading index="04" eyebrow="PRIVATE COMPANION FILES" title="Player Records" headingId="players-title">
      <p className="hub-lead">Personal records contain information the rest of the party may not possess.</p>
    </SectionHeading>
    <div className="records-gate">
      <div className="records-seal" aria-hidden="true"><i /><i /><i /></div>
      <p className="hub-label">IDENTITY VERIFICATION REQUIRED</p>
      <h2>Your record is not a character sheet.</h2>
      <p>It tracks what your character knows, what remains uncertain, and which private messages have recognized you.</p>
      <ul><li>Known history and current condition</li><li>Important items, NPCs, and recovered memories</li><li>Private Guide messages and locked discoveries</li></ul>
      <button className="hub-primary-action" type="button" onClick={onOpenRecords}>ACCESS MY RECORD <span>›</span></button>
      <small>First name and returned role may be required.</small>
    </div>
  </section>;
}

function KnownWorld() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...Array.from(new Set(worldEntries.map((entry) => entry.category)))];
  const filtered = useMemo(() => worldEntries.filter((entry) => {
    const categoryMatches = category === 'All' || entry.category === category;
    const queryMatches = `${entry.title} ${entry.summary} ${entry.common} ${entry.discovered}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatches && queryMatches;
  }), [category, query]);

  return <section className="hub-panel panel-fade" aria-labelledby="world-title">
    <SectionHeading index="05" eyebrow="PARTY-ACCESSIBLE LORE" title="Known World" headingId="world-title">
      <p className="hub-lead">The official campaign encyclopedia. Entries separate common belief from party discovery.</p>
    </SectionHeading>
    <div className="world-search-row">
      <label><span>SEARCH RECORDS</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Moon, territory, faction…" /></label>
      <div className="world-categories" aria-label="World record categories">{categories.map((item) => <button type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
    </div>
    <div className="world-records">{filtered.map((entry) => <article className={`world-record world-${entry.state}`} key={entry.title}>
      <header><div><p>{entry.category}</p><h2>{entry.title}</h2></div><span>{entry.reliability}</span></header>
      <p className="world-summary">{entry.summary}</p>
      <dl><div><dt>Common Knowledge</dt><dd>{entry.common}</dd></div><div><dt>Party Discoveries</dt><dd>{entry.discovered}</dd></div></dl>
    </article>)}</div>
    {!filtered.length && <div className="world-empty">NO MATCHING RECORDS // THE INDEX MAY NOT KNOW YET</div>}
  </section>;
}

export default function CampaignHub({ onOpenRecords }: { onOpenRecords: () => void }) {
  const [view, setView] = useState<HubView>('status');
  const [status, setStatus] = useState<RoleStatus>(defaultRoleStatus);

  useEffect(() => {
    fetch('/api/status', { cache: 'no-store' }).then((response) => response.ok ? response.json() as Promise<{ status?: RoleStatus }> : null).then((data) => data?.status && setStatus(data.status)).catch(() => undefined);
  }, []);

  function changeView(next: HubView) {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return <main className="campaign-hub-shell">
    <div className="hub-scanlines" aria-hidden="true" />
    <header className="hub-topbar">
      <div className="hub-wordmark"><span>◈</span><div><strong>WAYFARER</strong><small>CAMPAIGN RECORD // SESSION ONE</small></div></div>
      <div className="hub-integrity"><span>SIGNAL INTEGRITY</span><strong>71%</strong></div>
    </header>
    <nav className="hub-navigation" aria-label="Campaign record">
      {navigation.map((item, index) => <button type="button" className={view === item.id ? 'active' : ''} onClick={() => changeView(item.id)} key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><small>{item.shortLabel}</small></button>)}
    </nav>
    <div className="hub-content">
      {view === 'status' && <PartyStatus status={status} changeView={changeView} />}
      {view === 'quests' && <QuestLog />}
      {view === 'memories' && <MemoryArchive />}
      {view === 'players' && <PlayerRecords onOpenRecords={onOpenRecords} />}
      {view === 'world' && <KnownWorld />}
    </div>
    <footer className="hub-footer"><span>LOCATION: UNKNOWN ROAD</span><span>MEMORY SYNC: INCOMPLETE</span><span>PARTY CONNECTION: 4 / 5</span></footer>
  </main>;
}
