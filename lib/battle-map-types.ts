export type GridKind = 'square' | 'hex';
export type TokenKind = 'player' | 'enemy' | 'npc' | 'object' | 'hazard';
export type RechargeKind = 'unlimited' | 'short-rest' | 'long-rest' | 'charges';
export type AreaKind = 'single' | 'circle' | 'cone' | 'line' | 'cube';
export type EffectKind = 'fire' | 'lightning' | 'frost' | 'radiant' | 'necrotic' | 'healing' | 'force' | 'poison' | 'smoke' | 'shield';
export type SpellOutcome = 'hit' | 'missed' | 'saved' | 'resisted' | 'countered' | 'failed';

export type MapSpell = {
  id: string;
  name: string;
  rangeFeet: number;
  areaKind: AreaKind;
  areaFeet: number;
  effectKind: EffectKind;
  description: string;
  rollHelp: string;
  recharge: RechargeKind;
  maxUses: number;
  remainingUses: number;
};

export type MapToken = {
  id: string;
  name: string;
  kind: TokenKind;
  color: string;
  x: number;
  y: number;
  size: number;
  speedFeet: number;
  movementUsedFeet: number;
  initiative: number;
  visible: boolean;
  spells: MapSpell[];
};

export type MapEffect = {
  id: string;
  casterName: string;
  spellName: string;
  effectKind: EffectKind;
  outcome: SpellOutcome;
  areaKind: AreaKind;
  areaFeet: number;
  x: number;
  y: number;
  label: string;
};

export type BattleMapState = {
  version: 1;
  name: string;
  columns: number;
  rows: number;
  feetPerCell: number;
  gridKind: GridKind;
  backgroundDataUrl: string;
  gridVisible: boolean;
  tokens: MapToken[];
  round: number;
  activeTurnId: string;
  announcement: string;
  effect: MapEffect | null;
};

export const battleMapStorageKey = 'wayfarer-battle-map-v1';
export const battleMapChannel = 'wayfarer-battle-map-live-v1';

export const defaultBattleMap: BattleMapState = {
  version: 1,
  name: 'FIELD MAP // FIRST CONTACT',
  columns: 20,
  rows: 14,
  feetPerCell: 5,
  gridKind: 'square',
  backgroundDataUrl: '',
  gridVisible: true,
  round: 1,
  activeTurnId: 'ariel-token',
  announcement: 'COMBAT DISPLAY READY',
  effect: null,
  tokens: [
    { id: 'ariel-token', name: 'Ariel', kind: 'player', color: '#c7a154', x: 3, y: 9, size: 1, speedFeet: 30, movementUsedFeet: 0, initiative: 14, visible: true, spells: [] },
    { id: 'noah-token', name: 'Noah', kind: 'player', color: '#866db0', x: 4, y: 10, size: 1, speedFeet: 30, movementUsedFeet: 0, initiative: 12, visible: true, spells: [] },
    { id: 'michael-token', name: 'Michael', kind: 'player', color: '#5f9b82', x: 5, y: 9, size: 1, speedFeet: 40, movementUsedFeet: 0, initiative: 16, visible: true, spells: [] },
    { id: 'chris-token', name: 'Chris', kind: 'player', color: '#698caf', x: 4, y: 8, size: 1, speedFeet: 30, movementUsedFeet: 0, initiative: 10, visible: true, spells: [] },
  ],
};

export function mapDistance(a: { x: number; y: number }, b: { x: number; y: number }, feetPerCell: number) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * feetPerCell;
}

export function newId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

export function spellAvailable(spell: MapSpell) {
  return spell.recharge === 'unlimited' || spell.remainingUses > 0;
}
