'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type SavedProgress = {
  stage: number;
  response: string;
  choices: Record<string, string>;
  history: { title: string; text: string }[];
  arrivalUnlocked: boolean;
  complete: boolean;
};

const STORAGE_KEY = 'wayfarer:sunny-corner:v1';
const initialProgress: SavedProgress = { stage: 0, response: '', choices: {}, history: [], arrivalUnlocked: false, complete: false };

const backstageChoices = [
  { id: 'costume', label: 'Examine the costume', response: 'The costume is unfamiliar, but your hands do not hesitate. They find the hidden clasp beneath the gold stitching, tighten the left ribbon before the right, and smooth a sunburst at your shoulder as though they have done it a hundred times.' },
  { id: 'mirror', label: 'Look in the mirror', response: 'A stranger in sunrise silk looks back. The reflection answers to a shape you do not know, but it does not feel hostile. Beyond the canvas wall, the crowd begins to call: “Auri. Auri. Auri.”' },
  { id: 'movement', label: 'Test one dance movement', response: 'You lift one heel. Your ankle turns, your weight follows, and the rest of the movement arrives before you can plan it. The body knows where the floor will be. It also knows exactly where every prop has been placed.' },
  { id: 'memory', label: 'Search for a memory', response: 'No scene returns. Instead there is an impression: rosin beneath the feet, warm canvas, the breath taken just before an entrance. It is not a memory you can name. It is still enough to steady the next second.' },
  { id: 'refuse', label: 'Refuse to go onstage', response: 'You remain where you are. The music beyond the curtain holds for one extra breath. A stagehand, unseen, quietly moves an entrance marker closer. Nothing drags you forward. The performance simply makes room for your hesitation.' },
  { id: 'who', label: 'Ask who Auri is', response: 'The name rolls through the canvas from hundreds of voices. Auri. The celebrated light of Sunwheel Circus. The answer belongs to the crowd; whatever it means to you remains yours to decide.' },
];

const aurenChoices = [
  { id: 'identity', label: 'Who are you?', response: 'Warmth settles across your shoulders like a shawl left there by someone who knew you would be cold. “You know me by the part of you that turned toward the morning. I am Auren. You are my daughter.”' },
  { id: 'why-here', label: 'Why am I here?', response: 'Gold light gathers between the seams of the tent. “You were placed where the light could still reach you.” The warmth carries no explanation beyond that—only the certainty that the choice was meant as protection.' },
  { id: 'auri', label: 'Am I Auri?', response: '“You are Celis.” The answer is immediate and gentle. “This body has carried another name. You do not have to surrender your own in order to let it carry you.”' },
  { id: 'remember', label: 'What if I cannot remember?', response: '“You do not need to remember every step. Your body remembers how to carry you. The light did not abandon you.”' },
  { id: 'trust', label: 'Can I trust this?', response: 'The light does not ask for belief. It warms your hands, brightens the path to the ring, and waits. “You are safe here,” Auren says. She leaves the choice of trust entirely with you.' },
];

const movementChoices = [
  { id: 'trust', label: 'Trust the movement', response: 'You give the next beat permission to arrive. Your feet find it. A turn unfolds into another, each one placed by physical memory rather than conscious instruction. The crowd recognizes every step before you do.' },
  { id: 'control', label: 'Fight for control', response: 'You interrupt the turn halfway through. The body adjusts without punishing you: one foot plants, one arm redraws the line, and the choreography bends around your decision. Auri’s skill does not erase Celis’s choice.' },
  { id: 'light', label: 'Reach toward the light', response: 'A gold beam crosses the ring at the exact height of your hand. When your fingers enter it, the music seems to widen. Sunlight gathers beneath your next step as if it has been waiting to catch you.' },
];

const flightChoices = [
  { id: 'face', label: 'Look for a familiar face', response: 'You search the tiers while the dance continues beneath your attention. No familiar face appears, but several strangers look at Auri with uncomplicated joy. Their recognition belongs to this body, and you are allowed to notice it without claiming it.' },
  { id: 'change', label: 'Change the choreography', response: 'You move an arm where the remembered dance expected a turn. For one suspended instant, the body has no answer—then it follows you. The crowd gasps, and the orchestra catches the new shape as though it had always been part of the score.' },
  { id: 'early', label: 'Land early', response: 'You angle toward the painted sun before the remembered apex. The light lowers you without resistance. Your feet meet the ring sooner than the crowd expects, and the surprise breaks into delighted applause.' },
  { id: 'higher', label: 'Fly higher', response: 'You ask for height. Sunlight answers beneath your ribs, not as a command but as a steady hand. The ring falls farther away. For several bright seconds you are held safely above every rope, banner, and upturned face.' },
];

function ChoiceList({ choices, onChoose }: { choices: { id: string; label: string; response: string }[]; onChoose: (id: string, label: string, response: string) => void }) {
  return <div className="sunny-choices">{choices.map((choice) => <button type="button" key={choice.id} onClick={() => onChoose(choice.id, choice.label, choice.response)}>{choice.label}<span>›</span></button>)}</div>;
}

export default function SunnyCornerExperience() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<SavedProgress>(initialProgress);
  const [restored, setRestored] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const recognized = window.sessionStorage.getItem('sunny-corner-recognized') === 'celis';
      setAuthorized(recognized);
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as SavedProgress | null;
        if (saved && typeof saved.stage === 'number') setProgress({ ...initialProgress, ...saved });
      } catch { /* Ignore a damaged device-local save. */ }
      const params = new URLSearchParams(window.location.search);
      if (recognized && params.get('arrived') === '1') setProgress((current) => ({ ...current, arrivalUnlocked: true }));
      setRestored(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!restored || !authorized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [authorized, progress, restored]);

  const stageTitle = useMemo(() => ['Backstage', 'Auren Answers', 'The Ring', 'Above the Ring', 'Distant Connection', 'The Third Bell'][Math.min(progress.stage, 5)], [progress.stage]);

  function choose(key: string, id: string, label: string, text: string) {
    setProgress((current) => ({ ...current, response: text, choices: { ...current.choices, [key]: id }, history: [...current.history, { title: label, text }] }));
  }

  function continueTo(stage: number) { setProgress((current) => ({ ...current, response: '', stage: Math.max(current.stage, stage) })); }
  function reset() { window.localStorage.removeItem(STORAGE_KEY); setProgress(initialProgress); setConfirmReset(false); }

  if (authorized === null || !restored) return <main className="sunny-loading"><span>✦</span><p>The light is finding you.</p></main>;
  if (!authorized) return <main className="sunny-denied"><span>✦</span><h1>This corner is not open.</h1><p>The light has not recognized you.</p><Link href="/">Return</Link></main>;

  if (progress.complete) return <main className="sunny-complete">
    <div className="sunny-complete-card"><span>✦</span><p>THE SUNNY CORNER</p><h1>The light has gone quiet.</h1><p>The ring is waiting. This part must happen in person.</p><details className="sunny-memory-review"><summary>Review what the light kept</summary>{progress.history.map((item, index) => <article key={`${item.title}-${index}`}><strong>{item.title}</strong><p>{item.text}</p></article>)}</details></div>
    <details className="sunny-dm-controls"><summary>SESSION CONTROL</summary><button type="button" onClick={() => setConfirmReset(true)}>RESET EXPERIENCE</button></details>
    {confirmReset && <div className="sunny-confirm" role="alertdialog" aria-modal="true"><div><strong>RESET THE SUNNY CORNER?</strong><p>This removes Celis’s saved choices from this browser.</p><button type="button" onClick={() => setConfirmReset(false)}>KEEP THEM</button><button type="button" onClick={reset}>RESET</button></div></div>}
  </main>;

  return <main className="sunny-corner-shell">
    <div className="sunny-field" aria-hidden="true" />
    <div className="sunny-rays" aria-hidden="true" />
    <header className="sunny-header"><span>✦ THE SUNNY CORNER</span><small>FOR CELIS // PRIVATE</small></header>
    <div className="sunny-layout">
      <article className="sunny-story-card panel-fade" key={progress.stage}>
        <p className="sunny-beat">{String(Math.min(progress.stage + 1, 6)).padStart(2, '0')}{' // '}{stageTitle}</p>

        {progress.stage === 0 && <><h1>Backstage at Sunwheel Circus</h1><p>Canvas walls breathe with the afternoon wind. Gold costume pieces lie in an order you do not remember choosing. Every prop is exactly where your hands expect it to be.</p><p>Beyond the curtain, an announcer draws out a name. The crowd answers it in waves.</p><div className="crowd-chant">AURI. &nbsp; AURI. &nbsp; AURI.</div>{!progress.response ? <ChoiceList choices={backstageChoices} onChoose={(id, label, text) => choose('backstage', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(1)}>LISTEN TO THE WARMTH <span>›</span></button></>}</>}

        {progress.stage === 1 && <><h1>Auren answers without appearing.</h1><p>A seam of daylight opens across the floorboards. It carries a familiar presence, though no figure stands inside it.</p><blockquote>“You are safe here.”</blockquote><p>The warmth waits for your question.</p>{!progress.response ? <ChoiceList choices={aurenChoices} onChoose={(id, label, text) => choose('auren', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(2)}>GO TO THE CURTAIN <span>›</span></button></>}</>}

        {progress.stage === 2 && <><h1>The music begins before you feel ready.</h1><p>The curtain parts. A circular ring painted like the sun waits under thousands of small golden flags. The first note arrives, and Auri’s body takes one breath in a pattern Celis never learned.</p><p>Your feet find the rhythm automatically. The first turn is already happening.</p>{!progress.response ? <ChoiceList choices={movementChoices} onChoose={(id, label, text) => choose('movement', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(3)}>FOLLOW THE NEXT MEASURE <span>›</span></button></>}</>}

        {progress.stage === 3 && <><h1>The floor falls away.</h1><p>A remembered leap carries you beyond the height it should. There is no wire. Sunlight gathers beneath you, warm and solid enough to trust without demanding that you do.</p><p>The crowd rises with a sound of recognition and joy. They have seen Auri fly before.</p>{!progress.response ? <ChoiceList choices={flightChoices} onChoose={(id, label, text) => choose('flight', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(4)}>LET THE MUSIC CARRY ON <span>›</span></button></>}</>}

        {progress.stage === 4 && <><div className="sunny-system-message"><strong>DISTANT CONNECTION DETECTED</strong><span>Six unfamiliar signatures approaching.</span><span>Existing association: NOT YOURS</span><span>Convergence expected.</span></div><p>At the edge of the light, Auren’s presence becomes very still.</p><blockquote>“When the third bell rings, leave the painted sun.”</blockquote><p>After one measure:</p><blockquote>“Take them with you.”</blockquote>{!progress.response ? <div className="sunny-choices"><button type="button" onClick={() => choose('warning', 'why', 'Ask why', '“Because protection is not the same as safety.” The answer is gentle, but it does not soften. No further explanation follows.')} >Ask why<span>›</span></button><button type="button" onClick={() => choose('warning', 'listen', 'Keep listening', 'The warning settles into the rhythm of the dance. Auren does not add another command. Warmth remains at your back, leaving the decision of what to say—and when to leave—entirely yours.')} >Keep listening<span>›</span></button></div> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(5)}>RETURN TO THE DANCE <span>›</span></button></>}</>}

        {progress.stage >= 5 && !progress.arrivalUnlocked && <><p className="sunny-beat">CONVERGENCE PENDING</p><h1>The dance continues.</h1><p>The entrance beyond the far tiers remains empty. The music turns through another bright refrain while the Sunny Corner listens for footsteps that have not arrived yet.</p><div className="sunny-waiting"><span>✦</span><strong>WAITING FOR THE PARTY</strong><p>You may review any passage while the in-person scene catches up.</p></div></>}

        {progress.stage >= 5 && progress.arrivalUnlocked && <><p className="sunny-beat">CONVERGENCE CONFIRMED</p><div className="sunny-arrival"><span>THEY HAVE ARRIVED</span><h1>Finish the dance.</h1><p>Let them find you.</p></div><button className="sunny-continue sunny-close-corner" type="button" onClick={() => setProgress((current) => ({ ...current, complete: true }))}>CLOSE THE SUNNY CORNER <span>✦</span></button></>}
      </article>

      <aside className="sunny-kept">
        <details open={progress.stage >= 5}><summary>WHAT THE LIGHT HAS KEPT <span>{progress.history.length}</span></summary>{progress.history.length ? progress.history.map((item, index) => <article key={`${item.title}-${index}`}><strong>{item.title}</strong><p>{item.text}</p></article>) : <p>Nothing has been asked of you yet.</p>}</details>
        <details className="sunny-dm-controls"><summary>SESSION CONTROL</summary><p>Use this when the six players enter the circus.</p><button type="button" disabled={progress.arrivalUnlocked} onClick={() => setProgress((current) => ({ ...current, arrivalUnlocked: true }))}>UNLOCK “THEY HAVE ARRIVED”</button><button type="button" onClick={() => setConfirmReset(true)}>RESET FOR TESTING</button></details>
      </aside>
    </div>

    {confirmReset && <div className="sunny-confirm" role="alertdialog" aria-modal="true"><div><strong>RESET THE SUNNY CORNER?</strong><p>This removes Celis’s saved choices from this browser.</p><button type="button" onClick={() => setConfirmReset(false)}>KEEP THEM</button><button type="button" onClick={reset}>RESET</button></div></div>}
  </main>;
}
