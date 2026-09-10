'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CalibrationQuestion, findPlayer, normalizeIdentity, PlayerConfig, Role, roles } from '@/app/player-config';
import type { CampaignPlayer, RoleStatus } from '@/lib/campaign-types';
import PlayerPage from './player-page';
import RoleStatusBar, { defaultRoleStatus } from './role-status-bar';
import SecretSelection from './secret-selection';

type Screen = 'verify' | 'secret-selection' | 'matched' | 'calibration' | 'complete' | 'player';
type Answers = Record<string, string>;
const storageKey = (playerKey: string) => `wayfarer-continuity:${playerKey}:v1`;

function copyWithFallback(text: string, fallback: HTMLTextAreaElement | null) {
  const manualCopy = () => {
    if (!fallback) throw new Error('Clipboard unavailable');
    fallback.focus(); fallback.select();
    if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
  };
  if (!navigator.clipboard) { manualCopy(); return Promise.resolve(); }
  return navigator.clipboard.writeText(text).catch(manualCopy);
}

function QuestionField({ question, value, onChange }: { question: CalibrationQuestion; value: string; onChange: (value: string) => void }) {
  if (question.kind === 'choice') {
    return <div className="calibration-options">{question.options?.map((option) => <button type="button" className={value === option ? 'calibration-option selected' : 'calibration-option'} key={option} onClick={() => onChange(option)}>{option}</button>)}</div>;
  }
  if (question.kind === 'choice-or-text') {
    return <div className="choice-or-text">
      {question.suggestion && <button type="button" className={value === question.suggestion ? 'calibration-option suggested selected' : 'calibration-option suggested'} onClick={() => onChange(question.suggestion!)}><span>SUGGESTED MANIFESTATION</span>{question.suggestion}</button>}
      <label className="short-answer"><span>OR DESCRIBE ANOTHER MANIFESTATION</span><textarea value={value === question.suggestion ? '' : value} onChange={(event) => onChange(event.target.value)} rows={4} placeholder="Your answer" /></label>
    </div>;
  }
  return <label className="short-answer"><span>YOUR RESPONSE</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} placeholder="Type your answer here…" /></label>;
}

export default function ContinuityCalibration() {
  const [screen, setScreen] = useState<Screen>('verify');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [affirmed, setAffirmed] = useState(false);
  const [error, setError] = useState<'missing' | 'unknown' | 'conflict' | 'storage' | ''>('');
  const [player, setPlayer] = useState<PlayerConfig | null>(null);
  const [campaignPlayer, setCampaignPlayer] = useState<CampaignPlayer | null>(null);
  const [roleStatus, setRoleStatus] = useState<RoleStatus>(defaultRoleStatus);
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const secretIdentity = (['celis', 'matt'].includes(normalizeIdentity(name)) ? normalizeIdentity(name) : null) as 'celis' | 'matt' | null;
  const knownIdentity = findPlayer(name);

  const question = player?.questions[index];
  const currentAnswer = question ? answers[question.id] ?? '' : '';
  const progress = player ? Math.round((Object.values(answers).filter((answer) => answer.trim()).length / player.questions.length) * 100) : 0;
  const summary = useMemo(() => {
    if (!player) return '';
    const record = campaignPlayer || player;
    const chosenManifestation = player.questions.some((item) => item.id === 'celestial-form') ? answers['celestial-form']?.trim() || 'Unconfirmed' : player.manifestation || 'Not applicable';
    return ['CONTINUITY CALIBRATION', '', `Player: ${record.name}`, `Role: ${'displayRole' in record ? record.displayRole : record.role}`, `Path: ${record.path}`, `Class: ${record.characterClass}${'subclass' in record && record.subclass !== 'UNCONFIRMED' ? ` — ${record.subclass}` : ''}`, `Species: ${record.species}`, `Manifestation: ${chosenManifestation}`, '', ...player.questions.flatMap((item, questionIndex) => [`${questionIndex + 1}. ${item.prompt}`, answers[item.id]?.trim() || '[No answer]', ''])].join('\n').trim();
  }, [answers, campaignPlayer, player]);

  useEffect(() => {
    fetch('/api/status', { cache: 'no-store' }).then((response) => response.ok ? response.json() as Promise<{ status?: RoleStatus }> : null).then((data) => data?.status && setRoleStatus(data.status)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!player || (screen !== 'calibration' && screen !== 'complete')) return;
    window.localStorage.setItem(storageKey(player.key), JSON.stringify({ version: 1, answers, index, screen }));
  }, [answers, index, player, screen]);

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError('missing'); return; }
    if (secretIdentity) { setError(''); setScreen('secret-selection'); return; }
    if (!knownIdentity) { setError('unknown'); return; }
    if (!affirmed || !name.trim() || !role) { setError('missing'); return; }
    const response = await fetch('/api/player/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, role }) });
    const result = await response.json().catch(() => ({})) as { kind?: 'unknown' | 'conflict' | 'matched'; player?: CampaignPlayer };
    if (response.status === 404 || result.kind === 'unknown') { setError('unknown'); return; }
    if (response.status === 409 || result.kind === 'conflict') { setError('conflict'); return; }
    if (!response.ok || !result.player) { setError('storage'); return; }
    const match = findPlayer(result.player.name);
    if (!match) { setError('unknown'); return; }
    let restoredAnswers: Answers = {}; let restoredIndex = 0; let restoredScreen: Screen = 'matched';
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey(match.key)) || 'null') as { version?: number; answers?: Answers; index?: number; screen?: Screen } | null;
      if (saved?.version === 1 && saved.answers && (saved.screen === 'calibration' || saved.screen === 'complete')) {
        restoredAnswers = saved.answers; restoredIndex = Math.min(Math.max(saved.index || 0, 0), match.questions.length - 1); restoredScreen = saved.screen;
      }
    } catch { /* Ignore malformed device-local drafts. */ }
    setPlayer(match); setCampaignPlayer(result.player); setAnswers(restoredAnswers); setIndex(restoredIndex); setError(''); setScreen(restoredScreen);
    window.localStorage.setItem('wayfarer-last-identity', JSON.stringify({ name: match.name, role: match.role }));
  }

  function updateAnswer(value: string) {
    if (question) setAnswers((current) => ({ ...current, [question.id]: value }));
  }
  function next() {
    if (!player || !question || !currentAnswer.trim()) return;
    if (index === player.questions.length - 1) setScreen('complete'); else setIndex((current) => current + 1);
  }
  async function copyAnswers() {
    try { await copyWithFallback(summary, summaryRef.current); setCopyStatus('ANSWERS COPIED — READY TO PASTE INTO A TEXT MESSAGE.'); }
    catch { summaryRef.current?.focus(); summaryRef.current?.select(); setCopyStatus('DIRECT COPY WAS BLOCKED. THE TEXT BELOW IS SELECTED FOR MANUAL COPYING.'); }
  }
  function clearAnswers() {
    if (!player) return;
    window.localStorage.removeItem(storageKey(player.key)); setAnswers({}); setIndex(0); setCopyStatus(''); setConfirmClear(false); setScreen('matched');
  }

  function openPlayerRecord() { if (campaignPlayer) setScreen('player'); }

  const status = screen === 'verify' ? 'IDENTITY CONFIRMATION REQUIRED' : screen === 'secret-selection' ? 'PRIVATE RECORD OPEN' : screen === 'matched' ? 'IDENTITY MATCH FOUND' : screen === 'calibration' ? `CALIBRATION: ${progress}%` : screen === 'player' ? 'PLAYER RECORD SYNCHRONIZED' : 'CALIBRATION COMPLETE';
  if (screen === 'secret-selection' && secretIdentity) {
    return <main className="deity-conversation-shell"><SecretSelection identity={secretIdentity} onReturn={() => setScreen('verify')} /></main>;
  }
  return <main className="campaign-shell">
    <div className="scanlines" />
    <header className="trail-header"><span>◈ WAYFARER</span><span>CONTINUITY INDEX // v2.0</span></header>
    <div className="dungeon-frame calibration-frame">
      <div className="stone-band stone-band-top" /><div className="stone-band stone-band-bottom" />
      <div className="stone-pillar stone-pillar-left"><div className="wall-torch"><i className="torch-flame" /><i className="torch-bracket" /></div><div className="corner-plate"><i /><i /><i /><i /></div></div>
      <div className="stone-pillar stone-pillar-right"><div className="wall-torch"><i className="torch-flame" /><i className="torch-bracket" /></div><div className="corner-plate"><i /><i /><i /><i /></div></div>
      <section className="game-window calibration-window">
        {screen === 'verify' && <form className="roles-found panel-fade" onSubmit={verify}>
          <RoleStatusBar status={roleStatus} />
          <p className="eyebrow">THE INDEX // SELECTION ARCHIVE</p><h1>ROLES FOUND!</h1>
          <div className="index-decree"><p>The selection period has ended.</p><p>Further assessment is unnecessary.</p><p>Identity confirmation is required.</p></div>
          <label className="index-field"><span>FIRST NAME</span><input value={name} onChange={(event) => { setName(event.target.value.slice(0, 40)); setError(''); }} autoComplete="given-name" /></label>
          {knownIdentity && !secretIdentity && <><label className="index-field"><span>RETURNED ROLE</span><select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="">Select your role</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="affirm-row"><input type="checkbox" checked={affirmed} onChange={(event) => setAffirmed(event.target.checked)} /><span>I affirm that this is the role returned to me.</span></label></>}
          {error === 'missing' && <div className="identity-error"><strong>IDENTITY CONFIRMATION INCOMPLETE</strong><span>Enter your name, select a role, and affirm the record.</span></div>}
          {error === 'unknown' && <div className="identity-error"><strong>RECORD NOT FOUND</strong><span>No matching identity record was located.</span></div>}
          {error === 'conflict' && <div className="identity-error"><strong>RECORD CONFLICT</strong><span>The name exists.<br />The submitted role does not match.</span></div>}
          {error === 'storage' && <div className="identity-error"><strong>RECORD TEMPORARILY UNAVAILABLE</strong><span>Refresh the page and try the identity check again.</span></div>}
          <button className="primary-button" type="submit" disabled={!name.trim() || Boolean(knownIdentity && !secretIdentity && !affirmed)}>{secretIdentity ? 'CONTINUE' : knownIdentity ? 'AGREE' : 'LOCATE RECORD'} <span>›</span></button>
        </form>}

        {screen === 'matched' && player && <section className="identity-match panel-fade">
          <p className="eyebrow">IDENTITY MATCH FOUND</p><h2>Welcome back, {player.name}.</h2>
          <dl className="identity-record"><div><dt>Role</dt><dd>{player.role}</dd></div><div><dt>Path</dt><dd>{player.path}</dd></div><div><dt>Class</dt><dd>{player.characterClass}</dd></div><div><dt>Species</dt><dd>{player.species}</dd></div>{player.manifestation && <div><dt>Manifestation</dt><dd>{player.manifestation}</dd></div>}</dl>
          <div className="index-decree"><p>Your role has been located.</p><p>Your interpretation remains incomplete.</p></div>
          <button className="primary-button" type="button" onClick={() => { setIndex(0); setScreen('calibration'); }}>BEGIN CONTINUITY CALIBRATION <span>›</span></button>
        </section>}

        {screen === 'calibration' && player && question && <section className="calibration-panel panel-fade" key={question.id}>
          <div className="question-meta"><p className="eyebrow">CONTINUITY {index + 1} OF {player.questions.length}</p><p>{player.role.toUpperCase()}</p></div>
          <div className="progress-track" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div><h2>{question.prompt}</h2>
          <QuestionField question={question} value={currentAnswer} onChange={updateAnswer} />
          <div className="calibration-nav"><button type="button" className="back-button" onClick={() => index === 0 ? setScreen('matched') : setIndex((current) => current - 1)}>‹ BACK</button><button type="button" className="next-button" onClick={next} disabled={!currentAnswer.trim()}>{index === player.questions.length - 1 ? 'COMPLETE' : 'CONTINUE'} ›</button></div>
          <button type="button" className="clear-link" onClick={() => setConfirmClear(true)}>Clear My Answers</button>
        </section>}

        {screen === 'complete' && player && <section className="complete-panel panel-fade">
          <p className="eyebrow">CALIBRATION COMPLETE</p><h2>Your interpretation has been recorded.</h2>
          <div className="index-decree"><p>These answers will not determine your decisions.</p><p>They will help the Index determine which decisions will matter.</p></div>
          <button type="button" className="copy-answers" onClick={copyAnswers}>COPY ANSWERS <span>⧉</span></button>{copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
          <label className="summary-box"><span>PLAIN-TEXT CALIBRATION RECORD</span><textarea ref={summaryRef} value={summary} readOnly rows={15} onFocus={(event) => event.currentTarget.select()} /></label>
          <button type="button" className="record-link" onClick={openPlayerRecord}>CONTINUE TO PERSONAL RECORD ›</button>
          <button type="button" className="clear-link" onClick={() => setConfirmClear(true)}>Clear My Answers</button>
        </section>}

        {screen === 'player' && campaignPlayer && <PlayerPage initialPlayer={campaignPlayer} initialStatus={roleStatus} />}

        {confirmClear && <div className="clear-confirm" role="alertdialog" aria-modal="true" aria-labelledby="clear-title"><strong id="clear-title">CLEAR THIS DEVICE’S CALIBRATION?</strong><p>This removes every saved answer for {player?.name}. It cannot be undone.</p><div><button type="button" onClick={() => setConfirmClear(false)}>KEEP ANSWERS</button><button type="button" onClick={clearAnswers}>CLEAR ANSWERS</button></div></div>}
      </section>
    </div>
    <footer className="status-bar"><span>ROLES LOCATED: 4 / 5</span><span>ASSESSMENT: CLOSED</span><span className="status-note">{status}</span></footer>
  </main>;
}
