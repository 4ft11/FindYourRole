'use client';

import { useEffect, useMemo, useState } from 'react';
import UIWindow, { defaultWindowData, downloadWindowPng, Recipient, recipients, UIWindowData, WindowType, windowPlainText, windowTypes } from '@/components/ui-window';
import DmMessageGenerator from '@/components/dm-message-generator';
import DmItemGenerator from '@/components/dm-item-generator';
import DmBattleMap from '@/components/dm-battle-map';
import DmWorldMap from '@/components/dm-world-map';
import DmAdventureConsole from '@/components/dm-adventure-console';

type Draft = { id: string; name: string; updatedAt: string; data: UIWindowData };
const draftsKey = 'wayfarer-dm-ui-drafts-v1';

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

export default function DmUiStudio() {
  const [data, setData] = useState<UIWindowData>(defaultWindowData);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [importValue, setImportValue] = useState('');
  const [status, setStatus] = useState('WINDOW DRAFTS ARE SAVED ON THIS DEVICE');
  const [presenting, setPresenting] = useState(false);
  const [studioTab, setStudioTab] = useState<'windows' | 'messages' | 'items' | 'adventure' | 'maps' | 'world'>('adventure');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setDrafts(JSON.parse(window.localStorage.getItem(draftsKey) || '[]')); } catch { setDrafts([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setPresenting(false);
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  const plainText = useMemo(() => windowPlainText(data), [data]);
  const set = <K extends keyof UIWindowData>(key: K, value: UIWindowData[K]) => setData((current) => ({ ...current, [key]: value }));
  const persistDrafts = (next: Draft[]) => { setDrafts(next); window.localStorage.setItem(draftsKey, JSON.stringify(next)); };

  function saveDraft() {
    const draft: Draft = { id: crypto.randomUUID?.() || String(Date.now()), name: data.heading || 'Untitled Window', updatedAt: new Date().toISOString(), data };
    persistDrafts([draft, ...drafts]); setStatus('DRAFT SAVED ON THIS DEVICE');
  }
  function duplicate() { setData((current) => ({ ...current, heading: current.heading ? `${current.heading} — Copy` : 'Untitled Window — Copy' })); setStatus('WINDOW DUPLICATED'); }
  function clear() { setData({ ...defaultWindowData, heading: '', message: '', objective: '', reward: '', consequence: '', footer: '', buttons: [] }); setStatus('EDITOR CLEARED'); }
  async function copy(label: string, value: string) { try { await copyText(value); setStatus(`${label} COPIED`); } catch { setStatus('COPY BLOCKED — SELECT THE EXPORT FIELD MANUALLY'); } }
  function importData() {
    try {
      const parsed = JSON.parse(importValue) as UIWindowData | { drafts: Draft[] };
      if ('drafts' in parsed && Array.isArray(parsed.drafts)) { persistDrafts(parsed.drafts); setStatus('DRAFT ARCHIVE IMPORTED'); }
      else { const windowData = parsed as UIWindowData; setData({ ...defaultWindowData, ...windowData, buttons: Array.isArray(windowData.buttons) ? windowData.buttons.slice(0, 3) : [] }); setStatus('WINDOW DATA IMPORTED'); }
    } catch { setStatus('IMPORT FAILED — WINDOW DATA IS NOT VALID JSON'); }
  }

  if (presenting) return <main className="presentation-stage" onClick={() => setPresenting(false)}><div onClick={(event) => event.stopPropagation()}><UIWindow data={data} presentation /></div><p>Tap the background or press Escape to return</p></main>;

  return <main className="dm-shell">
    <header className="dm-header"><div><p>THE INDEX // GUIDE CREATION SURFACE</p><h1>DM CREATION STUDIO</h1></div><span className="dm-local-badge">LOCAL TOOLS // LIVE THREAD READY</span></header>
    <nav className="dm-tabs" aria-label="DM Studio sections"><button className={studioTab === 'adventure' ? 'active' : ''} onClick={() => setStudioTab('adventure')}>TEXT ADVENTURE</button><button className={studioTab === 'windows' ? 'active' : ''} onClick={() => setStudioTab('windows')}>SYSTEM WINDOWS</button><button className={studioTab === 'messages' ? 'active' : ''} onClick={() => setStudioTab('messages')}>MESSAGE GENERATOR</button><button className={studioTab === 'items' ? 'active' : ''} onClick={() => setStudioTab('items')}>ITEM GENERATOR</button><button className={studioTab === 'maps' ? 'active' : ''} onClick={() => setStudioTab('maps')}>BATTLE MAPS</button><button className={studioTab === 'world' ? 'active' : ''} onClick={() => setStudioTab('world')}>EMPIRE MAP</button></nav>
    {studioTab === 'adventure' ? <DmAdventureConsole /> : studioTab === 'messages' ? <DmMessageGenerator /> : studioTab === 'items' ? <DmItemGenerator /> : studioTab === 'maps' ? <DmBattleMap /> : studioTab === 'world' ? <DmWorldMap /> : <div className="dm-workspace">
      <aside className="dm-editor">
        <div className="dm-notice">Window drafts stay on this browser until exported. This studio cannot edit the public website or send anything automatically.</div>
        <div className="dm-grid">
          <label className="dm-field"><span>RECIPIENT</span><select value={data.recipient} onChange={(event) => set('recipient', event.target.value as Recipient)}>{recipients.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="dm-field"><span>WINDOW TYPE</span><select value={data.windowType} onChange={(event) => set('windowType', event.target.value as WindowType)}>{windowTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <label className="dm-field"><span>SOURCE LABEL</span><input value={data.sourceLabel} onChange={(event) => set('sourceLabel', event.target.value)} /></label>
        <label className="dm-field"><span>MAIN HEADING</span><input value={data.heading} onChange={(event) => set('heading', event.target.value)} /></label>
        <label className="dm-field"><span>MESSAGE BODY</span><textarea rows={6} value={data.message} onChange={(event) => set('message', event.target.value)} /></label>
        <label className="dm-field"><span>OBJECTIVE · OPTIONAL</span><textarea rows={3} value={data.objective} onChange={(event) => set('objective', event.target.value)} /></label>
        <div className="dm-grid"><label className="dm-field"><span>REWARD · OPTIONAL</span><textarea rows={3} value={data.reward} onChange={(event) => set('reward', event.target.value)} /></label><label className="dm-field"><span>CONSEQUENCE · OPTIONAL</span><textarea rows={3} value={data.consequence} onChange={(event) => set('consequence', event.target.value)} /></label></div>
        <label className="dm-field"><span>FOOTER / STATUS · OPTIONAL</span><input value={data.footer} onChange={(event) => set('footer', event.target.value)} /></label>
        <fieldset className="button-labels"><legend>BUTTON LABELS · MAXIMUM THREE</legend>{[0, 1, 2].map((index) => <input key={index} value={data.buttons[index] || ''} placeholder={`Button ${index + 1}`} onChange={(event) => { const next = [...data.buttons]; next[index] = event.target.value; set('buttons', next.slice(0, 3)); }} />)}</fieldset>
        <div className="dm-toggles"><label><input type="checkbox" checked={data.glitched} onChange={(event) => set('glitched', event.target.checked)} /> Glitched appearance</label><label><input type="checkbox" checked={data.privateMessage} onChange={(event) => set('privateMessage', event.target.checked)} /> Private Message</label></div>
        <div className="dm-actions primary-actions"><button onClick={saveDraft}>SAVE DRAFT</button><button onClick={duplicate}>DUPLICATE</button><button onClick={clear}>CLEAR</button></div>
        <div className="dm-actions"><button onClick={() => copy('PLAIN TEXT', plainText)}>COPY PLAIN TEXT</button><button onClick={() => copy('WINDOW DATA', JSON.stringify(data, null, 2))}>COPY WINDOW DATA</button><button onClick={() => { downloadWindowPng(data); setStatus('PNG DOWNLOAD STARTED'); }}>DOWNLOAD AS PNG</button></div>
        <button className="present-button" onClick={() => setPresenting(true)}>PRESENT FULLSCREEN</button>
        <section className="dm-import"><label className="dm-field"><span>IMPORT WINDOW OR DRAFT ARCHIVE JSON</span><textarea rows={5} value={importValue} onChange={(event) => setImportValue(event.target.value)} placeholder="Paste copied window data or a draft archive here" /></label><div className="dm-actions"><button onClick={importData}>IMPORT WINDOW DATA</button><button onClick={() => copy('DRAFT ARCHIVE', JSON.stringify({ version: 1, drafts }, null, 2))}>COPY ALL DRAFTS JSON</button></div></section>
        {drafts.length > 0 && <section className="draft-list"><h2>SAVED DRAFTS</h2>{drafts.map((draft) => <button key={draft.id} onClick={() => { setData(draft.data); setStatus(`LOADED: ${draft.name.toUpperCase()}`); }}><span>{draft.name}</span><small>{new Date(draft.updatedAt).toLocaleString()}</small></button>)}</section>}
      </aside>
      <section className="dm-preview"><div className="preview-label"><span>LIVE PREVIEW</span><small>{status}</small></div><UIWindow data={data} /></section>
    </div>}
  </main>;
}
