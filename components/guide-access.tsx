'use client';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import ChronicleEmblem from '@/components/chronicle-emblem';

export default function GuideAccess({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [key, setKey] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/api/guide', { cache: 'no-store' }).then((response) => { if (live) setUnlocked(response.ok); }).catch(() => undefined).finally(() => { if (live) setReady(true); });
    try { sessionStorage.removeItem('wayfarer-adventure-dm-key'); } catch { /* No raw passphrase is kept in browser storage. */ }
    return () => { live = false; };
  }, []);
  async function unlock(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch('/api/guide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
      if (response.ok) { setUnlocked(true); setKey(''); setNotice(''); } else setNotice('The clasp does not yield.');
    } catch { setNotice('The folio cannot answer. Please try again.'); }
    finally { setBusy(false); }
  }
  async function lock() {
    try {
      const response = await fetch('/api/guide', { method: 'DELETE' });
      if (response.ok) setUnlocked(false); else setNotice('Unable to lock. Please try again.');
    } catch { setNotice('Unable to lock. Check your connection.'); }
  }
  if (!unlocked) return <main className="rpg-world rpg-guide-gate"><form onSubmit={unlock} className="rpg-sealed-folio"><ChronicleEmblem /><p className="rpg-kicker">For the unseen hand</p><h1>The Guide’s Folio</h1><p>This volume does not answer to every hand.</p>{ready && <><label htmlFor="guide-phrase">The private phrase</label><input id="guide-phrase" type="password" autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} required /><button disabled={busy || !key}>{busy ? 'Listening…' : 'Unseal the folio'}</button></>}<p role="status">{notice || (!ready ? 'The clasp is listening…' : '')}</p></form></main>;
  return <div className="rpg-guide-workspace"><div className="rpg-guide-private"><span>Private · The Guide’s Folio</span><button onClick={lock}>Seal the folio</button><span role="status">{notice}</span></div>{children}</div>;
}
