'use client';
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useCallback, useEffect, useState } from 'react';
import ChronicleEmblem from '@/components/chronicle-emblem';
import type { AdventureSession } from '@/lib/adventure-types';

const displayCodeKey = 'rumerianne-shared-display-code-v1';

export default function SharedPlayerDisplay() {
  const [roomCode, setRoomCode] = useState('');
  const [connectedCode, setConnectedCode] = useState('');
  const [session, setSession] = useState<AdventureSession | null>(null);
  const [notice, setNotice] = useState('Enter the chapter key prepared by the DM.');

  const load = useCallback(async (code: string, silent = false) => {
    try {
      const response = await fetch(`/api/adventure?view=display&room=${encodeURIComponent(code)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('not found');
      const result = await response.json() as { session: AdventureSession };
      setSession(result.session);
      setConnectedCode(code);
      try { window.localStorage.setItem(displayCodeKey, code); } catch { /* Storage is optional. */ }
      if (!silent) setNotice('The shared page is open.');
    } catch {
      if (!silent) setNotice('That chapter is not open to the shared display.');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { const remembered = window.localStorage.getItem(displayCodeKey); if (remembered) { setRoomCode(remembered); void load(remembered, true); } } catch { /* Ask for the key. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!connectedCode) return;
    const timer = window.setInterval(() => void load(connectedCode, true), 1800);
    return () => window.clearInterval(timer);
  }, [connectedCode, load]);

  function connect(event: FormEvent) { event.preventDefault(); void load(roomCode); }

  if (!session) return <main className="rpg-world rpg-guide-gate"><form className="rpg-sealed-folio" onSubmit={connect}><ChronicleEmblem /><p>Rumerianne · Shared Display</p><h1>A window into the chapter.</h1><label><span>Chapter key</span><input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} autoComplete="off" /></label><button disabled={!roomCode.trim()}>Open the shared page</button><output>{notice}</output></form></main>;

  const guideThinking = session.typing.some((item) => item.role === 'guide');
  const latest = [...(session.reveals ?? session.messages)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const illustration = latest.find((message) => message.imageData);
  const illumination = latest.find((message) => message.ui || message.kind === 'system' || message.kind === 'warning');
  const narration = [...session.messages].reverse().find((message) => message.kind === 'narration' && message.text);

  return <main className="rpg-world rpg-shared-screen">
    {illustration?.imageData && <img className="rpg-shared-backdrop" src={illustration.imageData} alt={illustration.imageName || 'The current scene'} />}
    <header><p className="rpg-kicker">The Chronicle of Rumerianne</p><h1>{session.title}</h1></header>
    <section className="rpg-shared-inscription" aria-live="polite">{illumination ? <><p className="rpg-kicker">{illumination.ui?.type || 'A message'}</p><h2>{illumination.ui?.title || 'Through the veil'}</h2><p>{illumination.text}</p></> : <p>{narration?.text || session.scene}</p>}</section>
    <p className="rpg-shared-thinking">{guideThinking ? '…the gods are thinking…' : '\u00a0'}</p>
  </main>;
}
