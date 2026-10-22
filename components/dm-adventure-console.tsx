'use client';
/* eslint-disable @next/next/no-img-element */
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import AdventureMessageList from '@/components/adventure-message-list';
import ChronicleEmblem from '@/components/chronicle-emblem';
import type { AdventureSession } from '@/lib/adventure-types';

type FormKind = 'Narration' | 'Whisper' | 'Image' | 'Notice' | 'Quest' | 'Die';
type Draft = { kind: FormKind; recipient: string; text: string; title: string; window: 'system' | 'quest' | 'guidance' | 'memory' | 'warning' | 'error'; die: number; modifier: number };
const blankDraft: Draft = { kind: 'Narration', recipient: 'all', text: '', title: '', window: 'system', die: 20, modifier: 0 };
const draftKey = 'rumerianne-guide-reveal-draft-v1';

export default function DmAdventureConsole() {
  const [session, setSession] = useState<AdventureSession | null>(null);
  const [setup, setSetup] = useState<AdventureSession | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [draftReady, setDraftReady] = useState(false);
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [status, setStatus] = useState('Opening the folio…');
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<Record<string, string>>({});
  const typingAt = useRef(0);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const load = useCallback(async (syncSetup = false) => {
    try {
      const response = await fetch('/api/adventure?view=guide', { cache: 'no-store' });
      if (!response.ok) throw new Error('The folio is locked. Refresh to enter the private phrase.');
      const data = await response.json() as { session: AdventureSession };
      setSession(data.session); if (syncSetup) { setSetup(data.session); setStatus('Your preparations are private until you reveal them.'); }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'The connection was interrupted.'); }
  }, []);
  useEffect(() => {
    const restore = setTimeout(() => {
    void load(true);
    try { const saved = JSON.parse(localStorage.getItem(draftKey) || 'null'); if (saved) setDraft({ ...blankDraft, ...saved }); } catch { /* Ignore a damaged draft. */ }
    setDraftReady(true);
    }, 0);
    const timer = setInterval(() => void load(), 1800);
    return () => { clearInterval(timer); clearTimeout(restore); };
  }, [load]);
  useEffect(() => { if (draftReady) try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* Remains in memory. */ } }, [draft, draftReady]);
  async function action(payload: Record<string, unknown>) {
    if (busy) return false;
    setBusy(true);
    try {
      const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'The reveal did not reach its destination.');
      await load(); setStatus('The chapter has been updated.'); return true;
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Connection interrupted. Your draft has been kept.'); return false; }
    finally { setBusy(false); }
  }
  function write(value: string) {
    set('text', value);
    if (Date.now() - typingAt.current < 3000 || draft.kind === 'Whisper' || draft.recipient === 'guide') return;
    typingAt.current = Date.now();
    // Only a generic writing indicator is transmitted; draft content stays on this device.
    void fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'typing' }) }).catch(() => undefined);
  }
  function selectImage(file?: File) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 1_500_000) { setStatus('Choose a PNG, JPG, WebP, or GIF smaller than 1.5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setImage(String(reader.result)); setImageName(file.name); };
    reader.onerror = () => setStatus('This illustration could not be read.'); reader.readAsDataURL(file);
  }
  async function reveal(event: FormEvent) {
    event.preventDefault();
    const payload = draft.kind === 'Die'
      ? { action: 'request-roll', recipient: draft.recipient, label: draft.title || 'Wisdom check', prompt: draft.text, sides: draft.die, modifier: draft.modifier }
      : { action: 'send', recipient: draft.recipient, kind: draft.kind === 'Whisper' ? 'whisper' : ['Notice', 'Quest'].includes(draft.kind) ? 'system' : 'narration', text: draft.text, uiTitle: draft.title, uiType: draft.kind === 'Quest' ? 'quest' : draft.window, imageData: draft.kind === 'Image' ? image : undefined, imageName };
    if (await action(payload)) { setDraft((current) => ({ ...current, text: '', title: '' })); setImage(''); setStatus(draft.kind === 'Die' ? 'The requested die is waiting on the player’s left page.' : 'Revealed. Your next draft will remain private.'); }
  }
  if (!session || !setup) return <p role="status">{status}</p>;
  const needsPlayer = draft.kind === 'Whisper' || draft.kind === 'Die';
  const validPlayer = session.players.includes(draft.recipient);
  const publicMessages = [...(session.reveals ?? session.messages)].filter((message) => ['all', 'display'].includes(message.recipient)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const currentImage = publicMessages.find((message) => message.imageData);
  const currentNotice = publicMessages.find((message) => message.ui);
  const currentNarration = [...session.messages].reverse().find((message) => ['all', 'display'].includes(message.recipient) && message.kind === 'narration' && !message.imageData);
  const canReveal = !!draft.recipient && (!needsPlayer || validPlayer) && (draft.kind === 'Die' || (draft.kind === 'Image' ? !!image : !!draft.text.trim()));
  return <section className="rpg-workbench">
    <div className="rpg-display-launch"><a href="/display" target="rumerianne-shared-display">Open Shared Display ↗</a><span>Keep this folio on your laptop. Put that separate window on the TV.</span></div>
    <details className="rpg-session-setup">
      <summary>{session.active ? 'Chapter open' : 'Chapter closed'} · {session.title} <span>Prepare session</span></summary>
      <div className="rpg-setup-fields">
        <label>Chapter title<input value={setup.title} maxLength={120} onChange={(event) => setSetup({ ...setup, title: event.target.value })} /></label>
        <label>Gathering<select value={setup.mode} onChange={(event) => setSetup({ ...setup, mode: event.target.value as AdventureSession['mode'] })}><option value="in-person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label>
        <label>Chapter key<input value={setup.roomCode} maxLength={40} onChange={(event) => setSetup({ ...setup, roomCode: event.target.value })} /></label>
        <label>Invited players · one per line<textarea value={setup.players.join('\n')} onChange={(event) => setSetup({ ...setup, players: event.target.value.split('\n') })} rows={4} /></label>
        <label className="rpg-wide-field">Scene caption<textarea value={setup.scene} maxLength={400} rows={2} onChange={(event) => setSetup({ ...setup, scene: event.target.value })} /></label>
        <label className="rpg-check"><input type="checkbox" checked={setup.active} onChange={(event) => setSetup({ ...setup, active: event.target.checked })} /> Invite players into this chapter</label>
        <label className="rpg-check"><input type="checkbox" checked={setup.diceEnabled} onChange={(event) => setSetup({ ...setup, diceEnabled: event.target.checked })} /> Allow requested dice</label>
        <button disabled={busy || (setup.active && (!setup.roomCode.trim() || !setup.players.some((name) => name.trim())))} onClick={async () => { if (await action({ ...setup, action: 'setup' })) await load(true); }}>Save chapter settings</button>
      </div>
      <p>Use <a href="/display" target="_blank" rel="noreferrer">the Shared Display</a> for the TV or Discord stream. Players enter through <a href="/adventure" target="_blank" rel="noreferrer">their own book</a>. Give them the chapter key above.</p>
    </details>
    <div className="rpg-workbench-grid">
      <form className="rpg-draft-desk" onSubmit={reveal}>
        <p className="rpg-kicker">Prepare a little magic</p><h2>What will you place in the world?</h2>
        <div className="rpg-cue-tools" aria-label="Reveal type">{(['Narration', 'Whisper', 'Image', 'Notice', 'Quest', 'Die'] as FormKind[]).map((kind) => <button key={kind} type="button" aria-pressed={draft.kind === kind} onClick={() => { set('kind', kind); if (['Whisper', 'Die'].includes(kind) && !validPlayer) set('recipient', session.players[0] || ''); }}>{kind}</button>)}</div>
        <label>Who will receive this?<select value={draft.recipient} onChange={(event) => set('recipient', event.target.value)}><option value="" disabled>Choose a player</option>{!needsPlayer && <><option value="all">Shared Display + all players</option><option value="players">All personal books</option><option value="guide">My private notes only</option></>}{session.players.map((player) => <option key={player} value={player}>Only {player}</option>)}</select></label>
        {['Notice', 'Quest', 'Die'].includes(draft.kind) && <label>{draft.kind === 'Die' ? 'Requested check' : 'Inscription title'}<input maxLength={80} value={draft.title} onChange={(event) => set('title', event.target.value)} placeholder={draft.kind === 'Die' ? 'Wisdom check' : 'A new path opens'} /></label>}
        {draft.kind === 'Notice' && <label>Illumination<select value={draft.window} onChange={(event) => set('window', event.target.value as Draft['window'])}>{['system', 'guidance', 'memory', 'warning', 'error'].map((kind) => <option key={kind}>{kind}</option>)}</select></label>}
        {draft.kind === 'Die' && <div className="rpg-dice-fields"><label>Die<select value={draft.die} onChange={(event) => set('die', Number(event.target.value))}>{[4, 6, 8, 10, 12, 20, 100].map((die) => <option key={die} value={die}>d{die}</option>)}</select></label><label>Modifier<input type="number" min={-20} max={20} value={draft.modifier} onChange={(event) => set('modifier', Number(event.target.value))} /></label></div>}
        <label>{draft.kind === 'Die' ? 'What are they attempting?' : 'Your words'}<textarea rows={8} maxLength={draft.kind === 'Die' ? 300 : 16000} value={draft.text} onChange={(event) => write(event.target.value)} placeholder="Let the scene unfold…" /></label>
        {draft.kind === 'Image' && <label>Choose an illustration<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => selectImage(event.target.files?.[0])} /><small>Under 1.5 MB. Attachments are not saved with local drafts.</small></label>}
        <p className="rpg-draft-note">Private draft. Nothing here is revealed until you choose.</p>
        <button className="rpg-reveal-action" disabled={busy || !canReveal}>{busy ? 'Sending…' : draft.kind === 'Die' ? 'Request this roll →' : draft.recipient === 'guide' ? 'Keep as a private note' : 'Reveal to the chosen audience →'}</button>
      </form>
      <section className="rpg-scrying-desk">
        <p className="rpg-kicker">In the scrying basin · private preview</p>
        <div className={`rpg-scrying-basin cue-${draft.kind.toLowerCase()}`}>
          {draft.kind === 'Image' && image ? <img src={image} alt="Unpublished illustration preview" /> : <ChronicleEmblem />}
          {draft.kind === 'Die' && <div className="rpg-die">{draft.die}</div>}
          <h2>{draft.title || (draft.kind === 'Die' ? 'Wisdom check' : draft.kind)}</h2>
          <p>{draft.text || 'Your next reveal gathers here.'}</p>
          <small>{needsPlayer ? `For ${draft.recipient || 'a chosen player'}` : draft.recipient === 'all' ? 'Shared with the whole gathering' : draft.recipient === 'guide' ? 'Only you' : `For ${draft.recipient}`}</small>
        </div>
        <details className="rpg-current-display" open><summary>Players see now · shared display</summary><div>{currentImage?.imageData && <img src={currentImage.imageData} alt={currentImage.imageName || 'Current shared illustration'} />}{currentNotice ? <><h3>{currentNotice.ui?.title}</h3><p>{currentNotice.text}</p><button disabled={busy} onClick={() => action({ action: 'clear-notice', recipient: 'all' })}>Dismiss shared notice · keep scene</button></> : <p>{currentNarration?.text || 'The current page is quiet.'}</p>}</div></details>
      </section>
    </div>
    <section className="rpg-guide-correspondence"><h2>Words returning to you</h2><div className="rpg-guide-log" data-conversation-scroll><AdventureMessageList messages={session.messages} guideView /></div>{session.typing.filter((item) => item.role === 'player').map((item) => <p key={item.name}>{item.name} is choosing their words…</p>)}</section>
    {session.rollRequests.length > 0 && <section className="rpg-pending-dice"><h3>Awaiting a roll</h3>{session.rollRequests.map((request) => <div key={request.id}><span>{request.player} · {request.label}</span><label>Physical die result<input type="number" min={1} max={request.sides} value={manual[request.id] || ''} onChange={(event) => setManual({ ...manual, [request.id]: event.target.value })} /></label><button disabled={busy || !manual[request.id]} onClick={() => action({ action: 'confirm-roll', requestId: request.id, result: Number(manual[request.id]) })}>Record physical roll</button><button disabled={busy} onClick={() => action({ action: 'cancel-roll', requestId: request.id })}>Withdraw</button></div>)}</section>}
    <footer className="rpg-workbench-footer"><p role="status">{status}</p><button disabled={busy} onClick={() => { if (window.confirm('Clear this live conversation, its revealed scenes, and pending rolls? This cannot be undone. Your Chronicle records and private drafts are not changed.')) void action({ action: 'clear' }); }}>Clear this chapter’s conversation</button></footer>
  </section>;
}
