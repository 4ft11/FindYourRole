'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import BattleMapBoard from './battle-map-board';
import { BattlePlayerSurface } from './battle-player-view';
import { AreaKind, BattleMapState, battleMapChannel, battleMapStorageKey, defaultBattleMap, EffectKind, GridKind, mapDistance, MapEffect, MapSpell, MapToken, newId, RechargeKind, SpellOutcome, spellAvailable, starterActionsForPlayer, TokenKind } from '@/lib/battle-map-types';

type Cell = { x: number; y: number };
type Tool = 'select' | 'move' | 'measure' | 'spell';
const tokenKinds: TokenKind[] = ['player', 'enemy', 'npc', 'object', 'hazard'];
const effectKinds: EffectKind[] = ['fire', 'lightning', 'frost', 'radiant', 'necrotic', 'healing', 'force', 'poison', 'smoke', 'shield'];
const areaKinds: AreaKind[] = ['single', 'circle', 'cone', 'line', 'cube'];
const outcomes: SpellOutcome[] = ['hit', 'missed', 'saved', 'resisted', 'countered', 'failed'];
const recharges: { value: RechargeKind; label: string }[] = [{ value: 'unlimited', label: 'Unlimited / cantrip' }, { value: 'short-rest', label: 'Returns after short rest' }, { value: 'long-rest', label: 'Returns after long rest' }, { value: 'charges', label: 'Manual charges' }];
const blankSpell = (): MapSpell => ({ id: newId('spell'), name: 'New Spell', rangeFeet: 60, areaKind: 'single', areaFeet: 5, effectKind: 'force', description: 'Describe what the player sees and what the spell does.', rollHelp: 'Choose a target within range, then follow the character sheet.', recharge: 'long-rest', maxUses: 1, remainingUses: 1 });

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function addMissingStarterActions(map: BattleMapState): BattleMapState {
  return {
    ...map,
    tokens: map.tokens.map((token) => token.kind === 'player' && token.spells.length === 0
      ? { ...token, spells: starterActionsForPlayer(token.name) }
      : token),
  };
}
function safeMap(input: unknown): BattleMapState | null {
  if (!input || typeof input !== 'object') return null;
  const map = input as Partial<BattleMapState>;
  if (map.version !== 1 || !Array.isArray(map.tokens)) return null;
  return addMissingStarterActions({ ...defaultBattleMap, ...map, columns: clamp(Number(map.columns) || 20, 6, 40), rows: clamp(Number(map.rows) || 14, 6, 30), feetPerCell: clamp(Number(map.feetPerCell) || 5, 1, 20), tokens: map.tokens });
}

export default function DmBattleMap() {
  const [map, setMap] = useState<BattleMapState>(() => addMissingStarterActions(defaultBattleMap));
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState(defaultBattleMap.tokens[0].id);
  const [tool, setTool] = useState<Tool>('select');
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);
  const [measureStart, setMeasureStart] = useState<Cell | null>(null);
  const [pendingSpell, setPendingSpell] = useState<{ tokenId: string; spellId: string } | null>(null);
  const [outcome, setOutcome] = useState<SpellOutcome>('hit');
  const [notice, setNotice] = useState('MAP SAVES AUTOMATICALLY ON THIS DEVICE');
  const [showPlayerPreview, setShowPlayerPreview] = useState(true);
  const [lastEffect, setLastEffect] = useState<MapEffect | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const effectTimerRef = useRef<number | null>(null);
  const mapFileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = safeMap(JSON.parse(window.localStorage.getItem(battleMapStorageKey) || 'null')); if (saved) { setMap(saved); setSelectedId(saved.tokens[0]?.id || ''); } } catch { /* Keep starter map. */ }
      setReady(true);
    }, 0);
    channelRef.current = 'BroadcastChannel' in window ? new BroadcastChannel(battleMapChannel) : null;
    return () => { window.clearTimeout(timer); if (effectTimerRef.current) window.clearTimeout(effectTimerRef.current); channelRef.current?.close(); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(battleMapStorageKey, JSON.stringify(map)); }
    catch { window.setTimeout(() => setNotice('MAP TOO LARGE TO SAVE — USE A SMALLER BACKGROUND IMAGE'), 0); }
    channelRef.current?.postMessage(map);
  }, [map, ready]);

  const selected = map.tokens.find((token) => token.id === selectedId) || null;
  const active = map.tokens.find((token) => token.id === map.activeTurnId) || null;
  const pendingCaster = pendingSpell ? map.tokens.find((token) => token.id === pendingSpell.tokenId) || null : null;
  const pendingSpellRecord = pendingCaster && pendingSpell ? pendingCaster.spells.find((spell) => spell.id === pendingSpell.spellId) || null : null;
  const moveStart = tool === 'move' && selected ? { x: selected.x, y: selected.y } : null;
  const initiative = useMemo(() => [...map.tokens].filter((token) => token.kind !== 'object' && token.kind !== 'hazard').sort((a, b) => b.initiative - a.initiative), [map.tokens]);

  function updateMap(patch: Partial<BattleMapState>) { setMap((current) => ({ ...current, ...patch })); }
  function updateToken(id: string, patch: Partial<MapToken>) { setMap((current) => ({ ...current, tokens: current.tokens.map((token) => token.id === id ? { ...token, ...patch } : token) })); }
  function updateSpell(tokenId: string, spellId: string, patch: Partial<MapSpell>) { setMap((current) => ({ ...current, tokens: current.tokens.map((token) => token.id === tokenId ? { ...token, spells: token.spells.map((spell) => spell.id === spellId ? { ...spell, ...patch } : spell) } : token) })); }

  function handleCell(cell: Cell) {
    if (tool === 'measure') { setMeasureStart((start) => start ? null : cell); return; }
    if (tool === 'move' && selected) {
      const distance = Math.max(Math.abs(selected.x - cell.x), Math.abs(selected.y - cell.y)) * map.feetPerCell;
      updateToken(selected.id, { x: cell.x, y: cell.y, movementUsedFeet: selected.movementUsedFeet + distance });
      setNotice(`${selected.name.toUpperCase()} MOVED ${distance} FT // ${Math.max(0, selected.speedFeet - selected.movementUsedFeet - distance)} FT REMAINING`);
      return;
    }
    if (tool === 'spell' && pendingSpell) castSpell(cell);
  }

  function handleToken(token: MapToken) {
    if (tool === 'spell' && pendingSpell) { castSpell({ x: token.x, y: token.y }); return; }
    setSelectedId(token.id);
  }

  function displayEffect(effect: MapEffect, announcement = effect.label) {
    if (effectTimerRef.current) window.clearTimeout(effectTimerRef.current);
    const visibleEffect = { ...effect, id: newId('effect') };
    setLastEffect(visibleEffect);
    setMap((current) => ({ ...current, effect: visibleEffect, announcement }));
    effectTimerRef.current = window.setTimeout(() => setMap((current) => ({ ...current, effect: null })), 6200);
  }

  function castSpell(cell: Cell) {
    if (!pendingSpell) return;
    const caster = map.tokens.find((token) => token.id === pendingSpell.tokenId);
    const spell = caster?.spells.find((item) => item.id === pendingSpell.spellId);
    if (!caster || !spell || !spellAvailable(spell)) return;
    const distance = mapDistance(caster, cell, map.feetPerCell);
    if (spell.rangeFeet > 0 && distance > spell.rangeFeet) { setNotice(`OUT OF RANGE // ${distance} FT AWAY // ${spell.rangeFeet} FT MAXIMUM`); return; }
    const label = `${spell.name.toUpperCase()} // ${outcome.toUpperCase()}`;
    const effect: MapEffect = { id: newId('effect'), casterName: caster.name, spellName: spell.name, effectKind: spell.effectKind, outcome, areaKind: spell.areaKind, areaFeet: Math.max(spell.areaFeet, map.feetPerCell * 1.5), x: cell.x, y: cell.y, label };
    if (effectTimerRef.current) window.clearTimeout(effectTimerRef.current);
    setLastEffect(effect);
    setMap((current) => ({ ...current, announcement: label, effect, tokens: current.tokens.map((token) => token.id === caster.id ? { ...token, spells: token.spells.map((item) => item.id === spell.id && item.recharge !== 'unlimited' ? { ...item, remainingUses: Math.max(0, item.remainingUses - 1) } : item) } : token) }));
    effectTimerRef.current = window.setTimeout(() => setMap((current) => ({ ...current, effect: null })), 6200);
    setNotice(`${label} // VISIBLE TO PLAYERS FOR 6 SECONDS`); setPendingSpell(null); setTool('select');
  }

  function previewSpell(spell: MapSpell) {
    if (!selected) return;
    const label = `${spell.name.toUpperCase()} // EFFECT PREVIEW`;
    displayEffect({ id: newId('effect'), casterName: selected.name, spellName: spell.name, effectKind: spell.effectKind, outcome, areaKind: spell.areaKind, areaFeet: Math.max(spell.areaFeet, map.feetPerCell * 1.5), x: selected.x, y: selected.y, label }, label);
    setNotice('EFFECT PREVIEW IS LIVE // NO USE WAS SPENT');
  }

  function testPlayerDisplay() {
    const center = { x: Math.floor(map.columns / 2), y: Math.floor(map.rows / 2) };
    const label = 'PLAYER DISPLAY TEST // VISIBLE';
    displayEffect({ id: newId('effect'), casterName: 'The Index', spellName: 'Display Test', effectKind: 'radiant', outcome: 'hit', areaKind: 'circle', areaFeet: map.feetPerCell * 3, ...center, label }, label);
    setNotice('CHECK THE PLAYER PREVIEW BELOW OR THE PLAYER VIEW TAB');
  }

  function replayLastEffect() {
    if (!lastEffect) return;
    displayEffect(lastEffect, `${lastEffect.spellName.toUpperCase()} // REPLAY`);
    setNotice('LAST EFFECT REPLAYED // NO USE WAS SPENT');
  }

  function addToken() {
    const token: MapToken = { id: newId('token'), name: 'New Token', kind: 'enemy', color: '#9b5549', x: Math.floor(map.columns / 2), y: Math.floor(map.rows / 2), size: 1, speedFeet: 30, movementUsedFeet: 0, initiative: 10, visible: true, spells: [] };
    setMap((current) => ({ ...current, tokens: [...current.tokens, token] })); setSelectedId(token.id);
  }
  function removeToken() { if (!selected || !window.confirm(`Remove ${selected.name} from this map?`)) return; setMap((current) => ({ ...current, tokens: current.tokens.filter((token) => token.id !== selected.id), activeTurnId: current.activeTurnId === selected.id ? '' : current.activeTurnId })); setSelectedId(''); }
  function addSpell() { if (!selected) return; updateToken(selected.id, { spells: [...selected.spells, blankSpell()] }); }
  function restoreStarterActions() {
    if (!selected || selected.kind !== 'player') return;
    const starter = starterActionsForPlayer(selected.name);
    if (!starter.length) { setNotice('NO STARTER SET EXISTS FOR THIS TOKEN NAME'); return; }
    if (selected.spells.length && !window.confirm(`Replace ${selected.name}’s current spell and action cards with the starter set?`)) return;
    updateToken(selected.id, { spells: starter });
    setNotice(`${selected.name.toUpperCase()} // STARTER ACTIONS LOADED`);
  }
  function removeSpell(spellId: string) { if (!selected || !window.confirm('Remove this spell or action?')) return; updateToken(selected.id, { spells: selected.spells.filter((spell) => spell.id !== spellId) }); }

  function rest(kind: 'short' | 'long') {
    setMap((current) => ({ ...current, tokens: current.tokens.map((token) => ({ ...token, spells: token.spells.map((spell) => spell.recharge === 'unlimited' || (kind === 'short' && spell.recharge !== 'short-rest') ? spell : { ...spell, remainingUses: spell.maxUses }) })) }));
    setNotice(`${kind.toUpperCase()} REST // AVAILABLE USES RESTORED`);
  }
  function nextTurn() {
    if (!initiative.length) return;
    const currentIndex = initiative.findIndex((token) => token.id === map.activeTurnId);
    const next = initiative[(currentIndex + 1 + initiative.length) % initiative.length];
    updateMap({ activeTurnId: next.id, announcement: `${next.name.toUpperCase()} // YOUR TURN` });
  }
  function newRound() { setMap((current) => ({ ...current, round: current.round + 1, tokens: current.tokens.map((token) => ({ ...token, movementUsedFeet: 0 })), announcement: `ROUND ${current.round + 1} BEGINS` })); setNotice('MOVEMENT RESTORED FOR NEW ROUND'); }

  function handleBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => { const scale = Math.min(1, 1800 / image.width, 1200 / image.height); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const context = canvas.getContext('2d'); if (!context) return; context.drawImage(image, 0, 0, canvas.width, canvas.height); updateMap({ backgroundDataUrl: canvas.toDataURL('image/jpeg', .78) }); };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file); event.target.value = '';
  }
  function exportMap() { const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${map.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'battle-map'}.json`; link.click(); URL.revokeObjectURL(link.href); }
  function importMap(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const next = safeMap(JSON.parse(String(reader.result))); if (!next) throw new Error(); setMap(next); setSelectedId(next.tokens[0]?.id || ''); setNotice('MAP BACKUP IMPORTED'); } catch { setNotice('MAP IMPORT FAILED // INVALID BACKUP'); } }; reader.readAsText(file); event.target.value = ''; }

  return <section className="battle-studio">
    <div className="dm-section-heading"><div><p>THE INDEX // TACTICAL PROJECTION</p><h2>BATTLE MAP STUDIO</h2></div><span>{notice}</span></div>
    <div className="battle-quickstart"><strong>CAMPAIGN-DAY QUICK START</strong><ol><li><b>Open Player View</b> and put that tab on the TV or Discord stream.</li><li><b>Select a character</b> from Tokens and Turn.</li><li><b>Move</b> them with Move Token, or choose an action and then its target.</li><li><b>Check Player Preview</b> below—what appears there is what your players see.</li></ol></div>
    <div className="battle-toolbar">
      <button className={tool === 'select' ? 'active' : ''} onClick={() => setTool('select')}>SELECT</button><button className={tool === 'move' ? 'active' : ''} onClick={() => setTool('move')} disabled={!selected}>MOVE TOKEN</button><button className={tool === 'measure' ? 'active' : ''} onClick={() => { setTool('measure'); setMeasureStart(null); }}>MEASURE</button>
      <button onClick={() => window.open('/player-view', '_blank', 'noopener')}>OPEN PLAYER VIEW</button><button onClick={() => setShowPlayerPreview((current) => !current)}>{showPlayerPreview ? 'HIDE' : 'SHOW'} PLAYER PREVIEW</button><button onClick={testPlayerDisplay}>TEST PLAYER DISPLAY</button>{lastEffect && <button onClick={replayLastEffect}>REPLAY LAST EFFECT</button>}<button onClick={nextTurn}>NEXT TURN</button><button onClick={newRound}>NEW ROUND</button>
    </div>
    <div className={`battle-mode-guide ${pendingSpell ? 'casting' : ''}`} role="status"><strong>{pendingSpell ? `CASTING: ${pendingSpellRecord?.name || 'ACTION'}` : tool === 'move' ? `MOVING: ${selected?.name || 'SELECT A TOKEN'}` : tool === 'measure' ? 'MEASURE: CHOOSE A START SPACE, THEN AN END SPACE' : 'READY: SELECT A TOKEN OR CHOOSE A TOOL'}</strong><span>{pendingSpell ? 'Now click a token or a space on the map. The range circle shows how far the action can reach.' : tool === 'move' ? 'Click the destination space. The movement total updates automatically.' : tool === 'measure' ? 'Hover after choosing the first space to see distance in feet.' : 'Nothing will move or spend a use while Select is active.'}</span>{pendingSpell && <button onClick={() => { setPendingSpell(null); setTool('select'); setNotice('CAST CANCELLED // NO USE WAS SPENT'); }}>CANCEL CAST</button>}</div>
    <div className="battle-layout">
      <aside className="battle-controls">
        <details open><summary>MAP SETUP</summary><div className="battle-control-body">
          <label className="dm-field"><span>MAP NAME</span><input value={map.name} onChange={(event) => updateMap({ name: event.target.value })} /></label>
          <div className="dm-grid"><label className="dm-field"><span>COLUMNS</span><input type="number" min="6" max="40" value={map.columns} onChange={(event) => updateMap({ columns: clamp(Number(event.target.value), 6, 40) })} /></label><label className="dm-field"><span>ROWS</span><input type="number" min="6" max="30" value={map.rows} onChange={(event) => updateMap({ rows: clamp(Number(event.target.value), 6, 30) })} /></label><label className="dm-field"><span>FEET PER SPACE</span><input type="number" min="1" max="20" value={map.feetPerCell} onChange={(event) => updateMap({ feetPerCell: clamp(Number(event.target.value), 1, 20) })} /></label><label className="dm-field"><span>GRID</span><select value={map.gridKind} onChange={(event) => updateMap({ gridKind: event.target.value as GridKind })}><option value="square">Square</option><option value="hex">Hex-style</option></select></label></div>
          <label className="dm-check"><input type="checkbox" checked={map.gridVisible} onChange={(event) => updateMap({ gridVisible: event.target.checked })} /> Show grid to players</label>
          <div className="dm-actions"><button onClick={() => mapFileRef.current?.click()}>UPLOAD MAP IMAGE</button><button onClick={() => updateMap({ backgroundDataUrl: '' })}>CLEAR IMAGE</button><button onClick={exportMap}>EXPORT BACKUP</button><button onClick={() => importRef.current?.click()}>IMPORT BACKUP</button></div>
          <input ref={mapFileRef} className="visually-hidden" type="file" accept="image/*" onChange={handleBackground} /><input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importMap} />
        </div></details>
        <details open><summary>TOKENS AND TURN</summary><div className="battle-control-body">
          <div className="token-list">{map.tokens.map((token) => <button key={token.id} className={selectedId === token.id ? 'active' : ''} onClick={() => setSelectedId(token.id)}><i style={{ background: token.color }} />{token.name}<small>{token.kind}</small></button>)}</div><button className="dm-save" onClick={addToken}>ADD TOKEN</button>
          {selected && <div className="selected-token-editor"><label className="dm-field"><span>NAME</span><input value={selected.name} onChange={(event) => updateToken(selected.id, { name: event.target.value })} /></label><div className="dm-grid"><label className="dm-field"><span>TYPE</span><select value={selected.kind} onChange={(event) => updateToken(selected.id, { kind: event.target.value as TokenKind })}>{tokenKinds.map((kind) => <option key={kind}>{kind}</option>)}</select></label><label className="dm-field"><span>COLOR</span><input type="color" value={selected.color} onChange={(event) => updateToken(selected.id, { color: event.target.value })} /></label><label className="dm-field"><span>SPEED IN FEET</span><input type="number" min="0" value={selected.speedFeet} onChange={(event) => updateToken(selected.id, { speedFeet: Math.max(0, Number(event.target.value)) })} /></label><label className="dm-field"><span>INITIATIVE</span><input type="number" value={selected.initiative} onChange={(event) => updateToken(selected.id, { initiative: Number(event.target.value) })} /></label></div><p className="movement-readout">MOVEMENT: {selected.movementUsedFeet} FT USED // {Math.max(0, selected.speedFeet - selected.movementUsedFeet)} FT LEFT</p><label className="dm-check"><input type="checkbox" checked={selected.visible} onChange={(event) => updateToken(selected.id, { visible: event.target.checked })} /> Visible in Player View</label><div className="dm-actions"><button onClick={() => updateToken(selected.id, { movementUsedFeet: 0 })}>RESET MOVEMENT</button><button className="danger-button" onClick={removeToken}>REMOVE TOKEN</button></div></div>}
          <div className="initiative-list"><strong>ROUND {map.round}</strong>{initiative.map((token) => <button key={token.id} className={map.activeTurnId === token.id ? 'active' : ''} onClick={() => updateMap({ activeTurnId: token.id, announcement: `${token.name.toUpperCase()} // YOUR TURN` })}><span>{token.initiative}</span>{token.name}</button>)}</div>
        </div></details>
        <details open><summary>PLAYER SPELLS AND ACTIONS</summary><div className="battle-control-body">
          {!selected && <p className="dm-notice">Select a player token to add their spells and actions.</p>}
          {selected && <><p className="dm-notice">Starter cards are loaded for each named player. They avoid fixed numbers until you confirm the character sheet; every card and use count remains editable.</p>{selected.spells.map((spell) => { const spent = !spellAvailable(spell); return <article className={`spell-editor-card ${spent ? 'spent' : ''}`} key={spell.id}>
            <div className="spell-editor-head"><input aria-label="Spell name" value={spell.name} onChange={(event) => updateSpell(selected.id, spell.id, { name: event.target.value })} /><span>{spell.recharge === 'unlimited' ? 'UNLIMITED' : `${spell.remainingUses} / ${spell.maxUses} LEFT`}</span></div>
            <div className="dm-grid"><label className="dm-field"><span>RANGE · FEET</span><input type="number" min="0" value={spell.rangeFeet} onChange={(event) => updateSpell(selected.id, spell.id, { rangeFeet: Math.max(0, Number(event.target.value)) })} /></label><label className="dm-field"><span>AREA SHAPE</span><select value={spell.areaKind} onChange={(event) => updateSpell(selected.id, spell.id, { areaKind: event.target.value as AreaKind })}>{areaKinds.map((kind) => <option key={kind}>{kind}</option>)}</select></label><label className="dm-field"><span>AREA SIZE · FEET</span><input type="number" min="0" value={spell.areaFeet} onChange={(event) => updateSpell(selected.id, spell.id, { areaFeet: Math.max(0, Number(event.target.value)) })} /></label><label className="dm-field"><span>VISUAL EFFECT</span><select value={spell.effectKind} onChange={(event) => updateSpell(selected.id, spell.id, { effectKind: event.target.value as EffectKind })}>{effectKinds.map((kind) => <option key={kind}>{kind}</option>)}</select></label></div>
            <label className="dm-field"><span>WHAT IT DOES · PLAIN LANGUAGE</span><textarea rows={2} value={spell.description} onChange={(event) => updateSpell(selected.id, spell.id, { description: event.target.value })} /></label><label className="dm-field"><span>WHAT THE PLAYER ROLLS OR DOES</span><textarea rows={2} value={spell.rollHelp} onChange={(event) => updateSpell(selected.id, spell.id, { rollHelp: event.target.value })} /></label>
            <div className="dm-grid"><label className="dm-field"><span>AVAILABILITY</span><select value={spell.recharge} onChange={(event) => updateSpell(selected.id, spell.id, { recharge: event.target.value as RechargeKind })}>{recharges.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select></label><label className="dm-field"><span>USES</span><input type="number" min="1" disabled={spell.recharge === 'unlimited'} value={spell.maxUses} onChange={(event) => { const maxUses = Math.max(1, Number(event.target.value)); updateSpell(selected.id, spell.id, { maxUses, remainingUses: Math.min(spell.remainingUses, maxUses) }); }} /></label><label className="dm-field"><span>REMAINING</span><input type="number" min="0" max={spell.maxUses} disabled={spell.recharge === 'unlimited'} value={spell.remainingUses} onChange={(event) => updateSpell(selected.id, spell.id, { remainingUses: clamp(Number(event.target.value), 0, spell.maxUses) })} /></label></div>
            <div className="spell-cast-row"><label><span>WHAT HAPPENS?</span><select value={outcome} onChange={(event) => setOutcome(event.target.value as SpellOutcome)}>{outcomes.map((value) => <option key={value}>{value}</option>)}</select></label><button disabled={spent} onClick={() => { setPendingSpell({ tokenId: selected.id, spellId: spell.id }); setTool('spell'); setNotice(`CHOOSE A TARGET FOR ${spell.name.toUpperCase()}`); }}>1. CHOOSE TARGET · 2. SHOW EFFECT</button></div><div className="dm-actions"><button onClick={() => previewSpell(spell)}>PREVIEW EFFECT · NO COST</button><button onClick={() => updateSpell(selected.id, spell.id, { remainingUses: spell.maxUses })}>RESTORE USES</button><button className="danger-button" onClick={() => removeSpell(spell.id)}>REMOVE</button></div>
          </article>; })}<div className="dm-actions"><button className="dm-save" onClick={addSpell}>ADD SPELL OR ACTION</button>{selected.kind === 'player' && <button onClick={restoreStarterActions}>RESTORE PLAYER STARTER CARDS</button>}<button onClick={() => rest('short')}>SHORT REST</button><button onClick={() => rest('long')}>LONG REST</button></div></>}
        </div></details>
      </aside>
      <section className="battle-stage"><header><div><span>{map.name}</span><strong>ROUND {map.round}</strong></div><p>{map.announcement}</p></header><BattleMapBoard state={map} interactive selectedTokenId={selectedId} hoverCell={hoverCell} measureStart={tool === 'measure' ? measureStart : null} moveStart={moveStart} rangeOrigin={pendingCaster ? { x: pendingCaster.x, y: pendingCaster.y } : null} rangeFeet={pendingSpellRecord?.rangeFeet || 0} onCellClick={handleCell} onCellHover={setHoverCell} onTokenClick={handleToken} /><footer><span>TOOL: {tool.toUpperCase()}</span><span>{active ? `ACTIVE: ${active.name.toUpperCase()}` : 'NO ACTIVE TURN'}</span><span>{map.effect ? 'EFFECT IS VISIBLE TO PLAYERS' : pendingSpell ? 'SELECT A TARGET' : 'PLAYER VIEWS LIVE'}</span></footer></section>
    </div>
    {showPlayerPreview && <section className="dm-player-preview"><header><div><strong>WHAT PLAYERS SEE</strong><span>This preview uses the exact same display as the TV and Discord tab.</span></div><button onClick={testPlayerDisplay}>TEST AN EFFECT NOW</button></header><BattlePlayerSurface map={map} compact /></section>}
  </section>;
}
