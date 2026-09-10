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

function starterAction(id: string, name: string, options: Partial<Omit<MapSpell, 'id' | 'name'>> = {}): MapSpell {
  return {
    id,
    name,
    rangeFeet: 5,
    areaKind: 'single',
    areaFeet: 5,
    effectKind: 'force',
    description: 'Use the character sheet for the final roll and damage.',
    rollHelp: 'Choose a target in range, then follow the character sheet.',
    recharge: 'unlimited',
    maxUses: 1,
    remainingUses: 1,
    ...options,
  };
}

/**
 * Beginner-facing starter cards. They are intentionally editable and avoid
 * inventing a character level, ability modifier, save DC, or damage total.
 */
export const playerStarterActions: Record<string, MapSpell[]> = {
  ariel: [
    starterAction('ariel-weapon', 'Weapon Attack', { description: 'Strike one creature within reach with your equipped weapon.', rollHelp: 'Roll your weapon attack from the character sheet.' }),
    starterAction('ariel-lay-hands', 'Lay on Hands', { effectKind: 'healing', description: 'Touch a creature and restore health from Ariel’s healing pool.', rollHelp: 'Choose how many points to spend from the pool shown on the character sheet.', recharge: 'long-rest', maxUses: 1, remainingUses: 1 }),
    starterAction('ariel-smite', 'Divine Smite', { effectKind: 'radiant', description: 'After a successful melee hit, spend the appropriate resource to add radiant force.', rollHelp: 'First land a melee hit, then check the character sheet for the cost and extra damage.', recharge: 'long-rest', maxUses: 1, remainingUses: 1 }),
  ],
  noah: [
    starterAction('noah-blast', 'Eldritch Blast', { rangeFeet: 120, effectKind: 'force', description: 'Send a beam of force toward a creature at range.', rollHelp: 'Roll a ranged spell attack using the bonus on the character sheet.' }),
    starterAction('noah-hex', 'Hex', { rangeFeet: 90, effectKind: 'necrotic', description: 'Mark a creature so Noah’s later attacks can punish it more severely.', rollHelp: 'Choose a creature in range, then check concentration and damage on the character sheet.', recharge: 'long-rest', maxUses: 1, remainingUses: 1 }),
    starterAction('noah-shroud', 'Necrotic Shroud', { rangeFeet: 0, areaKind: 'circle', areaFeet: 10, effectKind: 'necrotic', description: 'Reveal a frightening celestial manifestation. This is not permanently selected and does not determine morality.', rollHelp: 'Activate the transformation only when the character sheet says it is available.', recharge: 'long-rest', maxUses: 1, remainingUses: 1 }),
  ],
  michael: [
    starterAction('michael-strike', 'Unarmed Strike', { description: 'Strike, grapple, or shove a creature within reach using monk training.', rollHelp: 'Choose the option, then use the attack or save listed on the character sheet.' }),
    starterAction('michael-flurry', 'Flurry of Blows', { description: 'Spend Focus after attacking to follow with rapid unarmed strikes.', rollHelp: 'Confirm the Focus cost and number of strikes on the character sheet.', recharge: 'short-rest', maxUses: 1, remainingUses: 1 }),
    starterAction('michael-step', 'Step of the Wind', { rangeFeet: 0, effectKind: 'smoke', description: 'Spend Focus to move with exceptional speed and freedom.', rollHelp: 'Check the character sheet, then move Michael with the Move Token tool.', recharge: 'short-rest', maxUses: 1, remainingUses: 1 }),
    starterAction('michael-defense', 'Patient Defense', { rangeFeet: 0, effectKind: 'shield', description: 'Adopt a defensive rhythm that makes Michael harder to pin down.', rollHelp: 'Check the character sheet for the action and Focus cost.', recharge: 'short-rest', maxUses: 1, remainingUses: 1 }),
  ],
  chris: [
    starterAction('chris-guiding-bolt', 'Guiding Bolt', { rangeFeet: 120, effectKind: 'radiant', description: 'Hurl starlight at a creature and leave it easier for an ally to strike.', rollHelp: 'Roll a ranged spell attack and use the level and uses on the character sheet.', recharge: 'long-rest', maxUses: 1, remainingUses: 1 }),
    starterAction('chris-healing-word', 'Healing Word', { rangeFeet: 60, effectKind: 'healing', description: 'Call restorative magic to an ally you can see.', rollHelp: 'Choose a creature in range and use the healing roll on the character sheet.', recharge: 'long-rest', maxUses: 1, remainingUses: 1 }),
    starterAction('chris-starry-form', 'Starry Form', { rangeFeet: 0, areaKind: 'circle', areaFeet: 5, effectKind: 'radiant', description: 'Take on a constellation form and choose the constellation shown on the character sheet.', rollHelp: 'Choose the form, mark one use, and apply its listed benefit.', recharge: 'short-rest', maxUses: 1, remainingUses: 1 }),
    starterAction('chris-wild-shape', 'Wild Shape', { rangeFeet: 0, effectKind: 'smoke', description: 'Assume a known beast form using the rules and forms on the character sheet.', rollHelp: 'Choose an available form and mark one Wild Shape use.', recharge: 'short-rest', maxUses: 1, remainingUses: 1 }),
  ],
};

export function starterActionsForPlayer(name: string) {
  const key = name.trim().toLowerCase();
  return (playerStarterActions[key] || []).map((spell) => ({ ...spell }));
}
