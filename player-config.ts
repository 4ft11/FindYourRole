export const roles = [
  'The Sworn',
  'The Seer',
  'The Weaver',
  'The Shepherd',
  'The Justiciar',
  'The Sovereign',
] as const;

export type Role = (typeof roles)[number];
export type QuestionKind = 'choice' | 'short' | 'choice-or-text';

export type CalibrationQuestion = {
  id: string;
  prompt: string;
  kind: QuestionKind;
  options?: string[];
  suggestion?: string;
};

export type PlayerConfig = {
  key: string;
  name: string;
  role: Role;
  gender?: string;
  path: string;
  characterClass: string;
  species: string;
  manifestation?: string;
  questions: CalibrationQuestion[];
};

export const sharedQuestions: Record<string, CalibrationQuestion> = {
  possession: { id: 'possession', prompt: 'What possession from your former life arrived with you?', kind: 'short' },
  body: { id: 'body', prompt: 'What part of your new body feels most unfamiliar?', kind: 'short' },
  abilities: { id: 'abilities', prompt: 'How did your abilities first feel?', kind: 'choice', options: ['Remembered', 'Learned', 'Imposed', 'Borrowed', 'Instinctive'] },
  loss: { id: 'loss', prompt: 'Which loss frightens you most?', kind: 'choice', options: ['Memory', 'Freedom', 'Identity', 'Home', 'Power', 'Another person'] },
  distrust: { id: 'distrust', prompt: 'What would make you distrust the Guide?', kind: 'short' },
  challenge: { id: 'challenge', prompt: 'Which kind of challenge do you most enjoy?', kind: 'choice', options: ['Combat', 'Mystery', 'Exploration', 'Relationships', 'Difficult decisions', 'Breaking apparently impossible rules'] },
  surrender: { id: 'surrender', prompt: 'What is one thing you would never willingly surrender?', kind: 'short' },
  fear: { id: 'fear', prompt: 'When frightened, what do you seek first?', kind: 'choice', options: ['Another person', 'Information', 'Control', 'Distance', 'Action', 'Solitude'] },
  playFocus: { id: 'play-focus', prompt: 'Which part of a session would you most like to get extra time?', kind: 'choice', options: ['Combat', 'Mystery', 'Exploration', 'Character relationships', 'Humor and chaos'] },
  lessFocus: { id: 'less-focus', prompt: 'Which part of a session would you rather keep shorter?', kind: 'choice', options: ['Long combats', 'Dense mysteries', 'Open-ended exploration', 'Intense relationship scenes', 'Extended jokes and side conversations'] },
  humor: { id: 'humor', prompt: 'How much humor feels right for this character?', kind: 'choice', options: ['A lot', 'A steady mix', 'Mostly serious with occasional relief', 'Very little'] },
  reward: { id: 'reward', prompt: 'Which reward would feel most satisfying?', kind: 'choice', options: ['A useful item', 'New character information', 'A difficult choice', 'Recognition from someone important', 'A new ability earned through normal advancement'] },
  personalQuest: { id: 'personal-quest', prompt: 'What kind of personal quest sounds most fun?', kind: 'choice', options: ['Protect someone', 'Recover something lost', 'Solve a mystery', 'Prove or reject an expectation', 'Change an important relationship'] },
  partyBond: { id: 'party-bond', prompt: 'What kind of connection would you enjoy building with another party member?', kind: 'choice', options: ['Friendly rivalry', 'Protective bond', 'Unexpected friendship', 'Mutual distrust that changes', 'Shared responsibility'] },
  secrets: { id: 'secrets', prompt: 'How do you feel about your character keeping a secret from the party?', kind: 'choice', options: ['I enjoy it', 'Only briefly', 'Only if the party can discover it', 'I would rather avoid it'] },
  transformation: { id: 'transformation-comfort', prompt: 'How comfortable are you with your character changing physically or magically?', kind: 'choice', options: ['Very comfortable', 'Comfortable if I help shape it', 'Only temporary changes', 'Please ask me first', 'I would rather avoid it'] },
  authority: { id: 'authority', prompt: 'When an authority figure gives a questionable order, what sounds most fun to play?', kind: 'choice', options: ['Obey, then investigate', 'Ask questions first', 'Negotiate for another path', 'Refuse openly', 'Pretend to agree and choose later'] },
  guideTrust: { id: 'guide-trust', prompt: 'How much do you want your character to trust the Guide at the beginning?', kind: 'choice', options: ['Trusting', 'Cautiously hopeful', 'Neutral', 'Suspicious', 'Actively distrustful'] },
  boundary: { id: 'boundaries', prompt: 'Is there anything you do not want used as a personal storyline, even if it appears elsewhere in the campaign?', kind: 'short' },
};

const q = (id: string, prompt: string, kind: QuestionKind = 'short', options?: string[], suggestion?: string): CalibrationQuestion => ({ id, prompt, kind, options, suggestion });

export const players: PlayerConfig[] = [
  {
    key: 'ariel', name: 'Ariel', role: 'The Sworn', gender: 'male', path: 'UNCONFIRMED', characterClass: 'Paladin', species: 'FORM UNCONFIRMED',
    questions: [
      sharedQuestions.playFocus, sharedQuestions.lessFocus, sharedQuestions.humor, sharedQuestions.reward, sharedQuestions.personalQuest, sharedQuestions.partyBond, sharedQuestions.secrets, sharedQuestions.transformation, sharedQuestions.authority, sharedQuestions.guideTrust, sharedQuestions.boundary, sharedQuestions.abilities, sharedQuestions.loss,
      q('released-promise', 'If everyone released you from a promise, could it still bind you?', 'choice', ['Yes', 'No', 'Only if I still believed in it', 'Only if breaking it harmed someone']),
      q('unjust-oath', 'What would make an oath unjust?'),
      q('divine-source', 'What is your divine power connected to?', 'choice', ['A god', 'A promise', 'A person', 'Something I cannot remember']),
      q('behind-you', 'Who would you place behind yourself when danger arrives?'),
    ],
  },
  {
    key: 'noah', name: 'Noah', role: 'The Sovereign', path: 'UNCONFIRMED', characterClass: 'Warlock', species: 'Aasimar', manifestation: 'Necrotic Shroud',
    questions: [
      sharedQuestions.playFocus, sharedQuestions.lessFocus, sharedQuestions.humor, sharedQuestions.reward, sharedQuestions.personalQuest, sharedQuestions.partyBond, sharedQuestions.secrets, sharedQuestions.transformation, sharedQuestions.authority, sharedQuestions.guideTrust, sharedQuestions.boundary, sharedQuestions.abilities, sharedQuestions.loss,
      q('patron-consent', 'Did you accept your patron’s power willingly?', 'choice', ['Yes', 'No', 'I do not remember agreeing', 'I agreed without understanding the cost']),
      q('power-control', 'Which frightens you more?', 'choice', ['Being controlled by my power', 'Discovering that nothing was controlling me']),
      q('shroud', 'What does your Necrotic Shroud look like?'),
      q('legitimate-obedience', 'When people follow you, what makes their obedience legitimate?'),
      q('refused-price', 'What price would you refuse to pay even if everyone benefited?'),
    ],
  },
  {
    key: 'michael', name: 'Michael', role: 'The Weaver', path: 'Open Hand · The Unfettered', characterClass: 'Monk', species: 'FORM UNCONFIRMED',
    questions: [
      sharedQuestions.playFocus, sharedQuestions.lessFocus, sharedQuestions.humor, sharedQuestions.reward, sharedQuestions.personalQuest, sharedQuestions.partyBond, sharedQuestions.secrets, sharedQuestions.transformation, sharedQuestions.authority, sharedQuestions.guideTrust, sharedQuestions.boundary, sharedQuestions.abilities, sharedQuestions.fear,
      q('freedom', 'Does freedom mean escaping all limitations or choosing which limitations deserve you?', 'choice', ['Escaping all limitations', 'Choosing which limitations deserve me', 'Neither', 'I am still deciding']),
      q('familiar-movement', 'What movement or fighting technique feels strangely familiar?'),
      q('blocked-path', 'When a rule blocks your path, what do you do?', 'choice', ['Evade it', 'Reinterpret it', 'Test it', 'Break it']),
      q('remain', 'What could persuade you to remain when escape is possible?'),
    ],
  },
  {
    key: 'chris', name: 'Chris', role: 'The Seer', path: 'Circle of the Stars · The Starreader', characterClass: 'Druid', species: 'Aasimar', manifestation: 'Unconfirmed',
    questions: [
      sharedQuestions.playFocus, sharedQuestions.lessFocus, sharedQuestions.humor, sharedQuestions.reward, sharedQuestions.personalQuest, sharedQuestions.partyBond, sharedQuestions.secrets, sharedQuestions.transformation, sharedQuestions.authority, sharedQuestions.guideTrust, sharedQuestions.boundary, sharedQuestions.abilities,
      q('stars', 'When you read the stars, what do you see?', 'choice', ['Fate', 'Probability', 'Memory', 'Someone’s design']),
      q('unchanged-self', 'When you take another form, what part of you remains unchanged?'),
      q('wild-shape', 'What is the first Wild Shape that feels familiar?'),
      q('celestial-form', 'What does your celestial transformation look like?', 'choice-or-text', undefined, 'Inner Radiance'),
      q('dangerous-truth', 'Which is more dangerous?', 'choice', ['A comforting lie', 'A truth revealed at the wrong time']),
      q('familiar-guide', 'Why does the Guide sometimes seem familiar?'),
    ],
  },
];

export function createMattPlayer(role: Role): PlayerConfig {
  return {
    key: 'matt', name: 'Matt', role, path: 'ASSESSMENT COMPLETE', characterClass: 'UNCONFIRMED', species: 'FORM UNCONFIRMED',
    questions: [
      sharedQuestions.playFocus, sharedQuestions.lessFocus, sharedQuestions.humor, sharedQuestions.reward, sharedQuestions.personalQuest,
      sharedQuestions.partyBond, sharedQuestions.secrets, sharedQuestions.transformation, sharedQuestions.authority, sharedQuestions.guideTrust,
      sharedQuestions.boundary, sharedQuestions.fear,
      q('matt-result-reaction', `What part of ${role} feels most interesting to explore, and what part would you rather resist?`),
      q('matt-party-role', 'When the party is under pressure, what role would you enjoy taking in the group?'),
    ],
  };
}

export function normalizeIdentity(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function findPlayer(name: string) {
  const normalized = normalizeIdentity(name);
  return players.find((player) => normalizeIdentity(player.name) === normalized);
}
