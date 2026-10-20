export type AdventureMessageKind = 'narration' | 'dialogue' | 'system' | 'warning' | 'roll' | 'whisper';
export type AdventureSessionMode = 'in-person' | 'online' | 'hybrid';
export type AdventureDestination = 'all' | 'display' | 'players' | 'guide' | string;

export type AdventureMessage = {
  id: string;
  sender: 'guide' | 'player' | 'system';
  senderName: string;
  recipient: AdventureDestination;
  kind: AdventureMessageKind;
  text: string;
  imageData?: string;
  imageName?: string;
  roll?: { sides: number; result: number; modifier: number; total: number };
  ui?: { type: 'system' | 'quest' | 'guidance' | 'memory' | 'warning' | 'error'; title: string };
  createdAt: string;
};

export type AdventureTyping = {
  name: string;
  role: 'guide' | 'player';
  expiresAt: number;
};

export type AdventureRollRequest = {
  id: string;
  player: string;
  label: string;
  prompt: string;
  sides: number;
  modifier: number;
  createdAt: string;
};

export type AdventureSession = {
  version: 2;
  mode: AdventureSessionMode;
  title: string;
  scene: string;
  roomCode: string;
  active: boolean;
  diceEnabled: boolean;
  players: string[];
  messages: AdventureMessage[];
  rollRequests: AdventureRollRequest[];
  typing: AdventureTyping[];
  updatedAt: string;
};

export const blankAdventureSession: AdventureSession = {
  version: 2,
  mode: 'in-person',
  title: 'Unwritten One-Shot',
  scene: 'The connection has not yet opened.',
  roomCode: '',
  active: false,
  diceEnabled: true,
  players: [],
  messages: [],
  rollRequests: [],
  typing: [],
  updatedAt: new Date(0).toISOString(),
};

export function normalizeIdentity(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
