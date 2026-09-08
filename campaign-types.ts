export type BubbleState = 'filled' | 'empty' | 'partial' | 'corrupted' | 'unknown' | 'locked';

export type RoleStatus = {
  label: string;
  total: number;
  filled: number;
  displayValue: string;
  bubbles: BubbleState[];
  flickerFifth: boolean;
  statusMessage: string;
  accentColor: string;
  filledColor: string;
  emptyColor: string;
};

export type PlayerStatusValue = { label: string; value: string; state?: BubbleState };
export type EntryType = 'quest' | 'objective' | 'title' | 'memory' | 'inventory' | 'npc' | 'guide_message' | 'private_notice';
export type EntryState = 'visible' | 'hidden' | 'locked' | 'corrupted' | 'unknown' | 'partial';

export type CampaignEntry = {
  id: string;
  playerKey: string;
  type: EntryType;
  title: string;
  body: string;
  state: EntryState;
  sortOrder: number;
  eventDate: string;
  acquisitionLabel: 'acquired' | 'returned';
  isCurrent: boolean;
  createdAt?: string;
};

export type CampaignPlayer = {
  key: string;
  name: string;
  role: string;
  displayRole: string;
  path: string;
  characterClass: string;
  subclass: string;
  species: string;
  manifestation: string;
  unknownUser: boolean;
  statusValues: PlayerStatusValue[];
  lastSystemUpdate: string;
  entries: CampaignEntry[];
};
