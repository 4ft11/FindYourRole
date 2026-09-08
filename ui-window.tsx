'use client';

export const recipients = ['Entire Party', 'Ariel', 'Noah', 'Michael', 'Chris', 'Unknown User'] as const;
export const windowTypes = ['System', 'Quest', 'Quest Updated', 'Guidance', 'Help', 'Memory Recovered', 'Warning', 'Error', 'Achievement'] as const;
export type WindowType = (typeof windowTypes)[number];
export type Recipient = (typeof recipients)[number];

export type UIWindowData = {
  recipient: Recipient;
  windowType: WindowType;
  sourceLabel: string;
  heading: string;
  message: string;
  objective: string;
  reward: string;
  consequence: string;
  footer: string;
  buttons: string[];
  glitched: boolean;
  privateMessage: boolean;
};

export const defaultWindowData: UIWindowData = {
  recipient: 'Entire Party', windowType: 'Quest Updated', sourceLabel: 'THE INDEX', heading: 'A Vow Without a Witness',
  message: 'The gate will open when the promise is fulfilled.\nThe gate does not remember to whom the promise was made.',
  objective: 'Determine what the oath originally protected.', reward: '', consequence: '', footer: 'CONTINUITY RECORD UPDATED', buttons: ['ACKNOWLEDGE'], glitched: false, privateMessage: false,
};

export function windowPlainText(data: UIWindowData) {
  return [
    data.sourceLabel.toUpperCase(), data.windowType.toUpperCase(), data.privateMessage ? `PRIVATE MESSAGE — ${data.recipient.toUpperCase()}` : `RECIPIENT — ${data.recipient.toUpperCase()}`, '',
    data.heading, '', data.message,
    data.objective && `\nOBJECTIVE\n${data.objective}`,
    data.reward && `\nREWARD\n${data.reward}`,
    data.consequence && `\nCONSEQUENCE\n${data.consequence}`,
    data.buttons.filter(Boolean).length ? `\n[ ${data.buttons.filter(Boolean).join(' ]  [ ')} ]` : '',
    data.footer && `\n${data.footer}`,
  ].filter(Boolean).join('\n').trim();
}

export default function UIWindow({ data, presentation = false }: { data: UIWindowData; presentation?: boolean }) {
  const tone = data.windowType.toLowerCase().replaceAll(' ', '-');
  return <article className={`ui-window tone-${tone} ${data.glitched ? 'is-glitched' : ''} ${presentation ? 'is-presentation' : ''}`}>
    <div className="ui-corners" aria-hidden="true"><i /><i /><i /><i /></div>
    <header className="ui-window-head"><span>{data.sourceLabel || 'THE INDEX'}</span><strong>{data.windowType}</strong></header>
    <p className="ui-recipient">{data.privateMessage ? 'PRIVATE MESSAGE' : 'RECIPIENT'}{' // '}{data.recipient}</p>
    <h1>{data.heading || 'UNTITLED WINDOW'}</h1>
    <div className="ui-message">{data.message || 'No message entered.'}</div>
    <div className="ui-sections">
      {data.objective && <section><span>OBJECTIVE</span><p>{data.objective}</p></section>}
      {data.reward && <section><span>REWARD</span><p>{data.reward}</p></section>}
      {data.consequence && <section className="consequence"><span>CONSEQUENCE</span><p>{data.consequence}</p></section>}
    </div>
    {data.buttons.some(Boolean) && <div className="ui-window-buttons">{data.buttons.filter(Boolean).slice(0, 3).map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>}
    {data.footer && <footer>{data.footer}</footer>}
  </article>;
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  text.split('\n').forEach((paragraph) => {
    const words = paragraph.split(/\s+/); let line = '';
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    });
    lines.push(line || ' ');
  });
  return lines;
}

export function downloadWindowPng(data: UIWindowData) {
  const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 900;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const accent = ['Warning', 'Error'].includes(data.windowType) ? '#7f3e38' : ['Guidance', 'Help'].includes(data.windowType) ? '#58708c' : ['Memory Recovered', 'Achievement'].includes(data.windowType) ? '#cbb77c' : '#9d7b42';
  ctx.fillStyle = '#080b10'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111820'; ctx.fillRect(50, 50, 1300, 800); ctx.strokeStyle = accent; ctx.lineWidth = 8; ctx.strokeRect(50, 50, 1300, 800); ctx.lineWidth = 2; ctx.strokeRect(68, 68, 1264, 764);
  ctx.globalAlpha = .12; ctx.fillStyle = '#ffffff'; for (let y = 75; y < 835; y += 8) ctx.fillRect(70, y, 1260, 1); ctx.globalAlpha = 1;
  ctx.fillStyle = '#d8cba8'; ctx.font = 'bold 25px monospace'; ctx.fillText((data.sourceLabel || 'THE INDEX').toUpperCase(), 100, 115);
  ctx.fillStyle = accent; ctx.textAlign = 'right'; ctx.fillText(data.windowType.toUpperCase(), 1300, 115); ctx.textAlign = 'left';
  ctx.fillStyle = '#8994a1'; ctx.font = '20px monospace'; ctx.fillText(`${data.privateMessage ? 'PRIVATE MESSAGE' : 'RECIPIENT'} // ${data.recipient.toUpperCase()}`, 100, 165);
  ctx.fillStyle = '#f0e7d0'; ctx.font = 'bold 48px Georgia'; let y = 240;
  if (data.glitched) { ctx.globalAlpha = .35; ctx.fillStyle = '#8c463e'; ctx.fillText(data.heading || 'UNTITLED WINDOW', 104, y + 2); ctx.globalAlpha = 1; ctx.fillStyle = '#f0e7d0'; }
  wrapCanvasText(ctx, data.heading || 'UNTITLED WINDOW', 1160).forEach((line) => { ctx.fillText(line, 100, y); y += 58; });
  ctx.fillStyle = '#e4ddca'; ctx.font = '27px Georgia'; y += 18;
  wrapCanvasText(ctx, data.message || 'No message entered.', 1160).forEach((line) => { ctx.fillText(line, 100, y); y += 40; });
  const sections = [['OBJECTIVE', data.objective], ['REWARD', data.reward], ['CONSEQUENCE', data.consequence]].filter((item) => item[1]);
  sections.forEach(([label, value]) => { y += 25; ctx.fillStyle = accent; ctx.font = 'bold 18px monospace'; ctx.fillText(label, 100, y); y += 35; ctx.fillStyle = '#e4ddca'; ctx.font = '23px Georgia'; wrapCanvasText(ctx, value, 1160).forEach((line) => { ctx.fillText(line, 100, y); y += 32; }); });
  const buttons = data.buttons.filter(Boolean).slice(0, 3); let buttonX = 100; const buttonY = Math.min(Math.max(y + 30, 700), 760);
  buttons.forEach((button) => { ctx.font = 'bold 18px monospace'; const width = Math.min(ctx.measureText(button).width + 50, 360); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.strokeRect(buttonX, buttonY, width, 48); ctx.fillStyle = '#eee5cc'; ctx.fillText(button.toUpperCase(), buttonX + 20, buttonY + 31); buttonX += width + 18; });
  if (data.footer) { ctx.fillStyle = '#7f8994'; ctx.font = '18px monospace'; ctx.fillText(data.footer.toUpperCase(), 100, 815); }
  const link = document.createElement('a'); link.download = `${(data.heading || 'index-window').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'index-window'}.png`; link.href = canvas.toDataURL('image/png'); link.click();
}
