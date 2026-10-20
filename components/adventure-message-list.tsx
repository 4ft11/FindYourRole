'use client';
/* eslint-disable @next/next/no-img-element -- player-provided data URLs are not compatible with the image optimizer */

import { useEffect, useRef } from 'react';
import type { AdventureMessage } from '@/lib/adventure-types';

export default function AdventureMessageList({ messages, playerName, guideView = false }: { messages: AdventureMessage[]; playerName?: string; guideView?: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length]);

  if (!messages.length) return <div className="adventure-empty"><span>◇</span><strong>THE THREAD IS QUIET</strong><p>Nothing has been written here yet.</p></div>;

  return <div className="adventure-transcript" aria-live="polite">
    {messages.map((message) => {
      const own = message.sender === 'player' && playerName?.toLowerCase() === message.senderName.toLowerCase();
      const privateMessage = message.recipient !== 'all';
      return <article className={`adventure-message from-${message.sender} kind-${message.kind}${own ? ' is-own' : ''}`} key={message.id}>
        <header><span>{message.sender === 'guide' ? 'THE GUIDE' : message.senderName.toUpperCase()}</span><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>{message.kind === 'whisper' ? <small>WHISPER · OUT OF GAME</small> : privateMessage && <small>{guideView ? `PRIVATE · ${message.recipient.toUpperCase()}` : 'PRIVATE THREAD'}</small>}</header>
        {message.ui ? <div className={`adventure-ui-message ui-${message.ui.type}`}><div><span>{message.ui.type.toUpperCase()}</span><strong>{message.ui.title}</strong></div><p>{message.text}</p></div> : message.text && <p>{message.text}</p>}
        {message.roll && <div className="adventure-roll-result"><span>D{message.roll.sides}</span><strong>{message.roll.total}</strong><small>natural {message.roll.result}{message.roll.modifier ? ` ${message.roll.modifier > 0 ? '+' : '−'} ${Math.abs(message.roll.modifier)}` : ''}</small></div>}
        {message.imageData && <figure><img src={message.imageData} alt={message.imageName || 'Image shared in the adventure'} /><figcaption>{message.imageName || 'VISUAL RECORD RECEIVED'}</figcaption></figure>}
      </article>;
    })}
    <div ref={endRef} />
  </div>;
}
