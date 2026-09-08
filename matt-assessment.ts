import type { Role } from '@/app/player-config';

export const MATT_ASSESSMENT_STORAGE_KEY = 'wayfarer-matt-assessment-v1';

export type MattAssessmentResult = {
  primary: Role;
  secondary: Role;
  tertiary: Role;
};

export type MattAssessmentSave = {
  version: 1;
  playerName: 'Matt';
  screen: 'quiz' | 'result';
  index: number;
  answers: Array<string | null>;
  complete: boolean;
  result?: MattAssessmentResult;
  forestMessageSeen?: boolean;
};
