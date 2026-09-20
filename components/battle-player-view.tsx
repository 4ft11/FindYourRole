'use client';

import { useEffect, useMemo, useState } from 'react';
import BattleMapBoard from './battle-map-board';
import { BattleMapState, battleMapChannel, battleMapStorageKey, defaultBattleMap, spellAvailable } from '@/lib/battle-map-types';

export function BattlePlayerSurface({ map, connected = true, compact = false }: { map: BattleMapState; connected?: boolean; compact?: boolean }) {
  const active = useMemo(() => map.tokens.find((token) => token.id === map.activeTurnId), [map.activeTurnId, map.tokens]);
  return <div className={`player-map-view ${compact ? 'player-map-preview' : ''}`}>
    <header className="player-map-header"><div><span>{compact ? 'EXACT PLAYER PREVIEW' : 'THE INDEX // TACTICAL DISPLAY'}</span><h1>{map.name}</h1></div><div><strong>ROUND {map.round}</strong>{!compact && <button onClick={() => document.documentElement.requestFullscreen?.()}>FULLSCREEN</button>}</div></header>
    <div className="player-announcement" role="status"><span>{connected ? 'LIVE DISPLAY' : 'CONNECTING'}</span><strong>{map.announcement}</strong></div>
    <section className="player-map-stage"><BattleMapBoard state={map} /></section>
    <section className="active-player-helper">
      <header><div><span>ACTIVE TURN</span><h2>{active?.name || 'AWAITING TURN'}</h2></div>{active && <strong>{Math.max(0, active.speedFeet - active.movementUsedFeet)} FT MOVEMENT LEFT</strong>}</header>
      {active && active.spells.length > 0 ? <div className="player-spell-tray">{active.spells.map((spell) => { const available = spellAvailable(spell); return <article key={spell.id} className={available ? '' : 'spent'}><div><h3>{spell.name}</h3><span>{spell.recharge === 'unlimited' ? 'AVAILABLE' : `${spell.remainingUses} / ${spell.maxUses} USES`}</span></div><p>{spell.description}</p><dl><div><dt>Range</dt><dd>{spell.rangeFeet} ft</dd></div><div><dt>Area</dt><dd>{spell.areaKind === 'single' ? 'One target' : `${spell.areaFeet} ft ${spell.areaKind}`}</dd></div></dl><small>{available ? spell.rollHelp : 'USED // UNAVAILABLE UNTIL RESTORED'}</small></article>; })}</div> : <p className="player-helper-empty">No spells or special actions have been added for this turn.</p>}
    </section>
  </div>;
}

export default function BattlePlayerView() {
  const [map, setMap] = useState<BattleMapState>(defaultBattleMap);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const restore = () => { try { const saved = JSON.parse(window.localStorage.getItem(battleMapStorageKey) || 'null') as BattleMapState | null; if (saved?.version === 1) setMap(saved); } catch { /* Keep starter map. */ } setConnected(true); };
    const timer = window.setTimeout(restore, 0);
    const onStorage = (event: StorageEvent) => { if (event.key === battleMapStorageKey && event.newValue) { try { setMap(JSON.parse(event.newValue) as BattleMapState); } catch { /* Ignore incomplete updates. */ } } };
    window.addEventListener('storage', onStorage);
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(battleMapChannel) : null;
    if (channel) channel.onmessage = (event) => { const next = event.data as BattleMapState; if (next?.version === 1) setMap(next); };
    return () => { window.clearTimeout(timer); window.removeEventListener('storage', onStorage); channel?.close(); };
  }, []);
  return <main><BattlePlayerSurface map={map} connected={connected} /></main>;
}
