'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import AdventureMessageList from '@/components/adventure-message-list';
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
      window.localStorage.setItem(displayCodeKey, code);
      if (!silent) setNotice('The shared page is open.');
    } catch {
      if (!silent) setNotice('That chapter is not open to the shared display.');
    }
  }, []);

  useEffect(() => {
    const remembered = window.localStorage.getItem(displayCodeKey);
    if (remembered) { setRoomCode(remembered); void load(remembered, true); }
  }, [load]);

  useEffect(() => {
    if (!connectedCode) return;
    const timer = window.setInterval(() => void load(connectedCode, true), 1800);
    return () => window.clearInterval(timer);
  }, [connectedCode, load]);

  function connect(event: FormEvent) { event.preventDefault(); void load(roomCode); }

  if (!session) return <main className="shared-display-gate"><form onSubmit={connect}><p>Rumerianne · Shared Display</p><h1>The book is closed to the room.</h1><label><span>Chapter key</span><input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} autoComplete="off" /></label><button disabled={!roomCode.trim()}>Open the shared page</button><output>{notice}</output></form></main>;

  const guideThinking = session.typing.some((item) => item.role === 'guide');
  const latest = session.messages.slice(-8);

  return <main className="shared-display-stage">
    <section className="shared-display-book">
      <header><p>Current chapter</p><h1>{session.title}</h1><span>{session.scene}</span></header>
      <div className="shared-display-content"><AdventureMessageList messages={latest} />{guideThinking && <div className="shared-guide-thinking">The Guide is considering…</div>}</div>
      <footer><span>{session.mode.replace('-', ' ')}</span><button type="button" onClick={() => { window.localStorage.removeItem(displayCodeKey); setSession(null); setConnectedCode(''); }}>Close display</button></footer>
    </section>
  </main>;
}
