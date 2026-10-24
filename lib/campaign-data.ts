import seed from '@/data/campaign-seed.json';
import type { BubbleState, CampaignEntry, CampaignPlayer, RoleStatus } from './campaign-types';

const statusColorDefaults = { accentColor: '#715328', filledColor: '#4b361d', emptyColor: '#c9b77f' };

export function normalizeIdentity(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function getRoleStatus(): RoleStatus {
  return { ...statusColorDefaults, ...seed.status, bubbles: seed.status.bubbles as BubbleState[] };
}

export function getAllPlayers(): CampaignPlayer[] {
  return seed.players.map((player) => ({
    ...player,
    statusValues: player.statusValues.map((status) => ({ ...status, state: status.state as BubbleState | undefined })),
    lastSystemUpdate: 'FIRST CHAPTER RECOVERED',
    entries: ((player as unknown as { entries?: CampaignEntry[] }).entries || [])
      .filter((entry) => entry.state !== 'hidden')
      .map((entry) => entry.state === 'locked' || entry.state === 'corrupted' ? { ...entry, body: '' } : entry),
  }));
}

export function findPlayerByName(name: string) {
  const player = getAllPlayers().find((item) => normalizeIdentity(item.name) === normalizeIdentity(name));
  if (!player) return { kind: 'unknown' as const };
  return { kind: 'matched' as const, player };
}
