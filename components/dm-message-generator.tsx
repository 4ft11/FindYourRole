'use client';

import { useMemo, useRef, useState } from 'react';

const messageTypes = ['SYSTEM', 'QUEST', 'GUIDANCE', 'MEMORY', 'WARNING', 'ERROR'] as const;
type MessageType = (typeof messageTypes)[number];
type Tone = 'quiet' | 'wrong' | 'urgent' | 'withheld';

const toneLines: Record<Tone, string[]> = {
  quiet: ['This notice was waiting before you arrived.', 'The record opened without being requested.', 'No response is required. A response has already been recorded.'],
  wrong: ['The record recognizes a version of you that has not arrived.', 'This message is addressed correctly. The name is not.', 'The event below has already occurred. Its date has not.'],
  urgent: ['Do not allow the others to see this window.', 'Recognition is failing. Continue as though nothing has changed.', 'The next instruction will not remain visible.'],
  withheld: ['A portion of this record has been removed by divine restriction.', 'You are not authorized to remember the missing sentence.', 'The Index has declined to identify who requested this notice.'],
};

const endings: Record<MessageType, string[]> = {
  SYSTEM: ['CONTINUITY CHECK INCOMPLETE', 'RECOGNITION PENDING', 'RETURN SEQUENCE INTERRUPTED'],
  QUEST: ['OBJECTIVE UPDATED WITHOUT CONSENT', 'QUEST ACCEPTANCE RECORDED', 'REWARD INFORMATION WITHHELD'],
  GUIDANCE: ['SOURCE AUTHORITY UNVERIFIED', 'GUIDANCE RECEIVED BEFORE TRANSMISSION', 'DO NOT ANSWER THE SECOND VOICE'],
  MEMORY: ['MEMORY OWNERSHIP DISPUTED', 'RECOVERY DATE PRECEDES ARRIVAL', 'ORIGINAL CONTEXT REMOVED'],
  WARNING: ['PARTY INTEGRITY UNCONFIRMED', 'FIFTH CONNECTION DETECTED', 'DO NOT NAME WHAT IS MISSING'],
  ERROR: ['USER COUNT MISMATCH', 'ROLE LABEL TEMPORARILY ALTERED', 'THIS ERROR HAS BEEN ACKNOWLEDGED'],
};

function pick<T>(items: T[], seed: number) { return items[Math.abs(seed) % items.length]; }
function removeEmoji(value: string) { return value.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, ''); }

export default function DmMessageGenerator({ onPrepare }: { onPrepare?: (title: string, text: string) => void }) {
  const [recipient, setRecipient] = useState('ENTIRE PARTY');
  const [type, setType] = useState<MessageType>('SYSTEM');
  const [tone, setTone] = useState<Tone>('quiet');
  const [heading, setHeading] = useState('A RECORD OUT OF ORDER');
  const [detail, setDetail] = useState('The door remembers being opened. None of you remember opening it.');
  const [instruction, setInstruction] = useState('Continue normally. Do not compare timestamps.');
  const [sequence, setSequence] = useState(0);
  const [copyStatus, setCopyStatus] = useState('READY TO GENERATE');
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const output = useMemo(() => {
    const strangeLine = pick(toneLines[tone], sequence);
    const footer = pick(endings[type], sequence + 1);
    const lines = [
      '+------------------------------------------+',
      `| THE INDEX // ${type}`,
      `| RECIPIENT: ${recipient || 'UNKNOWN USER'}`,
      '+------------------------------------------+',
      '',
      (heading || 'UNTITLED NOTICE').toUpperCase(),
      '',
      strangeLine,
      detail.trim(),
      instruction.trim() ? `\nDIRECTIVE\n${instruction.trim()}` : '',
      '',
      `[ ${footer} ]`,
      '+------------------------------------------+',
    ];
    return removeEmoji(lines.join('\n').replace(/\n{3,}/g, '\n\n'));
  }, [detail, heading, instruction, recipient, sequence, tone, type]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopyStatus('PLAIN TEXT COPIED FOR DISCORD OR TEXT');
    } catch {
      outputRef.current?.focus(); outputRef.current?.select();
      const copied = document.execCommand('copy');
      setCopyStatus(copied ? 'PLAIN TEXT COPIED FOR DISCORD OR TEXT' : 'COPY BLOCKED. OUTPUT SELECTED FOR MANUAL COPY');
    }
  }

  return <section className="dm-message-generator">
    <div className="dm-section-heading"><div><p>THE INDEX // OUTBOUND COMPOSITION</p><h2>MESSAGE GENERATOR</h2></div><span>{copyStatus}</span></div>
    <div className="message-generator-grid">
      <section className="dm-message-controls">
        <p className="dm-notice">Creates plain-text game interface messages only. Nothing is sent automatically, and generated messages contain no emoji.</p>
        <div className="dm-grid">
          <label className="dm-field"><span>RECIPIENT</span><input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="ENTIRE PARTY or a player name" /></label>
          <label className="dm-field"><span>MESSAGE TYPE</span><select value={type} onChange={(event) => setType(event.target.value as MessageType)}>{messageTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="dm-field"><span>CREEPINESS STYLE</span><select value={tone} onChange={(event) => setTone(event.target.value as Tone)}><option value="quiet">Quietly impossible</option><option value="wrong">Something is wrong</option><option value="urgent">Urgent and private</option><option value="withheld">Redacted or withheld</option></select></label>
        </div>
        <label className="dm-field"><span>HEADING</span><input value={heading} onChange={(event) => setHeading(event.target.value)} /></label>
        <label className="dm-field"><span>CAMPAIGN DETAIL OR STRANGE REVELATION</span><textarea rows={5} value={detail} onChange={(event) => setDetail(event.target.value)} /></label>
        <label className="dm-field"><span>DIRECTIVE · OPTIONAL</span><textarea rows={3} value={instruction} onChange={(event) => setInstruction(event.target.value)} /></label>
        <div className="dm-actions primary-actions"><button onClick={() => { setSequence((current) => current + 1); setCopyStatus('NEW VARIATION GENERATED'); }}>GENERATE ANOTHER VERSION</button><button onClick={copy}>COPY PLAIN TEXT</button>{onPrepare && <button onClick={() => onPrepare(heading, output)}>PREPARE FOR LIVE REVEAL</button>}</div>
      </section>
      <section className="message-output-panel"><div className="preview-label"><span>COPY-AND-PASTE PREVIEW</span><small>NO EMOJI // NOTHING SENT AUTOMATICALLY</small></div><textarea ref={outputRef} value={output} readOnly aria-label="Generated plain-text game interface message" /><button className="present-button" onClick={copy}>COPY MESSAGE</button></section>
    </div>
  </section>;
}
