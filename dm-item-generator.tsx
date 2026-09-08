'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const itemTypes = ['RELIC', 'WEAPON', 'ARMOR', 'TOOL', 'CONSUMABLE', 'KEY ITEM', 'UNKNOWN OBJECT'] as const;
const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'VERY RARE', 'LEGENDARY', 'UNCLASSIFIED'] as const;
const conditions = ['INTACT', 'WORN', 'DAMAGED', 'PARTIAL', 'CORRUPTED', 'SEALED'] as const;
const verbs = ['ACQUIRED', 'RETURNED', 'RECOVERED', 'ASSIGNED', 'FOUND IN INVENTORY'] as const;

type ItemDraft = {
  name: string;
  type: (typeof itemTypes)[number];
  rarity: (typeof rarities)[number];
  condition: (typeof conditions)[number];
  recipient: string;
  appearance: string;
  effect: string;
  limitation: string;
  history: string;
  notice: string;
  verb: (typeof verbs)[number];
};

const storageKey = 'wayfarer-dm-item-draft-v1';
const defaultItem: ItemDraft = {
  name: 'The Unanswered Key',
  type: 'KEY ITEM',
  rarity: 'UNCLASSIFIED',
  condition: 'WORN',
  recipient: 'UNKNOWN USER',
  appearance: 'A small iron key whose teeth do not match any visible lock.',
  effect: 'Becomes warm when carried near a promise someone intends to break.',
  limitation: 'The key cannot be willingly discarded. It can only be given to someone who asks for it by name.',
  history: 'The inventory record says this object was returned, not acquired.',
  notice: 'ORIGINAL OWNER FIELD UNAVAILABLE',
  verb: 'RETURNED',
};

function clean(value: string) { return value.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim(); }

export default function DmItemGenerator() {
  const [item, setItem] = useState<ItemDraft>(defaultItem);
  const [status, setStatus] = useState('DRAFTS REMAIN ON THIS DEVICE');
  const outputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) setItem({ ...defaultItem, ...JSON.parse(saved) as Partial<ItemDraft> });
      } catch { /* Ignore malformed device-local drafts. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const output = useMemo(() => clean([
    '+------------------------------------------+',
    '| THE INDEX // ITEM RECORD',
    `| RECIPIENT: ${item.recipient || 'UNKNOWN USER'}`,
    '+------------------------------------------+',
    '',
    clean(item.name || 'UNNAMED OBJECT').toUpperCase(),
    '',
    `TYPE: ${item.type}`,
    `RARITY: ${item.rarity}`,
    `CONDITION: ${item.condition}`,
    `STATUS: ${item.verb}`,
    '',
    item.appearance && `APPEARANCE\n${clean(item.appearance)}`,
    item.effect && `\nOBSERVED EFFECT\n${clean(item.effect)}`,
    item.limitation && `\nLIMITATION / COST\n${clean(item.limitation)}`,
    item.history && `\nRECORD FRAGMENT\n${clean(item.history)}`,
    '',
    `[ ${clean(item.notice || 'NO ADDITIONAL INFORMATION')} ]`,
    '+------------------------------------------+',
  ].filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n')), [item]);

  function update<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) { setItem((current) => ({ ...current, [key]: value })); }
  function save() { window.localStorage.setItem(storageKey, JSON.stringify(item)); setStatus('ITEM DRAFT SAVED ON THIS DEVICE'); }
  function clear() { setItem({ ...defaultItem, name: '', recipient: '', appearance: '', effect: '', limitation: '', history: '', notice: '' }); setStatus('ITEM EDITOR CLEARED'); }
  async function copy() {
    try { await navigator.clipboard.writeText(output); setStatus('ITEM RECORD COPIED FOR DISCORD OR TEXT'); }
    catch {
      outputRef.current?.focus(); outputRef.current?.select();
      setStatus(document.execCommand('copy') ? 'ITEM RECORD COPIED FOR DISCORD OR TEXT' : 'COPY BLOCKED — OUTPUT SELECTED');
    }
  }

  return <section className="dm-message-generator dm-item-generator">
    <div className="dm-section-heading"><div><p>THE INDEX // OBJECT REGISTRATION</p><h2>ITEM GENERATOR</h2></div><span>{status}</span></div>
    <div className="message-generator-grid">
      <section className="dm-message-controls">
        <p className="dm-notice">Create a game-style item card for copying into Discord or a text message. Nothing is sent or added to the website automatically.</p>
        <label className="dm-field"><span>ITEM NAME</span><input value={item.name} onChange={(event) => update('name', event.target.value)} /></label>
        <div className="dm-grid">
          <label className="dm-field"><span>ITEM TYPE</span><select value={item.type} onChange={(event) => update('type', event.target.value as ItemDraft['type'])}>{itemTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="dm-field"><span>RARITY</span><select value={item.rarity} onChange={(event) => update('rarity', event.target.value as ItemDraft['rarity'])}>{rarities.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="dm-field"><span>CONDITION</span><select value={item.condition} onChange={(event) => update('condition', event.target.value as ItemDraft['condition'])}>{conditions.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="dm-field"><span>RECORD STATUS</span><select value={item.verb} onChange={(event) => update('verb', event.target.value as ItemDraft['verb'])}>{verbs.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
        <label className="dm-field"><span>RECIPIENT</span><input value={item.recipient} onChange={(event) => update('recipient', event.target.value)} placeholder="ENTIRE PARTY or a player name" /></label>
        <label className="dm-field"><span>APPEARANCE</span><textarea rows={3} value={item.appearance} onChange={(event) => update('appearance', event.target.value)} /></label>
        <label className="dm-field"><span>OBSERVED EFFECT</span><textarea rows={3} value={item.effect} onChange={(event) => update('effect', event.target.value)} /></label>
        <label className="dm-field"><span>LIMITATION OR COST</span><textarea rows={3} value={item.limitation} onChange={(event) => update('limitation', event.target.value)} /></label>
        <label className="dm-field"><span>HISTORY OR STRANGE RECORD</span><textarea rows={3} value={item.history} onChange={(event) => update('history', event.target.value)} /></label>
        <label className="dm-field"><span>FOOTER NOTICE</span><input value={item.notice} onChange={(event) => update('notice', event.target.value)} /></label>
        <div className="dm-actions primary-actions"><button onClick={save}>SAVE DRAFT</button><button onClick={copy}>COPY ITEM</button><button onClick={clear}>CLEAR</button></div>
      </section>
      <section className="message-output-panel"><div className="preview-label"><span>ITEM RECORD PREVIEW</span><small>PLAIN TEXT // NO EMOJI</small></div><textarea ref={outputRef} value={output} readOnly aria-label="Generated plain-text item record" /><button className="present-button" onClick={copy}>COPY ITEM RECORD</button></section>
    </div>
  </section>;
}
