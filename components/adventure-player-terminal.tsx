'use client';
/* eslint-disable @next/next/no-img-element -- local previews use player-provided data URLs */

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import AdventureMessageList from '@/components/adventure-message-list';
import MagicalBookPortal from '@/components/magical-book-portal';
import type { AdventureSession } from '@/lib/adventure-types';

type Connection = { roomCode: string; player: string };
const connectionKey = 'wayfarer-adventure-connection-v1';

async function imageFromFile(file?: File) {
  if (!file) return undefined;
  if (!file.type.startsWith('image/') || file.size > 1_500_000) throw new Error('Choose an image smaller than 1.5 MB.');
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The image could not be read.')); reader.readAsDataURL(file); });
}

export default function AdventurePlayerTerminal() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [entry, setEntry] = useState<Connection>({ roomCode: '', player: '' });
  const [session, setSession] = useState<AdventureSession | null>(null);
  const [text, setText] = useState('');
  const [channel, setChannel] = useState<'guide' | 'party'>('guide');
  const [imageData, setImageData] = useState<string>();
  const [imageName, setImageName] = useState('');
  const [status, setStatus] = useState('ENTER THE THREAD WHEN THE GUIDE INVITES YOU');
  const [sending, setSending] = useState(false);
  const [whisper, setWhisper] = useState('');
  const lastTyping = useRef(0);

  const load = useCallback(async (activeConnection: Connection, silent = false) => {
    try {
      const response = await fetch(`/api/adventure?room=${encodeURIComponent(activeConnection.roomCode)}&player=${encodeURIComponent(activeConnection.player)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('CONNECTION NOT RECOGNIZED');
      const result = await response.json() as { session: AdventureSession; player: string };
      setSession(result.session); setConnection({ ...activeConnection, player: result.player });
      window.localStorage.setItem(connectionKey, JSON.stringify({ ...activeConnection, player: result.player }));
      if (!silent) setStatus('THREAD RESTORED');
    } catch { if (!silent) setStatus('CONNECTION NOT RECOGNIZED'); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { try { const saved = JSON.parse(window.localStorage.getItem(connectionKey) || 'null') as Connection | null; if (saved) { setEntry(saved); void load(saved, true); } } catch { /* Ignore an invalid local connection. */ } }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => { if (!connection) return; const timer = window.setInterval(() => void load(connection, true), 1800); return () => window.clearInterval(timer); }, [connection, load]);

  async function connect(event: FormEvent) { event.preventDefault(); setStatus('SEEKING THREAD...'); await load(entry); }
  async function sendTyping() { if (!connection || Date.now() - lastTyping.current < 3000) return; lastTyping.current = Date.now(); await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'typing', ...connection }) }); }
  async function selectImage(event: ChangeEvent<HTMLInputElement>) { try { const file = event.target.files?.[0]; setImageData(await imageFromFile(file)); setImageName(file?.name || ''); setStatus('VISUAL RECORD READY'); } catch (error) { setStatus(error instanceof Error ? error.message.toUpperCase() : 'IMAGE REJECTED'); } }

  async function sendMessage(event: FormEvent) {
    event.preventDefault(); if (!connection || (!text.trim() && !imageData)) return;
    setSending(true); setStatus('TRANSMITTING...');
    const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', ...connection, channel, text, imageData, imageName }) });
    if (response.ok) { setText(''); setImageData(undefined); setImageName(''); setStatus('RESPONSE RECORDED'); await load(connection, true); } else setStatus('TRANSMISSION FAILED');
    setSending(false);
  }

  async function roll(requestId: string) {
    if (!connection) return; setSending(true); setStatus('FATE IS TURNING...');
    const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'roll', ...connection, requestId }) });
    setStatus(response.ok ? 'THE RESULT HAS BEEN RECORDED' : 'ROLLING IS NOT AVAILABLE'); if (response.ok) await load(connection, true); setSending(false);
  }

  async function sendWhisper(event: FormEvent) {
    event.preventDefault(); if (!connection || !whisper.trim()) return; setSending(true); setStatus('WHISPERING BEYOND THE STORY...');
    const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', ...connection, channel: 'guide', kind: 'whisper', text: whisper }) });
    if (response.ok) { setWhisper(''); setStatus('YOUR WHISPER REACHED THE GUIDE'); await load(connection, true); } else setStatus('THE WHISPER DID NOT REACH THE GUIDE'); setSending(false);
  }

  function disconnect() { window.localStorage.removeItem(connectionKey); setConnection(null); setSession(null); setStatus('CONNECTION CLOSED'); }

  if (!connection || !session) return <main className="adventure-gate"><div className="adventure-stars" aria-hidden="true" /><form onSubmit={connect}><p>WAYFARER // PRIVATE THREAD</p><h1>A message waits beyond the veil.</h1><span>Enter only the name and thread key given to you by the Guide.</span><label>YOUR NAME<input value={entry.player} onChange={(event) => setEntry((current) => ({ ...current, player: event.target.value }))} autoComplete="off" /></label><label>THREAD KEY<input value={entry.roomCode} onChange={(event) => setEntry((current) => ({ ...current, roomCode: event.target.value }))} autoComplete="off" /></label><button disabled={!entry.player.trim() || !entry.roomCode.trim()}>OPEN THE THREAD</button><small>{status}</small></form></main>;

  const guideTyping = session.typing.some((item) => item.role === 'guide');
  const othersTyping = session.typing.filter((item) => item.role === 'player');
  const latestImage = [...session.messages].reverse().find((message) => message.imageData);

  return <main className="live-book-stage">
    <header className="live-book-heading"><div><p>{connection.player.toUpperCase()} · LIVE CHAPTER</p><h1>{session.title}</h1><span>{session.scene}</span></div><button onClick={disconnect}>Return to my Chronicle</button></header>
    <div className="live-book-spread">
      <section className="live-book-page live-book-visual-page">
        {latestImage?.imageData ? <figure className="live-mounted-image"><img src={latestImage.imageData} alt={latestImage.imageName || 'An illustration revealed by the Guide'} /><figcaption>{latestImage.imageName || 'A revealed illustration'}</figcaption></figure> : <MagicalBookPortal active phrase={guideTyping ? 'The unseen hand is writing.' : undefined} />}
        <p className="threshold-caption">The star inside the lantern has opened the Threshold Page.</p>
      </section>
      <div className="live-book-gutter" aria-hidden="true"><span>✦</span></div>
      <section className="live-book-page live-book-writing-page">
        <div className="live-adventure-log"><AdventureMessageList messages={session.messages} playerName={connection.player} />{guideTyping && <div className="adventure-thinking"><i /><span>THE GUIDE IS CONSIDERING…</span></div>}{othersTyping.length > 0 && <div className="adventure-thinking"><i /><span>ANOTHER HAND MOVES ACROSS THE PAGE…</span></div>}</div>
        {session.rollRequests.map((request) => <section className="adventure-roll-command manuscript-roll-request" key={request.id} aria-live="assertive"><div className="roll-command-sigil" aria-hidden="true">◆</div><header><span>A SEAL HAS FORMED</span><strong>{request.label}</strong></header>{request.prompt && <p>{request.prompt}</p>}<div><small>d{request.sides}{request.modifier ? ` ${request.modifier > 0 ? '+' : '−'} ${Math.abs(request.modifier)}` : ''}</small><button type="button" disabled={sending} onClick={() => roll(request.id)}>Cast the requested die</button></div></section>)}
        <details className="live-response-fold"><summary>Write into the chapter</summary><form onSubmit={sendMessage}>
          <label>WHO SHOULD RECEIVE IT?<select value={channel} onChange={(event) => setChannel(event.target.value as 'guide' | 'party')}><option value="guide">Only the Guide</option><option value="party">Everyone in the chapter</option></select></label>
          <label>YOUR RESPONSE<textarea rows={6} value={text} onChange={(event) => { setText(event.target.value); void sendTyping(); }} placeholder="Describe what you say, attempt, notice, or do..." /></label>
          {imageData && <div className="adventure-image-ready"><img src={imageData} alt="Ready to send" /><button type="button" onClick={() => { setImageData(undefined); setImageName(''); }}>Remove</button></div>}
          <label className="adventure-file">Place an image between the pages<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectImage} /></label>
          <button className="adventure-send" disabled={sending || (!text.trim() && !imageData)}>Write the response</button>
        </form></details>
        <details className="adventure-whisper live-whisper-note"><summary>Slip a private note to the Guide</summary><form onSubmit={sendWhisper}><p>This is outside the story and cannot be seen by other players.</p><textarea rows={4} value={whisper} onChange={(event) => setWhisper(event.target.value)} placeholder="Can I ask what my character would know here?" /><button type="submit" disabled={sending || !whisper.trim()}>Fold the private note</button></form></details>
        <p className="adventure-status">{status}</p>
      </section>
    </div>
  </main>;
}
