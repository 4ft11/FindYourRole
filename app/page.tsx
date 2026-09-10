'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ContinuityCalibration from '@/components/continuity-calibration';
import type { Role } from './player-config';
import { MATT_ASSESSMENT_STORAGE_KEY, MattAssessmentSave } from '@/lib/matt-assessment';
import { ORIGINAL_ARCHETYPE_QUIZ_ENABLED } from './feature-flags';

type Archetype = 'anchor' | 'lantern' | 'blade' | 'vessel' | 'mirror' | 'door';
type SealType = Archetype;
type Choice = { text: string; archetype: Archetype };
type Question = {
  layer: string;
  prompt: string;
  choices: Choice[];
  odd?: { text: string; notice: string };
  blocked?: boolean;
  glitchPrompt?: string;
};

const archetypeOrder: Archetype[] = ['anchor', 'lantern', 'blade', 'vessel', 'mirror', 'door'];

const archetypes: Record<Archetype, { name: Role; motto: string; description: string; resonance: string; virtue: string; shadow: string; emblemLabel: string }> = {
  anchor: { name: 'The Sworn', motto: 'You preserve what others surrender.', description: 'You value commitments that remain meaningful when circumstances become difficult. Your steadiness can protect what a group might otherwise abandon, while still leaving you responsible for deciding which promises deserve to continue.', resonance: 'A strong pull toward duty, continuity, and promises that survive changing circumstances.', virtue: 'RELIABILITY', shadow: 'OBEDIENCE', emblemLabel: 'A closed medieval iron key in a circular seal' },
  lantern: { name: 'The Seer', motto: 'You seek what remains true when appearances fail.', description: 'You notice contradictions and test what others take for granted. Your curiosity can help a group see clearly, provided knowledge remains a way to invite better choices rather than control them.', resonance: 'A tendency to question appearances, follow evidence, and notice what others overlook.', virtue: 'DISCERNMENT', shadow: 'WITHHOLDING', emblemLabel: 'A single open eye in a circular seal' },
  mirror: { name: 'The Weaver', motto: 'You make meaning where none was assigned.', description: 'You recognize possibilities inside rules, identities, and plans that seem fixed. Your imagination opens new paths, while your relationships remind you that every choice connects to consequences beyond yourself.', resonance: 'A habit of finding connections, alternatives, and meaning in situations that seem fixed.', virtue: 'POSSIBILITY', shadow: 'EVASION', emblemLabel: 'Three cords forming an unfinished knot in a circular seal' },
  vessel: { name: 'The Shepherd', motto: 'You refuse to let anyone become expendable.', description: 'You notice who is frightened, excluded, or carrying too much. Your care becomes most powerful when protection and another person’s freedom can exist together.', resonance: 'An instinct to notice vulnerability, strengthen bonds, and keep people from being left behind.', virtue: 'ATTUNEMENT', shadow: 'POSSESSION', emblemLabel: 'A medieval shepherd’s crook with one interrupted curve in a circular seal' },
  blade: { name: 'The Justiciar', motto: 'You count the cost others refuse to name.', description: 'You compare consequences and face difficult tradeoffs without pretending that inaction is neutral. Your judgment is strongest when every affected person remains visible in the calculation.', resonance: 'A willingness to weigh consequences, confront tradeoffs, and name the cost of a decision.', virtue: 'MORAL COURAGE', shadow: 'REDUCTION', emblemLabel: 'A balanced scale with one damaged tray in a circular seal' },
  door: { name: 'The Sovereign', motto: 'You act when uncertainty becomes its own form of violence.', description: 'You step forward when a group needs direction and turn competing intentions into action. Your authority becomes trustworthy when responsibility, consent, and the freedom to disagree remain connected.', resonance: 'A readiness to coordinate people, accept responsibility, and act when waiting has a cost.', virtue: 'DECISIVENESS', shadow: 'ENTITLEMENT', emblemLabel: 'An open medieval crown with one missing point in a circular seal' },
};

function ArchetypeSeal({ type, label, decorative = false }: { type: SealType; label: string; decorative?: boolean }) {
  const shared = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const };
  return (
    <svg className={`archetype-seal seal-${type}`} viewBox="0 0 64 64" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : label}>
      <circle cx="32" cy="32" r="28" {...shared} strokeDasharray="112 4 58 2" />
      {type === 'anchor' && <><circle cx="25" cy="29" r="7" {...shared} strokeDasharray="37 7" /><path d="M31 33l16 16m-8-8 5-5m-9 1 4-4" {...shared} /><path d="M20 24l4-4 4 3" {...shared} /></>}
      {type === 'lantern' && <><path d="M11 32c6-9 13-13 21-13s15 4 21 13c-6 9-13 13-21 13S17 41 11 32Z" {...shared} /><circle cx="32" cy="32" r="7" {...shared} strokeDasharray="34 10" /><path d="M32 25v4m0 6v4" {...shared} /></>}
      {type === 'vessel' && <><path d="M37 48V22c0-8-4-11-9-11-6 0-10 4-10 9 0 4 3 7 7 7 3 0 5-2 5-5" {...shared} /><path d="M30 48h14M37 36l8-5" {...shared} strokeDasharray="15 4" /></>}
      {type === 'blade' && <><path d="M32 16v30M20 21h24M16 42l7-15 7 15H16Zm18 0 7-15 7 15" {...shared} /><path d="M36 42h5m4 0h5M26 49h12" {...shared} /></>}
      {type === 'mirror' && <><path d="M17 20c13 2 22 18 30 24M17 44c12-2 21-18 30-24M22 15c0 13 21 21 20 34" {...shared} /><path d="M15 20h5m25 24h4" {...shared} /></>}
      {type === 'door' && <><path d="M15 43h34l-2-20-9 8-6-16-7 16-10-8v20Z" {...shared} /><path d="M19 48h26M31 15h3m-17 8 4 3m22-3-4 3" {...shared} strokeDasharray="10 4" /></>}
    </svg>
  );
}

const questions: Question[] = [
  {
    layer: 'GROUP HABITS',
    prompt: 'When a group trip begins, what role do you usually fall into?',
    choices: [
      { text: 'The planner who keeps everyone on track.', archetype: 'door' },
      { text: 'The curious one who researches every stop.', archetype: 'lantern' },
      { text: 'The person who handles problems as they happen.', archetype: 'blade' },
      { text: 'The flexible one who goes wherever the day leads.', archetype: 'mirror' },
    ],
  },
  {
    layer: 'FREE TIME',
    prompt: 'You have an unexpected afternoon entirely to yourself. What sounds best?',
    choices: [
      { text: 'Return to a favorite place or familiar routine.', archetype: 'anchor' },
      { text: 'Learn about something I have always wondered.', archetype: 'lantern' },
      { text: 'Call someone and see what they feel like doing.', archetype: 'vessel' },
      { text: 'Leave without a plan and follow whatever catches my attention.', archetype: 'mirror' },
    ],
  },
  {
    layer: 'HELPING OTHERS',
    prompt: 'A friend tells you they have made a difficult mistake. Your first instinct is to…',
    choices: [
      { text: 'Remind them that one mistake does not erase who they are.', archetype: 'mirror' },
      { text: 'Help them understand exactly what went wrong.', archetype: 'lantern' },
      { text: 'Help them take the next practical step.', archetype: 'door' },
      { text: 'Stay with them so they do not carry it alone.', archetype: 'vessel' },
    ],
  },
  {
    layer: 'YOUR VALUES',
    prompt: 'Which quality do you admire most in another person?',
    choices: [
      { text: 'Reliability — they mean what they promise.', archetype: 'anchor' },
      { text: 'Courage — they act even when it is difficult.', archetype: 'door' },
      { text: 'Compassion — they notice what others carry.', archetype: 'vessel' },
      { text: 'Fairness — they consider every person affected by a choice.', archetype: 'blade' },
    ],
  },
  {
    layer: 'FIRST INSTINCTS',
    prompt: 'You reach a trail that is missing from the guidebook. What do you do?',
    choices: [
      { text: 'Stay with the marked route. It is marked for a reason.', archetype: 'anchor' },
      { text: 'Look for signs that show where the trail leads.', archetype: 'lantern' },
      { text: 'Try it, but set a firm time to turn back.', archetype: 'blade' },
      { text: 'Take it. The unplanned route may be the point.', archetype: 'mirror' },
    ],
    odd: { text: 'I recognize the trail.', notice: 'You have not taken this assessment before.' },
  },
  {
    layer: 'MEMORY',
    prompt: 'A friend remembers an important day differently than you do. Which matters most?',
    choices: [
      { text: 'What actually happened, even if neither of us knows yet.', archetype: 'lantern' },
      { text: 'What the day has come to mean to each of us.', archetype: 'mirror' },
      { text: 'That our disagreement does not damage the friendship.', archetype: 'vessel' },
      { text: 'How each memory affects the choices we make now.', archetype: 'blade' },
    ],
  },
  {
    layer: 'BELONGING',
    prompt: 'This question is not available to you.',
    choices: [],
    blocked: true,
  },
  {
    layer: 'CHANGE',
    prompt: 'A treasured family recipe changes one ingredient at a time over many years. Is it still the same recipe?',
    choices: [
      { text: 'Yes. Its history continues through every change.', archetype: 'anchor' },
      { text: 'Only if the people making it still recognize it.', archetype: 'door' },
      { text: 'Only if the changes preserve more than they cost.', archetype: 'blade' },
      { text: 'It carries the old recipe while becoming something new.', archetype: 'mirror' },
    ],
  },
  {
    layer: 'IMAGINATION',
    prompt: 'A tiny town vanishes from every modern map. What is your first explanation?',
    glitchPrompt: 'A tiny town removes every modern map. What disappeared first?',
    choices: [
      { text: 'The maps changed. The town may still be there.', archetype: 'anchor' },
      { text: 'There must be a record explaining what happened.', archetype: 'lantern' },
      { text: 'The town was renamed or became somewhere else.', archetype: 'mirror' },
      { text: 'I would rather go looking than guess.', archetype: 'door' },
    ],
  },
  {
    layer: 'PROBLEM SOLVING',
    prompt: 'A plan you helped make is beginning to fail. What do you focus on first?',
    choices: [
      { text: 'Protect the parts that are still working.', archetype: 'anchor' },
      { text: 'Find the assumption that turned out to be wrong.', archetype: 'lantern' },
      { text: 'Make a decision before the situation gets worse.', archetype: 'door' },
      { text: 'Check how everyone involved is responding.', archetype: 'blade' },
    ],
  },
  {
    layer: 'COMPETITION',
    prompt: 'Which part of a friendly competition do you enjoy most?',
    choices: [
      { text: 'The moment someone makes a bold move.', archetype: 'door' },
      { text: 'Helping a teammate recover after a mistake.', archetype: 'vessel' },
      { text: 'Reading the other players and adapting.', archetype: 'mirror' },
      { text: 'Finding a strategy no one expected.', archetype: 'blade' },
    ],
  },
  {
    layer: 'LEARNING',
    prompt: 'When learning something new, which approach feels most natural?',
    choices: [
      { text: 'Understand the theory before trying it.', archetype: 'lantern' },
      { text: 'Try it immediately and learn from mistakes.', archetype: 'door' },
      { text: 'Watch someone experienced and imitate their method.', archetype: 'mirror' },
      { text: 'Connect it to something I already know well.', archetype: 'anchor' },
    ],
  },
  {
    layer: 'ROUTINES',
    prompt: 'How do you feel about routines?',
    choices: [
      { text: 'They give me something dependable to build from.', archetype: 'anchor' },
      { text: 'They are useful until a better option appears.', archetype: 'blade' },
      { text: 'I like understanding why each step exists.', archetype: 'lantern' },
      { text: 'I keep them when they help the people around me.', archetype: 'vessel' },
    ],
  },
  {
    layer: 'LEADERSHIP',
    prompt: 'What earns your trust in a leader?',
    choices: [
      { text: 'They remain steady when circumstances change.', archetype: 'anchor' },
      { text: 'They make difficult choices without hiding from them.', archetype: 'door' },
      { text: 'They accept burdens before assigning them to others.', archetype: 'vessel' },
      { text: 'They listen well enough to change their mind.', archetype: 'mirror' },
    ],
  },
  {
    layer: 'TRADITIONS',
    prompt: 'A tradition no longer fits the people practicing it. What should happen?',
    choices: [
      { text: 'Preserve its meaning while changing its form.', archetype: 'anchor' },
      { text: 'Learn why it began before deciding.', archetype: 'lantern' },
      { text: 'Let people create something entirely new.', archetype: 'mirror' },
      { text: 'Ask what each person needs the tradition to become.', archetype: 'vessel' },
    ],
  },
  {
    layer: 'RISK',
    prompt: 'When is a risk worth taking?',
    choices: [
      { text: 'When waiting would cause greater harm.', archetype: 'blade' },
      { text: 'When I understand what could be gained and lost.', archetype: 'lantern' },
      { text: 'When it protects someone who cannot take it themselves.', archetype: 'vessel' },
      { text: 'When every safe option leads somewhere unacceptable.', archetype: 'door' },
    ],
  },
  {
    layer: 'IDENTITY',
    prompt: 'Which statement feels closest to how a person becomes themselves?',
    choices: [
      { text: 'Through the people who truly see them.', archetype: 'mirror' },
      { text: 'Through the promises they continue to keep.', archetype: 'anchor' },
      { text: 'Through the possibilities they choose to pursue.', archetype: 'mirror' },
      { text: 'Through what they are willing to carry for others.', archetype: 'vessel' },
    ],
  },
  {
    layer: 'PATTERN RECOGNITION',
    prompt: 'An old riddle asks: “What grows when carried by many, yet weakens when one person claims it completely?” Which answer feels strongest?',
    choices: [
      { text: 'A tradition, because many people keep its meaning alive.', archetype: 'anchor' },
      { text: 'Understanding, because certainty can stop inquiry.', archetype: 'lantern' },
      { text: 'Trust, because it exists between people rather than inside one.', archetype: 'vessel' },
      { text: 'A decision, because shared responsibility gives it legitimacy.', archetype: 'door' },
    ],
  },
  {
    layer: 'RETURNING',
    prompt: 'A traveler crosses a wild forest and finds that every path returns to where they began. What makes the next attempt different?',
    choices: [
      { text: 'The traveler is no longer exactly who began the first journey.', archetype: 'mirror' },
      { text: 'Choosing the road again can give the journey new meaning.', archetype: 'mirror' },
      { text: 'A remembered pattern can be tested rather than merely repeated.', archetype: 'lantern' },
      { text: 'Someone waiting at the beginning changes what returning means.', archetype: 'vessel' },
    ],
  },
  {
    layer: 'ONE LAST QUESTION',
    prompt: 'So, will you tell anyone about the quiz?',
    choices: [
      { text: 'No. I need to understand what it was first.', archetype: 'lantern' },
      { text: 'No. I will not make someone else part of this.', archetype: 'vessel' },
      { text: 'No. Silence is the choice that causes the least harm.', archetype: 'blade' },
      { text: 'No. But I do not think it needs me to.', archetype: 'door' },
    ],
  },
];

const lateSignals: Record<number, { notice?: string; ghostAnswer?: string; blankOption?: boolean; personalizePrompt?: boolean; markedChoice?: number; falseProgress?: number; falseTotal?: number }> = {
  10: { notice: 'A second response pattern is beginning to match yours.' },
  11: { blankOption: true },
  12: { notice: 'One earlier response was recovered. Its author field is empty.' },
  13: { personalizePrompt: true },
  14: { ghostAnswer: 'None of these choices belong to me.' },
  15: { markedChoice: 1 },
  16: { notice: 'Assessment complete. Two questions remain.', falseProgress: 103 },
  17: { notice: 'The road has enough to recognize you now.', falseTotal: 17 },
  19: { notice: 'This question was not part of the assessment.', falseTotal: 17 },
};

const storageKey = 'wayfarer-progress-v3';

function OriginalArchetypeQuiz({ assignedPlayerName, onContinueCalibration }: { assignedPlayerName?: string; onContinueCalibration?: () => void } = {}) {
  const activeStorageKey = assignedPlayerName ? MATT_ASSESSMENT_STORAGE_KEY : storageKey;
  const [screen, setScreen] = useState<'intro' | 'welcome' | 'quiz' | 'result'>(assignedPlayerName ? 'welcome' : 'intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<Choice | null>>([]);
  const [anomaly, setAnomaly] = useState('');
  const [playerName, setPlayerName] = useState(assignedPlayerName || '');
  const [copyStatus, setCopyStatus] = useState('');
  const [confirmRetake, setConfirmRetake] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [forestIntrusion, setForestIntrusion] = useState(false);
  const [forestMessageSeen, setForestMessageSeen] = useState(false);
  const forestMessageSeenRef = useRef(false);
  const resultSummaryRef = useRef<HTMLTextAreaElement>(null);
  const [storageReady, setStorageReady] = useState(false);

  const progress = screen === 'intro' || screen === 'welcome' ? 0 : screen === 'result' ? 100 : Math.round((index / questions.length) * 100);
  const result = useMemo(() => {
    const scores = archetypeOrder.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<Archetype, number>);
    const lastSeen = archetypeOrder.reduce((acc, key) => ({ ...acc, [key]: -1 }), {} as Record<Archetype, number>);
    answers.forEach((answer, answerIndex) => {
      if (!answer) return;
      scores[answer.archetype] += 1;
      lastSeen[answer.archetype] = answerIndex;
    });
    const ranked = [...archetypeOrder].sort((a, b) => scores[b] - scores[a] || lastSeen[b] - lastSeen[a]);
    return { primary: ranked[0], secondary: ranked[1], tertiary: ranked[2], score: scores[ranked[0]] };
  }, [answers]);

  const resultSummary = useMemo(() => ['ARCHETYPE ASSESSMENT', `Player: ${playerName.trim()}`, `Primary Role: ${archetypes[result.primary].name}`, `Secondary Resonance: ${archetypes[result.secondary].name}`, `Tertiary Resonance: ${archetypes[result.tertiary].name}`].join('\n'), [playerName, result.primary, result.secondary, result.tertiary]);

  useEffect(() => {
    if (!anomaly) return;
    const timer = window.setTimeout(() => setAnomaly(''), 3400);
    return () => window.clearTimeout(timer);
  }, [anomaly]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(activeStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { version?: number; playerName?: string; index?: number; answers?: Array<Archetype | null>; screen?: 'quiz' | 'result'; forestMessageSeen?: boolean };
        const validAnswers = Array.isArray(parsed.answers) && parsed.answers.every((answer) => answer === null || archetypeOrder.includes(answer));
        const expectedVersion = assignedPlayerName ? 1 : 3;
        if (parsed.version === expectedVersion && parsed.playerName && validAnswers && (parsed.screen === 'quiz' || parsed.screen === 'result')) {
          // Restoring a complete browser draft is the purpose of this mount-only effect.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPlayerName(parsed.playerName.slice(0, 32));
          setAnswers(parsed.answers!.map((answer) => answer ? { text: 'RESTORED RESPONSE', archetype: answer } : null));
          setIndex(Math.min(Math.max(parsed.index ?? 0, 0), questions.length - 1));
          setScreen(parsed.screen);
          forestMessageSeenRef.current = parsed.forestMessageSeen === true;
          setForestMessageSeen(forestMessageSeenRef.current);
        }
      }
    } catch {
      window.localStorage.removeItem(activeStorageKey);
    } finally {
      setStorageReady(true);
    }
  }, [activeStorageKey, assignedPlayerName]);

  useEffect(() => {
    if (!storageReady) return;
    if (screen === 'quiz' || screen === 'result') {
      const save: MattAssessmentSave | Record<string, unknown> = assignedPlayerName ? {
        version: 1, playerName: 'Matt',
        index,
        answers: answers.map((answer) => answer?.archetype ?? null),
        screen,
        complete: screen === 'result',
        result: screen === 'result' ? { primary: archetypes[result.primary].name, secondary: archetypes[result.secondary].name, tertiary: archetypes[result.tertiary].name } : undefined,
        forestMessageSeen,
      } : { version: 3, playerName: playerName.trim(), index, answers: answers.map((answer) => answer?.archetype ?? null), screen, forestMessageSeen };
      window.localStorage.setItem(activeStorageKey, JSON.stringify(save));
    } else if (screen === 'intro' && !assignedPlayerName) {
      window.localStorage.removeItem(activeStorageKey);
    }
  }, [activeStorageKey, answers, assignedPlayerName, forestMessageSeen, index, playerName, result.primary, result.secondary, result.tertiary, screen, storageReady]);

  useEffect(() => {
    if (screen !== 'welcome') return;
    const timer = window.setTimeout(() => setScreen('quiz'), 2400);
    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    // Reset the previous question's transient visual state before arming this one.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGlitchActive(false);
    if (screen !== 'quiz' || !questions[index].glitchPrompt) return;
    const timer = window.setTimeout(() => setGlitchActive(true), 1800);
    return () => window.clearTimeout(timer);
  }, [index, screen]);

  useEffect(() => {
    // The intrusion belongs only to the final question and must reset when leaving it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForestIntrusion(false);
    if (screen !== 'quiz' || index !== questions.length - 1 || forestMessageSeenRef.current) return;
    forestMessageSeenRef.current = true;
    setForestMessageSeen(true);
    setForestIntrusion(true);
    const timer = window.setTimeout(() => setForestIntrusion(false), 650);
    return () => window.clearTimeout(timer);
  }, [index, screen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (screen !== 'quiz') return;
      if (questions[index].blocked) return;
      const number = Number(event.key);
      if (number >= 1 && number <= 4) choose(questions[index].choices[number - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function start() {
    if (!playerName.trim()) return;
    window.localStorage.removeItem(activeStorageKey);
    forestMessageSeenRef.current = false;
    setAnswers([]); setIndex(0); setAnomaly(''); setCopyStatus(''); setForestMessageSeen(false); setScreen('welcome');
  }

  function choose(choice: Choice) {
    const next = [...answers, choice];
    setAnswers(next);
    setAnomaly('');
    if (index === questions.length - 1) setScreen('result');
    else setIndex(index + 1);
  }

  function skipBlockedQuestion() {
    setAnswers([...answers, null]);
    setAnomaly('');
    if (index === questions.length - 1) setScreen('result');
    else setIndex(index + 1);
  }

  function back() {
    if (index === 0) { setScreen(assignedPlayerName ? 'welcome' : 'intro'); setAnswers([]); return; }
    setAnswers(answers.slice(0, -1)); setIndex(index - 1); setAnomaly('');
  }

  async function copyForGameMaster() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(resultSummary);
      setCopyStatus('RESULT COPIED — SEND IT TO YOUR GAME MASTER');
    } catch {
      resultSummaryRef.current?.focus(); resultSummaryRef.current?.select();
      const copied = document.execCommand('copy');
      setCopyStatus(copied ? 'RESULT COPIED — SEND IT TO YOUR GAME MASTER' : 'COPY BLOCKED — THE RESULT BELOW IS SELECTED FOR MANUAL COPYING');
    }
  }

  function retakeAssessment() {
    window.localStorage.removeItem(activeStorageKey); forestMessageSeenRef.current = false;
    setAnswers([]); setIndex(0); setAnomaly(''); setCopyStatus(''); setForestMessageSeen(false); setConfirmRetake(false); setScreen(assignedPlayerName ? 'welcome' : 'intro');
  }

  const current = questions[index];
  const resultInfo = archetypes[result.primary];
  const secondaryInfo = archetypes[result.secondary];
  const tertiaryInfo = archetypes[result.tertiary];
  const isLate = index >= 6;
  const lateSignal = screen === 'quiz' ? lateSignals[index] : undefined;
  const displayedProgress = lateSignal?.falseProgress ?? progress;
  const displayedTotal = lateSignal?.falseTotal ?? questions.length;
  const visiblePrompt = current.glitchPrompt && glitchActive ? current.glitchPrompt : current.prompt;
  const displayedPrompt = lateSignal?.personalizePrompt
    ? `${playerName.trim()}, ${visiblePrompt.charAt(0).toLowerCase()}${visiblePrompt.slice(1)}`
    : visiblePrompt;

  return (
    <main className={`game-shell phase-${screen} ${isLate || screen === 'result' ? 'journey-late' : ''} depth-${index}`}>
      <div className="scanlines" aria-hidden="true" />
      <header className="trail-header">
        <span className="brand-mark">◈ WAYFARER</span>
        <span>PERSONALITY COMPASS // v1.6</span>
      </header>

      <div className="dungeon-frame">
        <div className="stone-band stone-band-top" aria-hidden="true" />
        <div className="stone-band stone-band-bottom" aria-hidden="true" />
        <div className="stone-pillar stone-pillar-left" aria-hidden="true">
          <div className="wall-torch"><span className="torch-flame" /><span className="torch-bracket" /></div>
          <div className="corner-plate"><i /><i /><i /><i /></div>
        </div>
        <div className="stone-pillar stone-pillar-right" aria-hidden="true">
          <div className="wall-torch"><span className="torch-flame" /><span className="torch-bracket" /></div>
          <div className="corner-plate"><i /><i /><i /><i /></div>
        </div>

        <section className="game-window" aria-live="polite">
        {screen === 'intro' && (
          <div className="intro-panel panel-fade">
            <p className="eyebrow">FREE PERSONALITY QUIZ</p>
            <h1>Which Forgotten<br />Archetype Are You?</h1>
            <p className="lead">Twenty questions about how you think, decide, and work with others.</p>
            <label className="name-field">
              <span>WHAT SHOULD WE CALL YOU?</span>
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value.slice(0, 32))} onKeyDown={(event) => event.key === 'Enter' && start()} placeholder="Your first name or nickname" autoComplete="nickname" />
            </label>
            <button className="primary-button" onClick={start} disabled={!playerName.trim()}>START THE QUIZ <span>›</span></button>
            <p className="fine-print">No sign-up needed · Your name stays on this device · About 5 minutes</p>
          </div>
        )}

        {screen === 'welcome' && (
          <div className="welcome-panel panel-fade">
            <p className="eyebrow">IDENTITY CONFIRMED</p>
            <h2>WELCOME BACK,<br /><span>TRAVELER.</span></h2>
            <p className="welcome-name">RECORD RESTORED FOR {playerName.trim().toUpperCase()}</p>
            <div className="welcome-loader" aria-label="Loading assessment"><span /></div>
            <p className="welcome-copy">Preparing your personality assessment…</p>
          </div>
        )}

        {screen === 'quiz' && (
          <div className="question-panel panel-fade" key={index}>
            <div className="question-meta"><p className="eyebrow">QUESTION {index + 1} OF {displayedTotal}</p><p>{current.layer}</p></div>
            <div className="progress-track" aria-label={`${displayedProgress}% complete`}><span style={{ width: `${Math.min(displayedProgress, 100)}%` }} /></div>
            {forestIntrusion ? (
              <div className="forest-intrusion" role="status">
                <p>DO YOU MISS IT?</p>
                <p>The green. The wild forest.</p>
                <p>Does it ever come to you?</p>
                <p>Does it ever—</p>
              </div>
            ) : current.blocked ? (
              <div className="blocked-question">
                <div className="blocked-symbol">×</div>
                <p className="blocked-label">QUESTION ACCESS BLOCKED</p>
                <h2>{current.prompt}</h2>
                <p>Reason: a response matching your record was received before this question was issued.</p>
                <button className="blocked-continue" onClick={skipBlockedQuestion}>CONTINUE WITHOUT ANSWERING <span>›</span></button>
              </div>
            ) : (
              <>
                <h2 className={current.glitchPrompt && glitchActive ? 'glitched-question' : ''} key={glitchActive ? 'glitch' : 'clean'}>
                  {displayedPrompt}
                </h2>
                <div className="answers-list">
                  {current.choices.map((choice, choiceIndex) => (
                    <button className={`answer ${lateSignal?.markedChoice === choiceIndex ? 'recorded-choice' : ''}`} key={choice.text} onClick={() => choose(choice)}>
                      <span className="answer-number">{choiceIndex + 1}</span><span>{choice.text}</span>
                      {lateSignal?.markedChoice === choiceIndex && <small className="recorded-tag">ALREADY RECORDED</small>}
                    </button>
                  ))}
                  {current.odd && (
                    <button className="answer locked" aria-disabled="true" onClick={() => setAnomaly(current.odd?.notice ?? '')}>
                      <span className="lock-icon">×</span><span>{current.odd.text}</span>
                    </button>
                  )}
                  {lateSignal?.blankOption && (
                    <button className="answer blank-option" aria-label="Blank response option" onClick={() => setAnomaly(`No answer was entered, ${playerName.trim()}. The response was accepted.`)}>
                      <span className="answer-number">5</span><span aria-hidden="true">&nbsp;</span>
                    </button>
                  )}
                  {lateSignal?.ghostAnswer && (
                    <button className="answer late-ghost" disabled>
                      <span className="lock-icon">×</span><span>{lateSignal.ghostAnswer}</span>
                    </button>
                  )}
                </div>
              </>
            )}
            {lateSignal?.notice && !forestIntrusion && <div className="late-signal" role="status">{lateSignal.notice}</div>}
            <div className="quiz-foot"><button className="back-button" onClick={back}>‹ BACK</button><span>Press 1–4 to choose</span></div>
            {anomaly && <div className="anomaly" role="status">! {anomaly}</div>}
          </div>
        )}

        {screen === 'result' && (
          <div className="result-panel panel-fade">
            <p className="eyebrow">{playerName.trim().toUpperCase()}, YOUR WAYFARER IS</p>
            <div className="result-sigil"><ArchetypeSeal type={result.primary} label={resultInfo.emblemLabel} /></div>
            <h2 className="result-title">{resultInfo.name}</h2>
            <p className="result-motto">“{resultInfo.motto}”</p>
            <p className="result-copy">{resultInfo.description}</p>
            <div className="traits"><span>GIFT <b>{resultInfo.virtue}</b></span><span>SHADOW <b>{resultInfo.shadow}</b></span></div>
            <div className="secondary-result">
              <span>SECONDARY RESONANCE</span><strong><ArchetypeSeal type={result.secondary} label={secondaryInfo.emblemLabel} decorative /> {secondaryInfo.name.toUpperCase()}</strong><p>{secondaryInfo.resonance}</p>
            </div>
            <div className="secondary-result tertiary-result">
              <span>TERTIARY RESONANCE</span><strong><ArchetypeSeal type={result.tertiary} label={tertiaryInfo.emblemLabel} decorative /> {tertiaryInfo.name.toUpperCase()}</strong><p>{tertiaryInfo.resonance}</p>
            </div>
            <button className="share-button" onClick={copyForGameMaster}>COPY RESULT FOR GAME MASTER <span>⧉</span></button>
            <p className="share-help">This copies a plain-text result. No link or encoded data is created.</p>
            {copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
            <label className="summary-box assessment-summary"><span>PLAIN-TEXT ASSESSMENT RESULT</span><textarea ref={resultSummaryRef} value={resultSummary} readOnly rows={6} onFocus={(event) => event.currentTarget.select()} /></label>
            {assignedPlayerName && onContinueCalibration && <button className="primary-button" onClick={onContinueCalibration}>BEGIN CONTINUITY CALIBRATION <span>›</span></button>}
            <button className="primary-button secondary-action" onClick={() => setConfirmRetake(true)}>RETAKE ASSESSMENT</button>
            <p className="result-id">ASSESSMENT STATUS: COMPLETE ON THIS DEVICE</p>
            {confirmRetake && <div className="clear-confirm" role="alertdialog" aria-modal="true" aria-labelledby="retake-title"><strong id="retake-title">REPLACE THIS ASSESSMENT RESULT?</strong><p>Retaking will permanently replace Matt’s result saved on this browser.</p><div><button type="button" onClick={() => setConfirmRetake(false)}>KEEP RESULT</button><button type="button" onClick={retakeAssessment}>RETAKE ASSESSMENT</button></div></div>}
          </div>
        )}
        </section>
      </div>

      <footer className="status-bar">
        <span>{screen === 'intro' ? 'QUIZ TAKERS TODAY: 12' : screen === 'welcome' ? 'RETURNING TRAVELER FOUND' : screen === 'quiz' ? `QUESTIONS ANSWERED: ${index}` : 'RESULT READY TO SHARE'}</span>
        <span>{screen === 'quiz' ? `ASSESSMENT: ${progress}%` : screen === 'welcome' ? 'RECORD: RESTORED' : 'AVERAGE TIME: 03:08'}</span>
        <span className={isLate || screen === 'result' ? 'status-alert' : 'status-note'}>
          {screen === 'intro' ? 'NO ACCOUNT REQUIRED' : screen === 'welcome' ? 'ASSESSMENT INITIALIZING' : index < 5 && screen === 'quiz' ? `WELCOME, ${playerName.trim().toUpperCase()}` : screen === 'result' ? 'THREE RESONANCES RECORDED' : index < 8 ? 'RESPONSE PATTERN RECOGNIZED' : 'YOUR PROGRESS WAS SAVED BEFORE YOU ARRIVED'}
        </span>
      </footer>
    </main>
  );
}

export default function Home() {
  const [mode, setMode] = useState<'entry' | 'matt-assessment' | 'matt-calibration'>('entry');
  if (ORIGINAL_ARCHETYPE_QUIZ_ENABLED) return <OriginalArchetypeQuiz />;
  if (mode === 'matt-assessment') return <OriginalArchetypeQuiz assignedPlayerName="Matt" onContinueCalibration={() => setMode('matt-calibration')} />;
  return <ContinuityCalibration onMattAssessment={() => setMode('matt-assessment')} startMattFromSaved={mode === 'matt-calibration'} />;
}
