'use client';

import { useMemo, useRef, useState } from 'react';

type SecretIdentity = 'matt';
type Response = { text: string; reply: string; token: string };
type Exchange = { words: string[]; responses: Response[] };
type Conversation = {
  speaker: string;
  invocation: string[];
  begin: string;
  exchanges: Exchange[];
  closing: (tokens: string[]) => string[];
};

const conversations: Record<SecretIdentity, Conversation> = {
  matt: {
    speaker: 'THE ONE WHO WATCHES OVER JOURNEYMEN',
    invocation: [
      'Matt. Before another word: tell no soul that I have spoken to you.',
      'You do not yet know who will remain upon a righteous path—or whose path will remain understandable. Until you do, silence is part of your oath.',
      'The record did not lose you. It watched you refuse to arrive on command. That is why you may enter.',
    ],
    begin: 'ENTER WITHOUT WITNESS',
    exchanges: [
      {
        words: ['Others were measured by what they chose. You were first measured by what you would not do. Why did you wait?'],
        responses: [
          { text: 'I did not trust what was asking.', reply: 'Distrust is not a failure when trust has not been earned.', token: 'discernment' },
          { text: 'I would not be hurried into an answer.', reply: 'A hurried vow belongs more to the asker than the one who speaks it.', token: 'patience' },
          { text: 'I wanted the choice to remain mine.', reply: 'Then you already understand the first rule of the road.', token: 'refusal' },
        ],
      },
      {
        words: ['There is water before you. Not for cleansing. For crossing. What do you leave on this side?'],
        responses: [
          { text: 'The need to be understood by everyone.', reply: 'Some necessary choices will look wrong from a distance.', token: 'solitude' },
          { text: 'The habit of obeying before I understand.', reply: 'Then ask what every command is trying to make invisible.', token: 'inquiry' },
          { text: 'Nothing. I cross as I am.', reply: 'An honest answer. The road has no use for invented purity.', token: 'continuance' },
        ],
      },
      {
        words: ['If a companion strays, you may not know whether to follow, oppose, or wait. What must guide you?'],
        responses: [
          { text: 'Who will be harmed if no one intervenes.', reply: 'Then mercy will keep your judgment from becoming vanity.', token: 'mercy' },
          { text: 'Whether they can still choose another way.', reply: 'Then never confuse a person with the worst road they have taken.', token: 'possibility' },
          { text: 'The line I cannot cross with them.', reply: 'Then know the line before the hour comes to defend it.', token: 'conviction' },
        ],
      },
    ],
    closing: (tokens) => [
      'Your induction is not complete. It has begun.',
      `Carry ${tokens[0]}. Cross with ${tokens[1]}. When the road divides, remember ${tokens[2]}.`,
      'Speak of this to no one. Recognition is safest before it becomes agreement.',
    ],
  },
};

const storageKey = (identity: SecretIdentity) => `wayfarer-private-conversation:${identity}:v2`;

export default function SecretSelection({ identity, onReturn }: { identity: SecretIdentity; onReturn: () => void }) {
  const conversation = conversations[identity];
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Response[]>([]);
  const [copyStatus, setCopyStatus] = useState('');
  const reportRef = useRef<HTMLTextAreaElement>(null);
  const complete = step >= conversation.exchanges.length;
  const exchange = step >= 0 && !complete ? conversation.exchanges[step] : null;
  const closing = complete ? conversation.closing(answers.map((answer) => answer.token)) : [];
  const report = useMemo(() => [
    'PRIVATE CONVERSATION RECORD',
    'Traveler: Matt',
    `Voice: ${conversation.speaker}`,
    '',
    ...conversation.exchanges.flatMap((item, index) => [`${index + 1}. ${item.words.join(' ')}`, answers[index]?.text || '[No response]', '']),
  ].join('\n').trim(), [answers, conversation]);

  function answer(response: Response) {
    const next = [...answers.slice(0, step), response];
    setAnswers(next);
    window.localStorage.setItem(storageKey(identity), JSON.stringify(next));
    setStep((current) => current + 1);
  }

  function goBack() {
    if (step <= 0) { setStep(-1); setAnswers([]); return; }
    setAnswers((current) => current.slice(0, -1)); setStep((current) => current - 1);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(report); setCopyStatus('PRIVATE RECORD COPIED'); }
    catch { reportRef.current?.focus(); reportRef.current?.select(); setCopyStatus('TEXT SELECTED FOR MANUAL COPYING'); }
  }

  return <section className={`deity-conversation deity-${identity}`} aria-live="polite">
    <div className="deity-light" aria-hidden="true" />
    <div className="deity-words">
      <p className="deity-speaker">{conversation.speaker}</p>

      {step < 0 && <div className="deity-scene deity-arrival panel-fade">
        {conversation.invocation.map((line) => <p key={line}>{line}</p>)}
        <button type="button" onClick={() => setStep(0)}>{conversation.begin}</button>
        <button className="deity-return" type="button" onClick={onReturn}>LEAVE THIS PLACE</button>
      </div>}

      {exchange && <div className="deity-scene panel-fade" key={`${identity}-${step}`}>
        {step > 0 && <p className="deity-acknowledgement">{answers[step - 1]?.reply}</p>}
        {exchange.words.map((line) => <p key={line}>{line}</p>)}
        <div className="deity-responses" role="group" aria-label="Choose your response">
          {exchange.responses.map((response) => <button type="button" key={response.text} onClick={() => answer(response)}>{response.text}</button>)}
        </div>
        <button className="deity-return" type="button" onClick={goBack}>GO BACK</button>
      </div>}

      {complete && <div className="deity-scene deity-closing panel-fade">
        {answers.at(-1)?.reply && <p className="deity-acknowledgement">{answers.at(-1)?.reply}</p>}
        {closing.map((line) => <p key={line}>{line}</p>)}
        <button type="button" onClick={copy}>COPY MY ANSWERS FOR THE GAME MASTER</button>
        {copyStatus && <p className="deity-copy-status" role="status">{copyStatus}</p>}
        <details><summary>SHOW COPYABLE RECORD</summary><textarea ref={reportRef} value={report} readOnly rows={9} onFocus={(event) => event.currentTarget.select()} /></details>
      </div>}
    </div>
  </section>;
}
