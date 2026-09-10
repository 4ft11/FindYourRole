'use client';

import { useMemo, useRef, useState } from 'react';

type SecretIdentity = 'celis' | 'matt';
type SecretQuestion = { id: string; prompt: string; options: string[] };
type Journey = {
  eyebrow: string;
  heading: string;
  opening: string[];
  questions: SecretQuestion[];
  resultHeading: string;
  resultLines: string[];
};

const journeys: Record<SecretIdentity, Journey> = {
  celis: {
    eyebrow: 'A SMALL LIGHT HAS REQUESTED YOUR NAME',
    heading: 'Celis, something chose to bloom.',
    opening: [
      'This is not an assessment.',
      'There are no incorrect answers here. Only invitations.',
    ],
    questions: [
      { id: 'wonder', prompt: 'A hidden door opens into a moonlit garden. What draws you in first?', options: ['The tiny lights moving between the flowers', 'A song with no visible singer', 'The creature waiting beside the path', 'The feeling that someone prepared this for me'] },
      { id: 'magic', prompt: 'If magic answered your personality before your words, how would it appear?', options: ['Soft light and drifting petals', 'Glittering wings and impossible color', 'A warm charm that protects someone nearby', 'A secret path only I can see'] },
      { id: 'play', prompt: 'Which moment would feel most magical to play?', options: ['Discovering a strange new ability', 'Befriending a creature everyone misunderstood', 'Transforming when the party needs me', 'Finding beauty in a dangerous place'] },
      { id: 'daughter', prompt: 'A golden presence offers you a place beside her. What would make you accept?', options: ['She asks instead of commands', 'She protects my freedom', 'She tells me why she chose me', 'I may choose what the bond becomes'] },
    ],
    resultHeading: 'THE INVITATION REMAINS OPEN.',
    resultLines: [
      'Auren did not mistake you for someone else.',
      'Whatever this bond becomes, you will be allowed to choose it too.',
    ],
  },
  matt: {
    eyebrow: 'DELAY RECORDED // DELAY ACCEPTED',
    heading: 'Matt, the record learned to wait.',
    opening: [
      'You were not overlooked.',
      'The refusal was part of what the record needed to see.',
    ],
    questions: [
      { id: 'refusal', prompt: 'What makes refusing an order worthwhile?', options: ['The order has not earned my trust', 'Obedience would harm someone', 'The person giving it expects no resistance', 'I need to know that refusal is still possible'] },
      { id: 'pressure', prompt: 'When everyone expects you to act, what do you trust first?', options: ['My own judgment', 'The person with the clearest evidence', 'The person most affected by the choice', 'No one until the question is better'] },
      { id: 'play', prompt: 'Which role sounds most satisfying when plans fall apart?', options: ['Challenge the assumption everyone accepted', 'Hold the line while others adapt', 'Find the option no one offered', 'Decide what I will not allow'] },
      { id: 'waiting', prompt: 'A gate opens only after you stop trying to enter. What changed?', options: ['The gate', 'The person waiting behind it', 'What I was willing to accept', 'Nothing. That is the point.'] },
    ],
    resultHeading: 'A PATH THAT FEARS REFUSAL CANNOT KEEP YOU.',
    resultLines: [
      'The delay did not disqualify you. It identified you.',
      'The record was never measuring how quickly you obeyed.',
    ],
  },
};

const storageKey = (identity: SecretIdentity) => `wayfarer-private-selection:${identity}:v1`;

export default function SecretSelection({ identity, onReturn }: { identity: SecretIdentity; onReturn: () => void }) {
  const journey = journeys[identity];
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(window.localStorage.getItem(storageKey(identity)) || '{}') as Record<string, string>; } catch { return {}; }
  });
  const [copyStatus, setCopyStatus] = useState('');
  const reportRef = useRef<HTMLTextAreaElement>(null);
  const complete = step >= journey.questions.length;
  const question = journey.questions[Math.max(0, step)];
  const progress = complete ? 100 : Math.max(0, Math.round((step / journey.questions.length) * 100));
  const report = useMemo(() => [
    'PRIVATE SELECTION RECORD',
    `Traveler: ${identity === 'celis' ? 'Celis' : 'Matt'}`,
    '',
    ...journey.questions.flatMap((item, index) => [`${index + 1}. ${item.prompt}`, answers[item.id] || '[No response]', '']),
  ].join('\n').trim(), [answers, identity, journey.questions]);

  function choose(value: string) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    window.localStorage.setItem(storageKey(identity), JSON.stringify(next));
    setStep((current) => current + 1);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(report); setCopyStatus('PRIVATE RECORD COPIED'); }
    catch { reportRef.current?.focus(); reportRef.current?.select(); setCopyStatus('COPY BLOCKED // TEXT SELECTED'); }
  }

  return <section className={`secret-selection secret-${identity} panel-fade`}>
    <div className="secret-motes" aria-hidden="true"><i /><i /><i /><i /><i /></div>
    {step < 0 && <>
      <p className="eyebrow">{journey.eyebrow}</p>
      <h2>{journey.heading}</h2>
      <div className="secret-prologue">{journey.opening.map((line) => <p key={line}>{line}</p>)}</div>
      <button className="primary-button" type="button" onClick={() => setStep(0)}>ACCEPT THE INVITATION <span>›</span></button>
      <button className="clear-link" type="button" onClick={onReturn}>Return</button>
    </>}
    {step >= 0 && !complete && question && <>
      <div className="question-meta"><p className="eyebrow">PRIVATE QUESTION {step + 1} OF {journey.questions.length}</p><p>{identity === 'celis' ? 'GOLDEN SELECTION' : 'DEFERRED RECORD'}</p></div>
      <div className="progress-track" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div>
      <h2>{question.prompt}</h2>
      <div className="calibration-options secret-options">{question.options.map((option) => <button type="button" className="calibration-option" key={option} onClick={() => choose(option)}>{option}</button>)}</div>
      <div className="calibration-nav"><button type="button" className="back-button" onClick={() => setStep((current) => current - 1)}>‹ BACK</button><span>Choose what feels closest.</span></div>
    </>}
    {complete && <>
      <p className="eyebrow">PRIVATE RECOGNITION COMPLETE</p>
      <div className="secret-sigil" aria-hidden="true">{identity === 'celis' ? '✦' : 'Ⅱ'}</div>
      <h2>{journey.resultHeading}</h2>
      <div className="secret-prologue">{journey.resultLines.map((line) => <p key={line}>{line}</p>)}</div>
      <div className="secret-warning"><strong>KEEP THIS RECORD PRIVATE.</strong><span>Do not tell the others what appeared here. They will receive what belongs to them when the record is ready.</span></div>
      <button type="button" className="copy-answers" onClick={copy}>COPY PRIVATE ANSWERS <span>⧉</span></button>
      {copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
      <label className="summary-box secret-summary"><span>PRIVATE TEXT FOR THE GAME MASTER</span><textarea ref={reportRef} value={report} readOnly rows={9} onFocus={(event) => event.currentTarget.select()} /></label>
    </>}
  </section>;
}
