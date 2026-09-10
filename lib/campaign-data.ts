import seed from '@/data/campaign-seed.json';
import type { BubbleState, CampaignPlayer, RoleStatus } from './campaign-types';

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
    lastSystemUpdate: 'UPLOADED CAMPAIGN RECORD',
    entries: [],
  }));
}

export function findPlayerByIdentity(name: string, role: string) {
  const player = getAllPlayers().find((item) => normalizeIdentity(item.name) === normalizeIdentity(name));
  if (!player) return { kind: 'unknown' as const };
  if (normalizeIdentity(player.role) !== normalizeIdentity(role)) return { kind: 'conflict' as const };
  return { kind: 'matched' as const, player };
}
