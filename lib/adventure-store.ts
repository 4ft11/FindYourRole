import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { AdventureSession, blankAdventureSession } from '@/lib/adventure-types';

const dataDirectory = process.env.WAYFARER_DATA_DIR?.trim() || path.join(process.cwd(), 'data');
const sessionFile = path.join(dataDirectory, 'live-adventure.json');
const temporaryFile = path.join(dataDirectory, 'live-adventure.tmp.json');
let pendingMutation: Promise<unknown> = Promise.resolve();

export async function readAdventure(): Promise<AdventureSession> {
  try {
    const parsed = JSON.parse(await readFile(sessionFile, 'utf8')) as AdventureSession;
    return { ...blankAdventureSession, ...parsed, version: 2, players: parsed.players || [], messages: parsed.messages || [], rollRequests: parsed.rollRequests || [], typing: parsed.typing || [] };
  } catch {
    return { ...blankAdventureSession };
  }
}

async function writeAdventure(session: AdventureSession) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(temporaryFile, JSON.stringify(session, null, 2), 'utf8');
  await rename(temporaryFile, sessionFile);
}

export function updateAdventure(change: (current: AdventureSession) => AdventureSession | Promise<AdventureSession>) {
  const mutation = pendingMutation.then(async () => {
    const current = await readAdventure();
    const next = await change(current);
    next.updatedAt = new Date().toISOString();
    await writeAdventure(next);
    return next;
  });
  pendingMutation = mutation.catch(() => undefined);
  return mutation;
}

export function isGuideAuthorized(secret: string | null | undefined) {
  const configured = process.env.WAYFARER_DM_KEY?.trim();
  if (configured) {
    const a = Buffer.from(typeof secret === 'string' ? secret : '');
    const b = Buffer.from(configured);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  return process.env.NODE_ENV !== 'production' && secret === 'wayfarer-local';
}
