'use client';
/* eslint-disable @next/next/no-img-element -- local previews use player-provided data URLs */

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import AdventureMessageList from '@/components/adventure-message-list';
import type { AdventureMessageKind, AdventureSession, AdventureSessionMode } from '@/lib/adventure-types';

const dmKeyStorage = 'wayfarer-adventure-dm-key';

async function imageFromFile(file?: File) {
  if (!file) return undefined;
  if (!file.type.startsWith('image/') || file.size > 1_500_000) throw new Error('Choose an image smaller than 1.5 MB.');
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The image could not be read.')); reader.readAsDataURL(file); });
}

export default function DmAdventureConsole() {
  const [dmKey, setDmKey] = useState('');
  const [keyEntry, setKeyEntry] = useState('');
  const [session, setSession] = useState<AdventureSession | null>(null);
  const [title, setTitle] = useState('Unwritten One-Shot');
  const [scene, setScene] = useState('The connection has not yet opened.');
  const [sessionMode, setSessionMode] = useState<AdventureSessionMode>('in-person');
  const [roomCode, setRoomCode] = useState('');
  const [playersText, setPlayersText] = useState('');
  const [active, setActive] = useState(false);
  const [diceEnabled, setDiceEnabled] = useState(true);
  const [recipient, setRecipient] = useState('display');
  const [kind, setKind] = useState<AdventureMessageKind>('narration');
  const [text, setText] = useState('');
  const [imageData, setImageData] = useState<string>();
  const [imageName, setImageName] = useState('');
  const [status, setStatus] = useState('GUIDE CONSOLE LOCKED');
  const [confirmClear, setConfirmClear] = useState(false);
  const [sending, setSending] = useState(false);
  const [rollPlayer, setRollPlayer] = useState('');
  const [rollLabel, setRollLabel] = useState('WISDOM CHECK');
  const [rollPrompt, setRollPrompt] = useState('');
  const [rollDie, setRollDie] = useState(20);
  const [rollModifier, setRollModifier] = useState(0);
  const [uiRecipient, setUiRecipient] = useState('display');
  const [uiType, setUiType] = useState<'system' | 'quest' | 'guidance' | 'memory' | 'warning' | 'error'>('system');
  const [uiTitle, setUiTitle] = useState('SYSTEM NOTICE');
  const [uiText, setUiText] = useState('');
  const lastTyping = useRef(0);

  const applySession = useCallback((next: AdventureSession) => {
    setSession(next); setTitle(next.title); setScene(next.scene); setSessionMode(next.mode || 'in-person'); setRoomCode(next.roomCode); setPlayersText(next.players.join('\n')); setActive(next.active); setDiceEnabled(next.diceEnabled);
  }, []);

  const load = useCallback(async (key: string, silent = false, syncSetup = true) => {
    try {
      const response = await fetch('/api/adventure?view=guide', { headers: { 'x-wayfarer-dm-key': key }, cache: 'no-store' });
      if (!response.ok) throw new Error('Authorization failed');
      const result = await response.json() as { session: AdventureSession }; setSession(result.session); if (syncSetup) applySession(result.session); setDmKey(key); window.sessionStorage.setItem(dmKeyStorage, key); if (!silent) setStatus('GUIDE CONSOLE CONNECTED'); return true;
    } catch { if (!silent) setStatus('GUIDE KEY NOT RECOGNIZED'); return false; }
  }, [applySession]);

  useEffect(() => { const timer = window.setTimeout(() => { const saved = window.sessionStorage.getItem(dmKeyStorage); if (saved) { setKeyEntry(saved); void load(saved, true); } }, 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (!dmKey) return; const timer = window.setInterval(() => void load(dmKey, true, false), 1800); return () => window.clearInterval(timer); }, [dmKey, load]);

  async function unlock(event: FormEvent) { event.preventDefault(); setStatus('AUTHORIZING GUIDE...'); await load(keyEntry); }
  async function saveSetup() {
    setStatus('WRITING SESSION PARAMETERS...');
    const players = playersText.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
    const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setup', dmKey, title, scene, mode: sessionMode, roomCode, players, active, diceEnabled }) });
    if (response.ok) { const result = await response.json() as { session: AdventureSession }; applySession(result.session); setStatus('SESSION PARAMETERS SAVED'); } else setStatus('SESSION SAVE FAILED');
  }

  async function sendTyping() { if (!dmKey || Date.now() - lastTyping.current < 3000) return; lastTyping.current = Date.now(); await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'typing', dmKey }) }); }
  async function selectImage(event: ChangeEvent<HTMLInputElement>) { try { const file = event.target.files?.[0]; setImageData(await imageFromFile(file)); setImageName(file?.name || ''); setStatus('VISUAL RECORD READY'); } catch (error) { setStatus(error instanceof Error ? error.message.toUpperCase() : 'IMAGE REJECTED'); } }
  async function send(event: FormEvent) {
    event.preventDefault(); if (!text.trim() && !imageData) return; setSending(true); setStatus('TRANSMITTING TO THREAD...');
    const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', dmKey, recipient, kind, text, imageData, imageName }) });
    if (response.ok) { setText(''); setImageData(undefined); setImageName(''); setStatus('MESSAGE ENTERED INTO THE THREAD'); await load(dmKey, true, false); } else setStatus('TRANSMISSION FAILED'); setSending(false);
  }
  async function clearTranscript() { const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clear', dmKey }) }); if (response.ok) { setConfirmClear(false); setStatus('TRANSCRIPT CLEARED'); await load(dmKey, true, false); } }
  async function requestRoll(event: FormEvent) {
    event.preventDefault(); if (!rollPlayer) return; setSending(true); setStatus(`SUMMONING ${rollPlayer.toUpperCase()} TO ROLL...`);
    const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'request-roll', dmKey, recipient: rollPlayer, label: rollLabel, prompt: rollPrompt, sides: rollDie, modifier: rollModifier }) });
    if (response.ok) { setRollPrompt(''); setStatus(`ROLL REQUEST SENT TO ${rollPlayer.toUpperCase()}`); await load(dmKey, true, false); } else setStatus('ROLL REQUEST FAILED'); setSending(false);
  }
  async function cancelRoll(requestId: string) {
    const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel-roll', dmKey, requestId }) });
    if (response.ok) { setStatus('ROLL REQUEST WITHDRAWN'); await load(dmKey, true, false); }
  }
  async function sendUiMessage(event: FormEvent) {
    event.preventDefault(); if (!uiText.trim()) return; setSending(true); setStatus('OPENING SYSTEM WINDOW...');
    const response = await fetch('/api/adventure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', dmKey, recipient: uiRecipient, kind: 'system', text: uiText, uiType, uiTitle }) });
    if (response.ok) { setUiText(''); setStatus('UI MESSAGE DISPLAYED'); await load(dmKey, true, false); } else setStatus('UI MESSAGE FAILED'); setSending(false);
  }

  if (!dmKey || !session) return <section className="dm-adventure-lock"><form onSubmit={unlock}><p>PRIVATE TOOL // GUIDE ONLY</p><h2>Open the Adventure Terminal</h2><span>On the local preview, use <strong>wayfarer-local</strong>. On Render, use the private key you place in the WAYFARER_DM_KEY setting.</span><label>GUIDE KEY<input type="password" value={keyEntry} onChange={(event) => setKeyEntry(event.target.value)} /></label><button disabled={!keyEntry}>UNLOCK CONSOLE</button><small>{status}</small></form></section>;

  const playerTyping = session.typing.filter((item) => item.role === 'player');
  return <section className="dm-adventure-console">
    <aside className="dm-adventure-setup">
      <header><p>TEXT ADVENTURE // SESSION CONTROL</p><h2>Build the private thread</h2></header>
      <label>SESSION MODE<select value={sessionMode} onChange={(event) => setSessionMode(event.target.value as AdventureSessionMode)}><option value="in-person">In Person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select><small>This changes presentation only. It never creates a separate session.</small></label>
      <label>ONE-SHOT TITLE<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>CURRENT SCENE / LOCATION<textarea rows={3} value={scene} onChange={(event) => setScene(event.target.value)} /></label>
      <label>THREAD KEY FOR PLAYERS<input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} placeholder="Example: SUN-17" /></label>
      <label>INVITED PLAYERS <small>One name per line. One player works perfectly; add more whenever needed.</small><textarea rows={5} value={playersText} onChange={(event) => setPlayersText(event.target.value)} placeholder={'Traveler One\nTraveler Two'} /></label>
      <div className="dm-adventure-switches"><label><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Thread open to players</label><label><input type="checkbox" checked={diceEnabled} onChange={(event) => setDiceEnabled(event.target.checked)} /> Enable Guide roll requests</label></div>
      <button className="adventure-primary" onClick={saveSetup}>SAVE SESSION SETUP</button>
      <div className="adventure-share-route"><span>PLAYER ENTRANCE</span><strong>/adventure</strong><button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/adventure`)}>COPY ADDRESS</button></div>
      <details><summary>HOW TO RUN A ONE-ON-ONE</summary><ol><li>Add the player’s name above.</li><li>Choose a private thread key.</li><li>Turn on “Thread open.”</li><li>Send the player the address and key.</li><li>Write narration and wait for their response.</li></ol></details>
    </aside>

    <main className="dm-adventure-main">
      <header className="dm-adventure-scene"><div><span>LIVE NARRATIVE THREAD</span><h2>{session.title}</h2><p>{session.scene}</p></div><div className={session.active ? 'is-live' : ''}><i />{session.active ? 'OPEN' : 'CLOSED'}</div></header>
      <div className="dm-adventure-log"><AdventureMessageList messages={session.messages} guideView />{playerTyping.length > 0 && <div className="adventure-thinking"><i /><span>{playerTyping.map((item) => item.name.toUpperCase()).join(', ')} {playerTyping.length === 1 ? 'IS' : 'ARE'} CHOOSING THEIR WORDS...</span></div>}</div>
      <form className="dm-adventure-composer" onSubmit={send}>
        <div><label>DESTINATION<select value={recipient} onChange={(event) => setRecipient(event.target.value)}><option value="display">Shared Display + all players</option><option value="players">All personal Player Books</option><option value="guide">DM notes only</option>{session.players.map((player) => <option key={player} value={player}>Only {player}</option>)}</select></label><label>MESSAGE FORM<select value={kind} onChange={(event) => { const nextKind = event.target.value as AdventureMessageKind; setKind(nextKind); if (nextKind === 'whisper' && ['all', 'display', 'players', 'guide'].includes(recipient) && session.players[0]) setRecipient(session.players[0]); }}><option value="narration">Narration</option><option value="dialogue">Voice / dialogue</option><option value="system">UI system notice</option><option value="warning">Warning / interruption</option><option value="whisper">Private whisper · out of game</option></select></label></div>
        <label>WRITE INTO THE WORLD<textarea rows={5} value={text} onChange={(event) => { setText(event.target.value); void sendTyping(); }} placeholder="The corridor answers with a second set of footsteps..." /></label>
        {imageData && <div className="adventure-image-ready"><img src={imageData} alt="Ready to send" /><span>{imageName}</span><button type="button" onClick={() => { setImageData(undefined); setImageName(''); }}>REMOVE</button></div>}
        <footer><label className="adventure-file">ADD IMAGE<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectImage} /></label><button className="adventure-send" disabled={sending || (!text.trim() && !imageData)}>SEND TO THREAD</button></footer>
      </form>
      <form className="dm-ui-transmitter" onSubmit={sendUiMessage}>
        <header><div><span>DIRECT INTERFACE CONTROL</span><strong>Send a UI message</strong></div><small>Appears as an in-world system window.</small></header>
        <div className="dm-ui-fields">
          <label>DESTINATION<select value={uiRecipient} onChange={(event) => setUiRecipient(event.target.value)}><option value="display">Shared Display + all players</option><option value="players">All personal Player Books</option><option value="guide">DM notes only</option>{session.players.map((player) => <option key={player} value={player}>Only {player}</option>)}</select></label>
          <label>WINDOW TYPE<select value={uiType} onChange={(event) => setUiType(event.target.value as typeof uiType)}><option value="system">System</option><option value="quest">Quest</option><option value="guidance">Guidance</option><option value="memory">Memory</option><option value="warning">Warning</option><option value="error">Error</option></select></label>
          <label>TITLE<input value={uiTitle} onChange={(event) => setUiTitle(event.target.value)} placeholder="SYSTEM NOTICE" /></label>
        </div>
        <label>MESSAGE<textarea rows={3} value={uiText} onChange={(event) => setUiText(event.target.value)} placeholder="A new path has been recognized." /></label>
        <button className="adventure-send" disabled={sending || !uiText.trim()}>DISPLAY UI MESSAGE</button>
      </form>
      {diceEnabled && <form className="dm-roll-director" onSubmit={requestRoll}>
        <header><div><span>GUIDE CONTROL · FATE</span><strong>Command a roll</strong></div><small>The player cannot roll until you ask.</small></header>
        <div className="dm-roll-fields">
          <label>PLAYER<select value={rollPlayer} onChange={(event) => setRollPlayer(event.target.value)}><option value="">Choose player</option>{session.players.map((player) => <option key={player} value={player}>{player}</option>)}</select></label>
          <label>CHECK<select value={rollLabel} onChange={(event) => setRollLabel(event.target.value)}>{['STRENGTH CHECK','DEXTERITY CHECK','CONSTITUTION CHECK','INTELLIGENCE CHECK','WISDOM CHECK','CHARISMA CHECK','PERCEPTION CHECK','INSIGHT CHECK','INVESTIGATION CHECK','STEALTH CHECK','PERSUASION CHECK','DECEPTION CHECK','SAVING THROW','ATTACK ROLL','CUSTOM CHECK'].map((label) => <option key={label}>{label}</option>)}</select></label>
          <label>DIE<select value={rollDie} onChange={(event) => setRollDie(Number(event.target.value))}>{[4,6,8,10,12,20,100].map((sides) => <option key={sides} value={sides}>d{sides}</option>)}</select></label>
          <label>MODIFIER<input type="number" min={-20} max={20} value={rollModifier} onChange={(event) => setRollModifier(Number(event.target.value))} /></label>
        </div>
        <label>WHAT THE PLAYER FEELS OR ATTEMPTS<textarea rows={2} value={rollPrompt} onChange={(event) => setRollPrompt(event.target.value)} placeholder="Something is watching from the dark. Decide whether you notice it." /></label>
        <button className="adventure-send" disabled={sending || !rollPlayer}>REQUEST ROLL</button>
        {session.rollRequests.length > 0 && <div className="dm-pending-rolls"><span>AWAITING FATE</span>{session.rollRequests.map((request) => <div key={request.id}><strong>{request.player} · {request.label}</strong><button type="button" onClick={() => cancelRoll(request.id)}>WITHDRAW</button></div>)}</div>}
      </form>}
      <div className="dm-adventure-footer"><span>{status}</span>{!confirmClear ? <button onClick={() => setConfirmClear(true)}>CLEAR OLD TRANSCRIPT</button> : <div><span>REMOVE EVERY MESSAGE?</span><button onClick={() => setConfirmClear(false)}>KEEP THEM</button><button onClick={clearTranscript}>YES, CLEAR</button></div>}</div>
    </main>
  </section>;
}
