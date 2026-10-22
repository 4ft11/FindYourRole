import { randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isGuideAuthorized, readAdventure, updateAdventure } from '@/lib/adventure-store';
import { AdventureMessage, AdventureMessageKind, AdventureRollRequest, AdventureSession, AdventureSessionMode, normalizeIdentity } from '@/lib/adventure-types';
import { isGuideSession, isSameOrigin } from '@/lib/folio-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ActionBody = {
  action?: 'setup' | 'send' | 'typing' | 'request-roll' | 'cancel-roll' | 'roll' | 'confirm-roll' | 'clear' | 'clear-notice';
  dmKey?: string;
  roomCode?: string;
  player?: string;
  title?: string;
  scene?: string;
  mode?: AdventureSessionMode;
  active?: boolean;
  diceEnabled?: boolean;
  players?: string[];
  recipient?: string;
  channel?: 'guide' | 'party';
  kind?: AdventureMessageKind;
  text?: string;
  imageData?: string;
  imageName?: string;
  sides?: number;
  modifier?: number;
  requestId?: string;
  label?: string;
  prompt?: string;
  uiType?: 'system' | 'quest' | 'guidance' | 'memory' | 'warning' | 'error';
  uiTitle?: string;
  result?: number;
};

function sameSecret(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validRoom(session: AdventureSession, roomCode: string | undefined) {
  const entered = normalizeIdentity(roomCode || '');
  const actual = normalizeIdentity(session.roomCode);
  return Boolean(entered && actual && sameSecret(entered, actual));
}

function findPlayer(session: AdventureSession, name: string | undefined) {
  const identity = normalizeIdentity(name || '');
  return session.players.find((player) => normalizeIdentity(player) === identity);
}

function visibleForPlayer(message: AdventureMessage, player: string) {
  const identity = normalizeIdentity(player);
  if (message.recipient === 'all' || message.recipient === 'display' || message.recipient === 'players') return true;
  if (normalizeIdentity(message.recipient) === identity) return true;
  return message.sender === 'player' && normalizeIdentity(message.senderName) === identity;
}

function cleanText(value: string | undefined, limit = 16000) {
  return (typeof value === 'string' ? value : '').trim().slice(0, limit);
}

function cleanImage(value: string | undefined) {
  if (!value) return undefined;
  if (!/^data:image\/(png|jpeg|webp|gif);base64,/i.test(value)) return undefined;
  if (value.length > 2_100_000) return undefined;
  return value;
}

export async function GET(request: NextRequest) {
  const session = await readAdventure();
  const isGuide = request.nextUrl.searchParams.get('view') === 'guide';
  if (isGuide) {
    if (!isGuideSession(request) && !isGuideAuthorized(request.headers.get('x-wayfarer-dm-key'))) return NextResponse.json({ error: 'GUIDE AUTHORIZATION FAILED' }, { status: 401 });
    return NextResponse.json({ session: { ...session, typing: session.typing.filter((item) => item.expiresAt > Date.now()) } });
  }

  const isDisplay = request.nextUrl.searchParams.get('view') === 'display';
  if (isDisplay) {
    const roomCode = request.nextUrl.searchParams.get('room') || '';
    if (!session.active || !validRoom(session, roomCode)) return NextResponse.json({ error: 'DISPLAY NOT RECOGNIZED' }, { status: 404 });
    return NextResponse.json({
      session: {
        ...session,
        roomCode: '',
        players: [],
        messages: session.messages.filter((message) => message.recipient === 'all' || message.recipient === 'display'),
        reveals: session.reveals?.filter((message) => message.recipient === 'all' || message.recipient === 'display'),
        rollRequests: [],
        typing: session.typing.filter((item) => item.expiresAt > Date.now() && item.role === 'guide'),
      },
    });
  }

  const roomCode = request.nextUrl.searchParams.get('room') || '';
  const requestedName = request.nextUrl.searchParams.get('player') || '';
  const player = findPlayer(session, requestedName);
  if (!session.active || !validRoom(session, roomCode) || !player) return NextResponse.json({ error: 'CONNECTION NOT RECOGNIZED' }, { status: 404 });
  return NextResponse.json({ session: { ...session, roomCode: '', players: [], messages: session.messages.filter((message) => visibleForPlayer(message, player)), reveals: session.reveals?.filter((message) => visibleForPlayer(message, player)), rollRequests: session.rollRequests.filter((request) => normalizeIdentity(request.player) === normalizeIdentity(player)), typing: session.typing.filter((item) => item.expiresAt > Date.now() && item.role === 'guide') }, player });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({}, { status: 403 });
  const body = await request.json().catch(() => ({})) as ActionBody;
  if (!body.action) return NextResponse.json({ error: 'ACTION REQUIRED' }, { status: 400 });

  if (body.action === 'setup' || body.action === 'clear') {
    if (!isGuideSession(request) && !isGuideAuthorized(body.dmKey)) return NextResponse.json({ error: 'GUIDE AUTHORIZATION FAILED' }, { status: 401 });
    const session = await updateAdventure((current) => {
      if (body.action === 'clear') return { ...current, messages: [], reveals: [], rollRequests: [], typing: [] };
      const players = (body.players || []).map((item) => item.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 12);
      const mode: AdventureSessionMode = ['in-person', 'online', 'hybrid'].includes(body.mode || '') ? body.mode! : current.mode;
      return { ...current, mode, title: cleanText(body.title, 120) || 'Unwritten One-Shot', scene: cleanText(body.scene, 400) || 'The connection is waiting.', roomCode: cleanText(body.roomCode, 40), active: Boolean(body.active), diceEnabled: body.diceEnabled !== false, players };
    });
    return NextResponse.json({ session });
  }

  const current = await readAdventure();
  const guide = isGuideSession(request) || isGuideAuthorized(body.dmKey);
  const player = guide ? undefined : findPlayer(current, body.player);
  if (!guide && (!current.active || !validRoom(current, body.roomCode) || !player)) return NextResponse.json({ error: 'CONNECTION NOT RECOGNIZED' }, { status: 401 });

  if (body.action === 'typing') {
    const name = guide ? 'The Guide' : player!;
    const role = guide ? 'guide' as const : 'player' as const;
    const session = await updateAdventure((state) => ({ ...state, typing: [...state.typing.filter((item) => item.expiresAt > Date.now() && !(item.role === role && normalizeIdentity(item.name) === normalizeIdentity(name))), { name, role, expiresAt: Date.now() + 5500 }] }));
    return NextResponse.json({ ok: true, updatedAt: session.updatedAt });
  }

  if (body.action === 'request-roll') {
    if (!guide || !current.diceEnabled) return NextResponse.json({ error: 'ROLL REQUESTS ARE NOT AVAILABLE' }, { status: 403 });
    const requestedPlayer = findPlayer(current, body.recipient);
    if (!requestedPlayer) return NextResponse.json({ error: 'PLAYER NOT RECOGNIZED' }, { status: 404 });
    const allowed = [4, 6, 8, 10, 12, 20, 100];
    const sides = allowed.includes(Number(body.sides)) ? Number(body.sides) : 20;
    const modifier = Math.max(-20, Math.min(20, Number(body.modifier) || 0));
    const request: AdventureRollRequest = { id: randomUUID(), player: requestedPlayer, label: cleanText(body.label, 80) || 'ABILITY CHECK', prompt: cleanText(body.prompt, 300), sides, modifier, createdAt: new Date().toISOString() };
    const notice: AdventureMessage = { id: randomUUID(), sender: 'system', senderName: 'The Guide', recipient: requestedPlayer, kind: 'system', text: `${request.label} requested${request.prompt ? `: ${request.prompt}` : '.'}`, createdAt: request.createdAt };
    const session = await updateAdventure((state) => ({ ...state, rollRequests: [...state.rollRequests.filter((item) => normalizeIdentity(item.player) !== normalizeIdentity(requestedPlayer)), request], messages: [...state.messages, notice].slice(-300) }));
    return NextResponse.json({ request, updatedAt: session.updatedAt });
  }

  if (body.action === 'cancel-roll') {
    if (!guide) return NextResponse.json({ error: 'GUIDE AUTHORIZATION FAILED' }, { status: 401 });
    const session = await updateAdventure((state) => ({ ...state, rollRequests: state.rollRequests.filter((item) => item.id !== body.requestId) }));
    return NextResponse.json({ ok: true, updatedAt: session.updatedAt });
  }
  if (body.action === 'clear-notice') {
    if (!guide) return NextResponse.json({}, { status: 403 });
    const destination = body.recipient;
    if (!destination) return NextResponse.json({}, { status: 400 });
    const session = await updateAdventure((state) => ({
      ...state,
      reveals: (state.reveals ?? state.messages.filter((message) => message.sender === 'guide')).filter((message) => {
        const matches = destination === 'all' ? ['all', 'display'].includes(message.recipient) : normalizeIdentity(message.recipient) === normalizeIdentity(destination);
        return !matches || Boolean(message.imageData) || (!message.ui && !['system', 'warning'].includes(message.kind));
      }),
    }));
    return NextResponse.json({ ok: true, updatedAt: session.updatedAt });
  }

  if (body.action === 'confirm-roll') {
    if (!guide) return NextResponse.json({}, { status: 403 });
    let accepted = false;
    const session = await updateAdventure((state) => {
      const roll = state.rollRequests.find((item) => item.id === body.requestId);
      if (!roll || !Number.isInteger(body.result) || body.result! < 1 || body.result! > roll.sides) return state;
      accepted = true;
      const message: AdventureMessage = { id: randomUUID(), sender: 'player', senderName: roll.player, recipient: 'guide', kind: 'roll', text: `${roll.label}: physical die confirmed by the Guide.`, roll: { sides: roll.sides, result: body.result!, modifier: roll.modifier, total: body.result! + roll.modifier }, createdAt: new Date().toISOString() };
      return { ...state, rollRequests: state.rollRequests.filter((item) => item.id !== roll.id), messages: [...state.messages, message].slice(-300) };
    });
    return NextResponse.json({ ok: accepted, updatedAt: session.updatedAt }, { status: accepted ? 200 : 400 });
  }

  if (body.action === 'roll') {
    if (!current.diceEnabled || guide) return NextResponse.json({ error: 'ROLLING IS NOT AVAILABLE' }, { status: 403 });
    const request = current.rollRequests.find((item) => item.id === body.requestId && normalizeIdentity(item.player) === normalizeIdentity(player!));
    if (!request) return NextResponse.json({ error: 'NO ROLL HAS BEEN REQUESTED' }, { status: 403 });
    const sides = request.sides;
    const modifier = request.modifier;
    const result = randomInt(1, sides + 1);
    const rollMessage: AdventureMessage = { id: randomUUID(), sender: 'player', senderName: player!, recipient: 'guide', kind: 'roll', text: `${request.label}: ${player} rolled 1d${sides}${modifier ? modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}` : ''}.`, roll: { sides, result, modifier, total: result + modifier }, createdAt: new Date().toISOString() };
    let accepted = false;
    const session = await updateAdventure((state) => {
      if (!state.diceEnabled || !state.active || !state.rollRequests.some((item) => item.id === request.id)) return state;
      accepted = true;
      return { ...state, rollRequests: state.rollRequests.filter((item) => item.id !== request.id), messages: [...state.messages, rollMessage].slice(-300) };
    });
    if (!accepted) return NextResponse.json({ error: 'THIS ROLL HAS ALREADY BEEN RECORDED' }, { status: 409 });
    return NextResponse.json({ message: rollMessage, updatedAt: session.updatedAt });
  }

  if (body.action === 'send') {
    if (typeof body.text === 'string' && body.text.length > 16000) return NextResponse.json({ error: 'Please keep each message under 16,000 characters.' }, { status: 400 });
    const text = cleanText(body.text);
    const imageData = cleanImage(body.imageData);
    if (!text && !imageData) return NextResponse.json({ error: 'MESSAGE IS EMPTY' }, { status: 400 });
    const playerWhisper = !guide && body.kind === 'whisper';
    const guideWhisper = guide && body.kind === 'whisper';
    const validGuideRecipient = current.players.some((item) => normalizeIdentity(item) === normalizeIdentity(body.recipient || ''));
    if (guideWhisper && !validGuideRecipient) return NextResponse.json({ error: 'A WHISPER NEEDS ONE PLAYER' }, { status: 400 });
    const validGuideDestination = body.recipient === 'all' || body.recipient === 'display' || body.recipient === 'players' || body.recipient === 'guide' || validGuideRecipient;
    if (guide && !validGuideDestination) return NextResponse.json({ error: 'Choose who should receive this reveal.' }, { status: 400 });
    const recipient = guide ? (validGuideDestination ? body.recipient! : 'players') : body.channel === 'guide' || playerWhisper ? 'guide' : 'players';
    const allowedUiTypes = ['system', 'quest', 'guidance', 'memory', 'warning', 'error'] as const;
    const uiType = guide && body.kind === 'system' && allowedUiTypes.includes(body.uiType as typeof allowedUiTypes[number]) ? body.uiType as typeof allowedUiTypes[number] : undefined;
    const message: AdventureMessage = { id: randomUUID(), sender: guide ? 'guide' : 'player', senderName: guide ? 'The Guide' : player!, recipient, kind: guide ? body.kind || 'narration' : playerWhisper ? 'whisper' : 'dialogue', text, imageData, imageName: imageData ? cleanText(body.imageName, 100) || 'Shared image' : undefined, ui: uiType ? { type: uiType, title: cleanText(body.uiTitle, 80) || `${uiType.toUpperCase()} NOTICE` } : undefined, createdAt: new Date().toISOString() };
    const session = await updateAdventure((state) => {
      const isReveal = guide && message.kind !== 'whisper' && (imageData || uiType || message.kind === 'system' || message.kind === 'warning');
      const kind = imageData ? 'image' : 'notice';
      const reveals = isReveal ? [...(state.reveals || []).filter((item) => !(normalizeIdentity(item.recipient) === normalizeIdentity(recipient) && (item.imageData ? 'image' : 'notice') === kind)), message] : state.reveals;
      return { ...state, reveals, messages: [...state.messages, message].slice(-300), typing: state.typing.filter((item) => normalizeIdentity(item.name) !== normalizeIdentity(message.senderName)) };
    });
    return NextResponse.json({ message, updatedAt: session.updatedAt });
  }

  return NextResponse.json({ error: 'UNKNOWN ACTION' }, { status: 400 });
}
