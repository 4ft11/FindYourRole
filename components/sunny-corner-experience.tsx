'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';

type StoryChoice = { id: string; label: string; response: string };
type SavedProgress = {
  stage: number;
  response: string;
  choices: Record<string, string>;
  history: { title: string; text: string }[];
  explored: string[];
  aurenAsked: string[];
  motes: string[];
  arrivalUnlocked: boolean;
  complete: boolean;
};

const STORAGE_KEY = 'wayfarer:sunny-corner:v2';
const SUNNY_TITLES = ['The Dressing Tent', 'Auren Answers', 'Choose a Wonder', 'Catch the Daylight', 'The Entrance', 'The First Dance', 'Held Aloft', 'One More Marvel', 'A Quiet Warning', 'The Third Bell'];
const initialProgress: SavedProgress = { stage: 0, response: '', choices: {}, history: [], explored: [], aurenAsked: [], motes: [], arrivalUnlocked: false, complete: false };

const backstageChoices: StoryChoice[] = [
  { id: 'costume', label: 'Find the hidden clasp', response: 'The costume is unfamiliar, but your hands do not hesitate. They find a clasp beneath the gold stitching, tighten the left ribbon before the right, and smooth a sunburst at your shoulder as though they have done it a hundred times.' },
  { id: 'mirror', label: 'Meet the girl in the mirror', response: 'A stranger in sunrise silk looks back. She has a dusting of gold across her cheeks and one stubborn curl escaping its pin. The reflection answers to a shape you do not know, but it does not feel hostile.' },
  { id: 'movement', label: 'Try the impossible dance step', response: 'You lift one heel. Your ankle turns, your weight follows, and the rest of the movement arrives before you can plan it. The body knows where the floor will be. It even adds a small, unnecessary flourish at the end.' },
  { id: 'props', label: 'Investigate the prop table', response: 'The table holds ribbons, hoops, paper stars, and a very serious wooden duck wearing a tiny crown. Your fingers avoid three harmless objects and reach directly for the one that is yours.' },
  { id: 'curtain', label: 'Peek through the curtain', response: 'Sunwheel Circus opens beyond the gap: striped tents, swaying banners, and a ring painted like a great yellow sun. A child in the front row is wearing homemade wings. The crowd begins to stamp in rhythm.' },
  { id: 'memory', label: 'Search gently for a memory', response: 'No scene returns. Instead there is an impression: rosin beneath the feet, warm canvas, the breath taken just before an entrance. It is not a memory you can name. It is still enough to steady the next second.' },
  { id: 'refuse', label: 'Sit down and refuse to perform', response: 'You sit. The music beyond the curtain holds for one extra breath. An unseen stagehand quietly moves an entrance marker closer to your chair. Nothing drags you forward. The performance simply makes room for your hesitation.' },
  { id: 'who', label: 'Ask the room who Auri is', response: 'The answer rolls through the canvas from hundreds of voices: “Auri! Auri! Auri!” The celebrated light of Sunwheel Circus. The answer belongs to the crowd; whatever the name means to you remains yours to decide.' },
];

const aurenChoices: StoryChoice[] = [
  { id: 'identity', label: 'Who are you?', response: 'Warmth settles across your shoulders like a shawl left there by someone who knew you would be cold. “You know me by the part of you that turned toward the morning. I am Auren. You are my daughter.”' },
  { id: 'why-here', label: 'Why did you bring me here?', response: 'Gold light gathers between the seams of the tent. “You were placed where the light could still reach you.” The warmth carries no explanation beyond that—only the certainty that the choice was meant as protection.' },
  { id: 'auri', label: 'Am I Auri now?', response: '“You are Celis.” The answer is immediate and gentle. “This body has carried another name. You do not have to surrender your own in order to let it carry you.”' },
  { id: 'remember', label: 'What if I cannot remember the dance?', response: '“You do not need to remember every step. Your body remembers how to carry you. The light did not abandon you.”' },
  { id: 'trust', label: 'How do I know I can trust this?', response: 'The light does not ask for belief. It warms your hands, brightens the path to the ring, and waits. “You are safe here,” Auren says. She leaves the choice of trust entirely with you.' },
  { id: 'afraid', label: 'What if I am afraid?', response: 'The sunlight grows no brighter and does not try to erase the fear. “Then you may be afraid in the light. Courage is not the price of being held.”' },
  { id: 'watching', label: 'Will you be watching?', response: 'A bright freckle appears on the back of your hand, warm as a sunbeam through glass. “Every time the light finds you.”' },
];

const propChoices: StoryChoice[] = [
  { id: 'ribbon', label: 'A ribbon that trails little suns', response: 'The ribbon is pale gold until you lift it. Then tiny suns travel down its length one by one, each no larger than a coin. It loops once around your wrist and waits there politely.' },
  { id: 'hoop', label: 'A hoop warm from impossible daylight', response: 'The hoop is light as grass and warm as a windowsill at noon. When you turn it, the empty center briefly shows blue sky instead of canvas walls.' },
  { id: 'bells', label: 'A pair of bell-bright anklets', response: 'The anklets fasten themselves with a cheerful chime. One bell rings a fraction too late, as though it has its own sense of comic timing.' },
  { id: 'parasol', label: 'A tiny sunflower parasol', response: 'The parasol opens with a soft pop. Its painted petals turn toward you instead of the sun. It is far too small to be useful and somehow exactly right for the performance.' },
];

const entranceChoices: StoryChoice[] = [
  { id: 'curtain', label: 'Step through before doubt catches up', response: 'You step through on the next drumbeat. The gold flags overhead lift all at once, though there is no wind. The crowd’s delight reaches you like the warmth of an open oven.' },
  { id: 'ribbon-door', label: 'Draw a doorway in the air', response: 'A sweep of your hand leaves a bright line hanging in the air. It bends into a doorway, and you step through it into the center of the ring. The children in the front row lose their minds.' },
  { id: 'wrong-way', label: 'Enter from the completely wrong side', response: 'You slip through a side flap beside the musicians. A drummer nearly drops his sticks, then turns your mistake into a fanfare. The audience laughs with delight, not at you but with you.' },
  { id: 'quiet', label: 'Walk in slowly and make them wait', response: 'You do not rush. The stamping fades. The whole tent leans into the silence until your first foot touches the painted sun—and then the music blooms beneath it.' },
];

const movementChoices: StoryChoice[] = [
  { id: 'trust', label: 'Trust the movement', response: 'You give the next beat permission to arrive. Your feet find it. A turn unfolds into another, each one placed by physical memory rather than conscious instruction. The crowd recognizes every step before you do.' },
  { id: 'control', label: 'Change the dance on purpose', response: 'You interrupt the turn halfway through. The body adjusts without punishing you: one foot plants, one arm redraws the line, and the choreography bends around your decision. Auri’s skill does not erase Celis’s choice.' },
  { id: 'light', label: 'Reach toward the light', response: 'A gold beam crosses the ring at the exact height of your hand. When your fingers enter it, the music seems to widen. Sunlight gathers beneath your next step as if it has been waiting to catch you.' },
  { id: 'audience', label: 'Make the front row part of the dance', response: 'You send one bright gesture toward the front row. Five children copy it immediately, then five more. Within a breath, half the tent is attempting the movement with magnificent inaccuracy.' },
];

const flightChoices: StoryChoice[] = [
  { id: 'face', label: 'Look for a familiar face', response: 'You search the tiers while the dance continues beneath your attention. No familiar face appears, but several strangers look at Auri with uncomplicated joy. Their recognition belongs to this body, and you are allowed to notice it without claiming it.' },
  { id: 'change', label: 'Invent a step in midair', response: 'You move where the remembered dance expected stillness. For one suspended instant, the body has no answer—then it follows you. The orchestra catches the new shape as though it had always been part of the score.' },
  { id: 'early', label: 'Land early', response: 'You angle toward the painted sun before the remembered apex. The light lowers you without resistance. Your feet meet the ring sooner than the crowd expects, and the surprise breaks into delighted applause.' },
  { id: 'higher', label: 'Ask the sunlight for more height', response: 'You ask for height. Sunlight answers beneath your ribs, not as a command but as a steady hand. The ring falls farther away. For several bright seconds you are held safely above every rope, banner, and upturned face.' },
];

const encoreChoices: StoryChoice[] = [
  { id: 'constellation', label: 'Scatter a constellation over the tent', response: 'You open your hands. The lights you gathered escape in a laughing spiral and settle across the canvas roof. For a moment, the daytime circus has stars—and every one of them is gold.' },
  { id: 'child', label: 'Send one tiny sun to the child with wings', response: 'A bead of light drifts down to the child in homemade wings. It lands between their palms and sneezes a puff of glitter. Their astonished smile is brighter than anything in the ring.' },
  { id: 'upside-down', label: 'Take an upside-down bow', response: 'The sunlight turns you gently until the whole tent is inverted. You bow to the crowd from the air. One of your anklets—or perhaps the orchestra—adds a perfectly timed little ding.' },
  { id: 'quiet-light', label: 'Let the final light rest in your hands', response: 'You gather the brightness between your palms and hold it there. The tent becomes quiet enough to hear the canvas breathe. When you release it, the applause arrives like summer rain.' },
];

const motes = [
  { id: 'one', label: 'A light hiding near the mirror', response: 'A warm spark lands on your fingertip. It remembers the exact distance between the dressing room and the ring.' },
  { id: 'two', label: 'A light tangled in the costume ribbons', response: 'This one wriggles free and circles your wrist. It remembers that the third ribbon is decorative and the fourth one keeps the whole costume together.' },
  { id: 'three', label: 'A light asleep inside the crowned duck', response: 'The wooden duck coughs up a gold mote with immense dignity. It remembers that Auri always saluted the musicians before the final bow.' },
  { id: 'four', label: 'A light bouncing beneath the prop table', response: 'You catch it after two false starts. It remembers the springy patch near the eastern edge of the painted sun.' },
  { id: 'five', label: 'A light waiting in your own shadow', response: 'The last mote rises from your shadow and rests over your heart. It carries no borrowed memory at all. This light recognizes Celis.' },
];

function ChoiceList({ choices, onChoose, selected = [] }: { choices: StoryChoice[]; onChoose: (id: string, label: string, response: string) => void; selected?: string[] }) {
  return <div className="sunny-choices">{choices.map((choice) => <button className={selected.includes(choice.id) ? 'is-discovered' : ''} type="button" key={choice.id} disabled={selected.includes(choice.id)} onClick={() => onChoose(choice.id, choice.label, choice.response)}>{choice.label}<span>{selected.includes(choice.id) ? 'FOUND' : '›'}</span></button>)}</div>;
}

function ResetDialog({ cancel, reset }: { cancel: () => void; reset: () => void }) {
  return <div className="sunny-confirm" role="alertdialog" aria-modal="true"><div><strong>RESET THE SUNNY CORNER?</strong><p>This removes Celis’s saved choices from this browser.</p><button type="button" onClick={cancel}>KEEP THEM</button><button type="button" onClick={reset}>RESET</button></div></div>;
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

  const stageTitle = useMemo(() => SUNNY_TITLES[Math.min(progress.stage, SUNNY_TITLES.length - 1)], [progress.stage]);
  const chosenProp = propChoices.find((item) => item.id === progress.choices.prop)?.label.toLowerCase() || 'chosen wonder';

  function addHistory(current: SavedProgress, key: string, label: string, text: string) {
    if (current.choices[key]) return current.history;
    return [...current.history, { title: label, text }];
  }
  function choose(key: string, id: string, label: string, text: string) { setProgress((current) => ({ ...current, response: text, choices: { ...current.choices, [key]: id }, history: addHistory(current, key, label, text) })); }
  function explore(id: string, label: string, text: string) { setProgress((current) => current.explored.includes(id) ? current : ({ ...current, response: text, explored: [...current.explored, id], choices: { ...current.choices, [`backstage:${id}`]: id }, history: [...current.history, { title: label, text }] })); }
  function askAuren(id: string, label: string, text: string) { setProgress((current) => current.aurenAsked.includes(id) ? current : ({ ...current, response: text, aurenAsked: [...current.aurenAsked, id], choices: { ...current.choices, [`auren:${id}`]: id }, history: [...current.history, { title: label, text }] })); }
  function catchMote(id: string, label: string, text: string) { setProgress((current) => current.motes.includes(id) ? current : ({ ...current, response: text, motes: [...current.motes, id], choices: { ...current.choices, [`mote:${id}`]: id }, history: [...current.history, { title: label, text }] })); }
  function continueTo(stage: number) { setProgress((current) => ({ ...current, response: '', stage: Math.max(current.stage, stage) })); }
  function reset() { window.localStorage.removeItem(STORAGE_KEY); setProgress(initialProgress); setConfirmReset(false); }

  if (authorized === null || !restored) return <main className="sunny-loading"><span>✦</span><p>The light is finding you.</p></main>;
  if (!authorized) return <main className="sunny-denied"><span>✦</span><h1>This corner is not open.</h1><p>The light has not recognized you.</p><Link href="/">Return</Link></main>;

  if (progress.complete) return <main className="sunny-complete">
    <div className="sunny-complete-card"><span>✦</span><p>THE SUNNY CORNER</p><h1>The light has gone quiet.</h1><p>The ring is waiting. This part must happen in person.</p><details className="sunny-memory-review"><summary>Review what the light kept</summary>{progress.history.map((item, index) => <article key={`${item.title}-${index}`}><strong>{item.title}</strong><p>{item.text}</p></article>)}</details></div>
    <details className="sunny-dm-controls"><summary>SESSION CONTROL</summary><button type="button" onClick={() => setConfirmReset(true)}>RESET EXPERIENCE</button></details>
    {confirmReset && <ResetDialog cancel={() => setConfirmReset(false)} reset={reset} />}
  </main>;

  return <main className="sunny-corner-shell">
    <div className="sunny-field" aria-hidden="true" /><div className="sunny-rays" aria-hidden="true" />
    <header className="sunny-header"><span>✦ THE SUNNY CORNER</span><small>FOR CELIS // PRIVATE</small></header>
    <div className="sunny-layout">
      <article className="sunny-story-card panel-fade" key={progress.stage}>
        <div className="sunny-story-progress" aria-label={`Chapter ${Math.min(progress.stage + 1, 10)} of 10`}><span style={{ width: `${Math.min((progress.stage + 1) * 10, 100)}%` }} /></div>
        <p className="sunny-beat">{String(Math.min(progress.stage + 1, 10)).padStart(2, '0')}{' // '}{stageTitle}</p>

        {progress.stage === 0 && <><h1>Backstage at Sunwheel Circus</h1><p>Canvas walls breathe with the afternoon wind. Gold costume pieces lie in an order you do not remember choosing. Every prop is exactly where your hands expect it to be.</p><p>Beyond the curtain, an announcer draws out a name. The crowd answers it in waves.</p><div className="crowd-chant">AURI. &nbsp; AURI. &nbsp; AURI.</div><p className="sunny-instruction">Explore at least three things. Stay as long as you like.</p><ChoiceList choices={backstageChoices} selected={progress.explored} onChoose={explore} />{progress.response && <div className="sunny-response">{progress.response}</div>}{progress.explored.length >= 3 && <button className="sunny-continue" type="button" onClick={() => continueTo(1)}>FOLLOW THE WARMTH IN THE FLOORBOARDS <span>›</span></button>}</>}

        {progress.stage === 1 && <><h1>Auren answers without appearing.</h1><p>A seam of daylight opens across the floorboards. It carries a familiar presence, though no figure stands inside it.</p><blockquote>“You are safe here.”</blockquote><p>The warmth does not hurry you. You may ask more than one question.</p><p className="sunny-instruction">Ask at least two. Auren will wait for the rest.</p><ChoiceList choices={aurenChoices} selected={progress.aurenAsked} onChoose={askAuren} />{progress.response && <div className="sunny-response">{progress.response}</div>}{progress.aurenAsked.length >= 2 && <button className="sunny-continue" type="button" onClick={() => continueTo(2)}>SEE WHAT AURI LEFT READY <span>›</span></button>}</>}

        {progress.stage === 2 && <><h1>Four wonders wait on the prop table.</h1><p>Your hands know all of them. Only one seems to be waiting for <em>you</em>.</p><p>There is no wrong choice. Circus magic is famously bad at being sensible.</p>{!progress.response ? <ChoiceList choices={propChoices} onChoose={(id, label, text) => choose('prop', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(3)}>FOLLOW THE RUNAWAY LIGHTS <span>›</span></button></>}</>}

        {progress.stage === 3 && <><h1>Five pieces of daylight have escaped.</h1><p>They dart around the dressing tent like fireflies with important appointments. Each one seems to be carrying something Auri’s body wants you to know.</p><p className="sunny-instruction">Catch every light before the music begins.</p><div className="sunny-mote-field">{motes.map((mote, index) => <button aria-label={mote.label} className={progress.motes.includes(mote.id) ? 'is-caught' : ''} disabled={progress.motes.includes(mote.id)} key={mote.id} onClick={() => catchMote(mote.id, mote.label, mote.response)} style={{ '--mote-index': index } as CSSProperties}><span>✦</span><small>{progress.motes.includes(mote.id) ? 'CAUGHT' : mote.label}</small></button>)}</div>{progress.response && <div className="sunny-response">{progress.response}</div>}{progress.motes.length === motes.length && <><blockquote>“There you are,” the warmth says, fondly.</blockquote><button className="sunny-continue" type="button" onClick={() => continueTo(4)}>ANSWER THE FIRST DRUMBEAT <span>›</span></button></>}</>}

        {progress.stage === 4 && <><h1>The music begins before you feel ready.</h1><p>Beyond the curtain, the ring glows like a coin at the bottom of clear water. Your {chosenProp} gives one small, encouraging shimmer.</p><p>The announcer cries Auri’s name. You decide how Celis answers.</p>{!progress.response ? <ChoiceList choices={entranceChoices} onChoose={(id, label, text) => choose('entrance', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(5)}>LET THE DANCE BEGIN <span>›</span></button></>}</>}

        {progress.stage === 5 && <><h1>The painted sun knows your footsteps.</h1><p>Auri’s body takes one breath in a pattern Celis never learned. Your {chosenProp} moves with you. The first turn arrives, and then the next.</p><p>The dance remembers its performer. It still leaves room for you.</p>{!progress.response ? <ChoiceList choices={movementChoices} onChoose={(id, label, text) => choose('movement', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(6)}>FOLLOW THE RISING MELODY <span>›</span></button></>}</>}

        {progress.stage === 6 && <><h1>The floor falls away.</h1><p>A remembered leap carries you beyond the height it should. There is no wire. Sunlight gathers beneath you, warm and solid enough to trust without demanding that you do.</p><p>The crowd rises with a sound of recognition and joy. They have seen Auri fly before.</p>{!progress.response ? <ChoiceList choices={flightChoices} onChoose={(id, label, text) => choose('flight', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(7)}>GIVE THEM ONE MORE MARVEL <span>›</span></button></>}</>}

        {progress.stage === 7 && <><h1>The orchestra holds the final note.</h1><p>Everyone expects the ending Auri always gave them. The daylight around you waits for the ending Celis will choose instead.</p>{!progress.response ? <ChoiceList choices={encoreChoices} onChoose={(id, label, text) => choose('encore', id, label, text)} /> : <><div className="sunny-response">{progress.response}</div><p>The crowd is still applauding when another sensation enters the light—distant, unfamiliar, and approaching.</p><button className="sunny-continue" type="button" onClick={() => continueTo(8)}>LISTEN BEYOND THE APPLAUSE <span>›</span></button></>}</>}

        {progress.stage === 8 && <><div className="sunny-system-message"><strong>DISTANT CONNECTION DETECTED</strong><span>Six unfamiliar signatures approaching.</span><span>Existing association: NOT YOURS</span><span>Convergence expected.</span></div><p>At the edge of the light, Auren’s presence becomes very still.</p><blockquote>“When the third bell rings, leave the painted sun.”</blockquote><p>After one measure:</p><blockquote>“Take them with you.”</blockquote>{!progress.response ? <div className="sunny-choices"><button type="button" onClick={() => choose('warning', 'why', 'Ask why', '“Because protection is not the same as safety.” The answer is gentle, but it does not soften. No further explanation follows.')}>Ask why<span>›</span></button><button type="button" onClick={() => choose('warning', 'listen', 'Keep listening', 'The warning settles into the rhythm of the dance. Auren does not add another command. Warmth remains at your back, leaving the decision of what to say—and when to leave—entirely yours.')}>Keep listening<span>›</span></button></div> : <><div className="sunny-response">{progress.response}</div><button className="sunny-continue" type="button" onClick={() => continueTo(9)}>RETURN TO THE DANCE <span>›</span></button></>}</>}

        {progress.stage >= 9 && !progress.arrivalUnlocked && <><p className="sunny-beat">CONVERGENCE PENDING</p><h1>The dance continues.</h1><p>The entrance beyond the far tiers remains empty. The music turns through another bright refrain while the Sunny Corner listens for footsteps that have not arrived yet.</p><div className="sunny-waiting"><span>✦</span><strong>WAITING FOR THE PARTY</strong><p>You may review any passage while the in-person scene catches up.</p></div></>}
        {progress.stage >= 9 && progress.arrivalUnlocked && <><p className="sunny-beat">CONVERGENCE CONFIRMED</p><div className="sunny-arrival"><span>THEY HAVE ARRIVED</span><h1>Finish the dance.</h1><p>Let them find you.</p></div><button className="sunny-continue sunny-close-corner" type="button" onClick={() => setProgress((current) => ({ ...current, complete: true }))}>CLOSE THE SUNNY CORNER <span>✦</span></button></>}
      </article>

      <aside className="sunny-kept">
        <details open={progress.stage >= 9}><summary>WHAT THE LIGHT HAS KEPT <span>{progress.history.length}</span></summary>{progress.history.length ? progress.history.map((item, index) => <article key={`${item.title}-${index}`}><strong>{item.title}</strong><p>{item.text}</p></article>) : <p>Nothing has been asked of you yet.</p>}</details>
        <details className="sunny-dm-controls"><summary>SESSION CONTROL</summary><p>Use this when the six players enter the circus.</p><button type="button" disabled={progress.arrivalUnlocked} onClick={() => setProgress((current) => ({ ...current, arrivalUnlocked: true }))}>UNLOCK “THEY HAVE ARRIVED”</button><button type="button" onClick={() => setConfirmReset(true)}>RESET FOR TESTING</button></details>
      </aside>
    </div>
    {confirmReset && <ResetDialog cancel={() => setConfirmReset(false)} reset={reset} />}
  </main>;
}
