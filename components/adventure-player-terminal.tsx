'use client';
/* eslint-disable @next/next/no-img-element */
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import AdventureMessageList from '@/components/adventure-message-list';
import ChronicleEmblem from '@/components/chronicle-emblem';
import Link from 'next/link';
import type { AdventureMessage, AdventureSession } from '@/lib/adventure-types';

type Connection = { roomCode: string; player: string };
const connectionKey = 'wayfarer-adventure-connection-v1';
const draftKey = (connection: Connection) => `rumerianne-draft:${connection.roomCode.toLowerCase()}:${connection.player.toLowerCase()}`;

export default function AdventurePlayerTerminal() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [entry, setEntry] = useState<Connection>({ roomCode: '', player: '' });
  const [session, setSession] = useState<AdventureSession | null>(null);
  const [text, setText] = useState('');
  const [channel, setChannel] = useState<'guide' | 'party'>('guide');
  const [imageData, setImageData] = useState<string>();
  const [imageName, setImageName] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [whisper, setWhisper] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [online, setOnline] = useState(true);
  const [rollResult, setRollResult] = useState<AdventureMessage | null>(null);
  const lastTyping = useRef(0);
  const connected = useRef(false);
  const writing = useRef<HTMLTextAreaElement>(null);
  const load = useCallback(async (active: Connection) => {
    try {
      const response = await fetch(`/api/adventure?room=${encodeURIComponent(active.roomCode)}&player=${encodeURIComponent(active.player)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('This chapter is closed, or its invitation has changed.');
      const data = await response.json() as { session: AdventureSession; player: string };
      const next = { ...active, player: data.player };
      setSession(data.session); setOnline(true);
      if (!connected.current) {
        connected.current = true; setConnection(next); setStatus('');
        try { const saved = JSON.parse(localStorage.getItem(draftKey(next)) || '{}'); setText(saved.text || ''); setWhisper(saved.whisper || ''); } catch { /* Optional draft. */ }
      }
      try { localStorage.setItem(connectionKey, JSON.stringify(next)); } catch { /* Storage is optional. */ }
    } catch (error) { setOnline(false); setStatus(error instanceof Error ? error.message : 'The connection is quiet. Your draft is still here.'); }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
    try {
      const invitation = sessionStorage.getItem('rumerianne-session-invitation');
      const saved = JSON.parse(invitation || localStorage.getItem(connectionKey) || 'null') as Connection | null;
      if (saved?.roomCode && saved.player) { setEntry(saved); void load(saved); }
      if (invitation) sessionStorage.removeItem('rumerianne-session-invitation');
    } catch { /* Show the entrance if the invitation cannot be read. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => { if (!connection) return; const timer = setInterval(() => void load(connection), 1800); return () => clearInterval(timer); }, [connection, load]);
  useEffect(() => { if (connection) try { localStorage.setItem(draftKey(connection), JSON.stringify({ text, whisper })); } catch { /* The text remains in memory. */ } }, [text, whisper, connection]);
  useEffect(() => {
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setExpanded(false); writing.current?.focus(); } }
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, []);
  async function submit(payload: Record<string, unknown>) {
    if (!connection || sending) return null;
    setSending(true); setStatus('The ink is travelling…');
    try {
      const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...connection, ...payload }) });
      if (!response.ok) { const data = await response.json() as { error?: string }; throw new Error(data.error || 'The message could not be delivered.'); }
      const data = await response.json() as { message?: AdventureMessage }; setStatus('Written into the chapter.'); await load(connection); return data;
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Connection interrupted. Your writing has been kept.'); return null; }
    finally { setSending(false); }
  }
  async function send(event: FormEvent) {
    event.preventDefault(); if (!text.trim() && !imageData) return;
    if (await submit({ action: 'send', channel, text, imageData, imageName })) { setText(''); setImageData(undefined); setImageName(''); }
  }
  function typing(value: string) {
    setText(value); if (!connection || Date.now() - lastTyping.current < 3000) return;
    lastTyping.current = Date.now();
    void fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'typing', ...connection }) }).catch(() => undefined);
  }
  function attach(file?: File) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 1_500_000) { setStatus('Please use a PNG, JPG, WebP, or GIF under 1.5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setImageData(String(reader.result)); setImageName(file.name); };
    reader.onerror = () => setStatus('This illustration could not be read.'); reader.readAsDataURL(file);
  }
  function leave() { try { localStorage.removeItem(connectionKey); } catch { /* No storage. */ } window.location.assign('/'); }
  if (!connection || !session) return <main className="rpg-world rpg-guide-gate"><form className="rpg-sealed-folio" onSubmit={(event) => { event.preventDefault(); void load(entry); }}><ChronicleEmblem /><p className="rpg-kicker">A chapter awaits</p><h1>Follow the invitation</h1><label>Your name<input value={entry.player} onChange={(event) => setEntry({ ...entry, player: event.target.value })} required /></label><label>Your chapter key<input value={entry.roomCode} onChange={(event) => setEntry({ ...entry, roomCode: event.target.value })} required autoComplete="off" /></label><button>Enter the chapter</button><p role="status">{status}</p><Link href="/">Return to the Chronicle</Link></form></main>;
  const reversed = [...(session.reveals ?? session.messages)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sceneImage = reversed.find((message) => message.sender === 'guide' && message.imageData && message.kind !== 'whisper');
  const illumination = reversed.find((message) => message.sender === 'guide' && (message.ui || message.kind === 'system' || message.kind === 'warning'));
  const transcript = session.messages.filter((message) => ['narration', 'dialogue'].includes(message.kind) && !message.ui);
  const whispers = session.messages.filter((message) => message.kind === 'whisper');
  const pending = session.rollRequests[0];
  const thinking = session.typing.some((item) => item.role === 'guide');
  return <main className={`rpg-world rpg-live${expanded ? ' is-writing-expanded' : ''}`}>
    <header className="rpg-session-heading"><div><p className="rpg-kicker">{connection.player} · A living chapter</p><h1>{session.title}</h1></div><button onClick={leave}>Close the chapter</button></header>
    <div className="rpg-live-book">
      <section className="rpg-scene-leaf" aria-label="The Guide’s reveals">
        <p className="rpg-kicker">Through the veil</p>
        <div className="rpg-scene-window">
          {sceneImage?.imageData ? <img className="rpg-scene-art" src={sceneImage.imageData} alt={sceneImage.imageName || 'The scene revealed by the Guide'} /> : <div className="rpg-scene-empty"><ChronicleEmblem /><p>The world is listening.</p></div>}
          {illumination && !pending && !rollResult && <article className={`rpg-illumination ${illumination.ui?.type || 'system'}`} aria-live="polite"><p className="rpg-kicker">{illumination.ui?.type || 'A message'}</p><h2>{illumination.ui?.title || 'Words through the veil'}</h2><p>{illumination.text}</p></article>}
          {pending ? <section className="rpg-fate" aria-live="polite"><p className="rpg-kicker">The Guide asks</p><h2>{pending.label}</h2>{pending.prompt && <p>{pending.prompt}</p>}<div className="rpg-die" aria-hidden="true">{pending.sides}</div><p>d{pending.sides}{pending.modifier ? ` ${pending.modifier > 0 ? '+' : '−'} ${Math.abs(pending.modifier)}` : ''}</p><button disabled={sending || !online} onClick={async () => { const result = await submit({ action: 'roll', requestId: pending.id }); if (result?.message) setRollResult(result.message); }}>Cast the die</button></section> : rollResult?.roll && <section className="rpg-fate" aria-live="polite"><p className="rpg-kicker">Your result</p><strong className="rpg-roll-total">{rollResult.roll.total}</strong><p>Die: {rollResult.roll.result} · Modifier: {rollResult.roll.modifier}</p><p>The Guide will tell you what follows.</p><button onClick={() => setRollResult(null)}>Return to the scene</button></section>}
        </div>
        <p className="rpg-scene-caption">{session.scene}</p>
      </section>
      <section className="rpg-writing-leaf" aria-label="The unfolding story">
        <header className="rpg-writing-heading"><h2>The unfolding story</h2><button onClick={() => { setExpanded(!expanded); writing.current?.focus(); }}>{expanded ? 'Return to both pages' : 'More writing room'}</button></header>
        <div className="rpg-conversation" data-conversation-scroll><AdventureMessageList messages={transcript} playerName={connection.player} /></div>
        <p className="rpg-thinking" aria-live="polite">{thinking ? '…the gods are thinking…' : '\u00a0'}</p>
        <form className="rpg-response" onSubmit={send}>
          <label className="rpg-kicker" htmlFor="chapter-response">Your words & actions</label>
          <textarea ref={writing} id="chapter-response" rows={7} maxLength={16000} value={text} onChange={(event) => typing(event.target.value)} placeholder="What do you say? What do you do?" />
          {imageData && <div className="rpg-attachment"><img src={imageData} alt="Your attached illustration" /><span>{imageName}</span><button type="button" onClick={() => setImageData(undefined)}>Remove</button></div>}
          <div className="rpg-response-tools"><label><span className="archive-sr-only">Send response to</span><select value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}><option value="guide">Only the Guide</option><option value="party">The whole party</option></select></label><label className="rpg-attach-button">Attach image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { attach(event.target.files?.[0]); event.target.value = ''; }} /></label><button disabled={sending || !online || (!text.trim() && !imageData)}>{sending ? 'Writing…' : 'Send response →'}</button></div>
        </form>
        <details className="rpg-whispers"><summary>Whisper to the Guide · outside the story{whispers.length > 0 ? ` (${whispers.length})` : ''}</summary><p>Private between you and the Guide. Never shown on the shared display.</p><div className="rpg-whisper-history" data-conversation-scroll><AdventureMessageList messages={whispers} playerName={connection.player} /></div><form onSubmit={async (event) => { event.preventDefault(); if (await submit({ action: 'send', kind: 'whisper', channel: 'guide', text: whisper })) setWhisper(''); }}><label htmlFor="private-note">Your private note</label><textarea id="private-note" rows={3} maxLength={16000} value={whisper} onChange={(event) => setWhisper(event.target.value)} /><button disabled={sending || !online || !whisper.trim()}>Send whisper</button></form></details>
        <p className="rpg-delivery-status" role="status">{status}</p>
        <small className="rpg-private-reminder">Your personal book may contain private information. Use the Shared Display for a public stream.</small>
      </section>
    </div>
  </main>;
}
