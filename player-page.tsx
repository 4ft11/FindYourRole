'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CampaignEntry, CampaignPlayer, RoleStatus } from '@/lib/campaign-types';
import RoleStatusBar from './role-status-bar';
import UIWindow, { UIWindowData, WindowType } from './ui-window';

const emptyMessages: Record<CampaignEntry['type'], string> = {
  quest: 'Awaiting recognition', objective: 'Awaiting recognition', title: 'No title awarded', memory: 'No memory recovered', inventory: 'No important object returned', npc: 'No known NPC recorded', guide_message: 'No message from the Guide', private_notice: 'Information withheld by divine restriction',
};

function typeLabel(type: CampaignEntry['type']): WindowType {
  if (type === 'quest' || type === 'objective') return 'Quest';
  if (type === 'guide_message') return 'Guidance';
  if (type === 'memory') return 'Memory Recovered';
  if (type === 'private_notice') return 'Warning';
  return 'System';
}

function entryWindow(entry: CampaignEntry, player: CampaignPlayer): UIWindowData {
  const stateMessage = entry.state === 'locked' ? 'ENTRY LOCKED' : entry.state === 'corrupted' ? 'DATA CORRUPTED' : entry.state === 'unknown' ? 'AWAITING RECOGNITION' : entry.state === 'partial' ? `${entry.body}\n\n[REMAINDER UNRECOVERED]` : entry.body;
  const acquisition = entry.type === 'inventory' ? `${entry.acquisitionLabel === 'returned' ? 'RETURNED' : 'ACQUIRED'}${entry.eventDate ? ` // ${entry.eventDate}` : ''}` : entry.eventDate;
  return { recipient: player.name as UIWindowData['recipient'], windowType: typeLabel(entry.type), sourceLabel: entry.type === 'guide_message' ? 'THE GUIDE' : 'THE INDEX', heading: entry.title, message: stateMessage || emptyMessages[entry.type], objective: entry.type === 'objective' ? stateMessage : '', reward: '', consequence: '', footer: acquisition || (entry.isCurrent ? 'CURRENT ENTRY' : 'ARCHIVED ENTRY'), buttons: [], glitched: entry.state === 'corrupted', privateMessage: entry.type === 'private_notice' };
}

export default function PlayerPage({ initialPlayer, initialStatus, previewOnly = false }: { initialPlayer: CampaignPlayer; initialStatus: RoleStatus; previewOnly?: boolean }) {
  const [player, setPlayer] = useState(initialPlayer);
  const [status, setStatus] = useState(initialStatus);
  const [notice, setNotice] = useState('');
  const currentQuest = player.entries.find((entry) => entry.type === 'quest' && entry.isCurrent);
  const visibleEntries = useMemo(() => player.entries.filter((entry) => entry.id !== currentQuest?.id), [currentQuest?.id, player.entries]);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/player/me', { cache: 'no-store' });
    if (!response.ok) { setNotice('The Index could not refresh this record.'); return; }
    const next = await response.json() as { player: CampaignPlayer; status: RoleStatus };
    setPlayer(next.player); setStatus(next.status); setNotice('RECORD SYNCHRONIZED');
  }, []);

  useEffect(() => {
    if (previewOnly) return;
    const timer = window.setInterval(refresh, 45000);
    return () => window.clearInterval(timer);
  }, [previewOnly, refresh]);

  const identity: UIWindowData = {
    recipient: player.unknownUser ? 'Unknown User' : player.name as UIWindowData['recipient'], windowType: 'System', sourceLabel: 'THE INDEX',
    heading: player.unknownUser ? 'Unknown User' : `${player.name} // ${player.displayRole}`,
    message: [`ARCHETYPE  ${player.displayRole}`, `PATH  ${player.path}`, `CLASS  ${player.characterClass}${player.subclass && player.subclass !== 'UNCONFIRMED' ? ` // ${player.subclass}` : ''}`, `SPECIES  ${player.species}`, `MANIFESTATION  ${player.manifestation}`].join('\n'),
    objective: '', reward: '', consequence: '', footer: `LAST SYSTEM UPDATE // ${new Date(player.lastSystemUpdate).toLocaleString()}`, buttons: [], glitched: false, privateMessage: true,
  };
  const quest: UIWindowData = currentQuest ? entryWindow(currentQuest, player) : { ...identity, windowType: 'Quest', sourceLabel: 'THE INDEX', heading: 'Current Quest', message: 'Awaiting recognition', footer: 'NO ACTIVE QUEST', privateMessage: false };

  return <section className="player-record panel-fade">
    <RoleStatusBar status={status} />
    <div className="player-record-head"><div><p className="eyebrow">IDENTITY MATCH FOUND</p><h1>{player.unknownUser ? 'UNKNOWN USER' : `WELCOME BACK, ${player.name.toUpperCase()}.`}</h1></div>{!previewOnly && <button onClick={refresh}>REFRESH RECORD</button>}</div>
    {notice && <p className="sync-notice" role="status">{notice}</p>}
    <UIWindow data={identity} />
    <UIWindow data={quest} />
    {player.statusValues.length > 0 && <section className="player-status-values">{player.statusValues.map((item) => <div key={item.label} className={`status-${item.state || 'filled'}`}><span>{item.label}</span><strong>{item.value}</strong></div>)}</section>}
    <div className="player-entry-list">
      {visibleEntries.map((entry) => <UIWindow key={entry.id} data={entryWindow(entry, player)} />)}
      {visibleEntries.length === 0 && <div className="empty-records"><p>NO MEMORY RECOVERED</p><p>ENTRY LOCKED</p><p>AWAITING RECOGNITION</p><p>INFORMATION WITHHELD BY DIVINE RESTRICTION</p></div>}
    </div>
  </section>;
}
