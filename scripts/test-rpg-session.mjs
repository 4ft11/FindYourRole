import assert from 'node:assert/strict';

// Run ONLY against an isolated local server with WAYFARER_DATA_DIR set to a test directory.
const base = process.env.RPG_TEST_URL || 'http://127.0.0.1:3001';
if (!/^http:\/\/127\.0\.0\.1:3001$/.test(base)) throw new Error('This test is restricted to the isolated preview on port 3001.');
const dmKey = process.env.RPG_TEST_KEY || 'wayfarer-local';
let guideCookie = '';
async function post(path, body, cookie = '') {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] || '' };
}
async function get(path, cookie = '') {
  const response = await fetch(base + path, { headers: cookie ? { Cookie: cookie } : {} });
  return { status: response.status, data: await response.json() };
}
assert.equal((await get('/api/adventure?view=guide')).status, 401);
assert.equal((await post('/api/guide', { key: 'wrong' })).status, 401);
const login = await post('/api/guide', { key: dmKey });
assert.equal(login.status, 200);
guideCookie = login.cookie;
assert.ok(guideCookie);
const existing = await get('/api/adventure?view=guide', guideCookie);
assert.equal(existing.status, 200);
assert.ok(!existing.data.session.messages.length || existing.data.session.title === 'Review chapter', 'Refusing to overwrite non-test session data.');
const setup = await post('/api/adventure', { action: 'setup', title: 'Review chapter', scene: 'At the edge of a quiet woodland.', mode: 'hybrid', roomCode: 'REVIEW-ONLY', active: true, players: ['Ariel', 'Noah'], diceEnabled: true }, guideCookie);
assert.equal(setup.status, 200);
assert.equal((await post('/api/adventure', { action: 'setup', active: false })).status, 401);
assert.equal((await post('/api/player/verify', { name: ' ariel ', role: 'THE SWORN' })).status, 200);
assert.equal((await post('/api/player/verify', { name: 'ariel', role: 'The Seer' })).status, 409);
const reader = await post('/api/player/verify', { name: 'Ariel', role: 'The Sworn' });
const chronicle = await get('/api/player/me', reader.cookie);
assert.equal(chronicle.status, 200);
assert.equal(chronicle.data.invitation.roomCode, 'REVIEW-ONLY');
const chris = await post('/api/player/verify', { name: 'Chris', role: 'The Seer' });
assert.equal((await get('/api/player/me', chris.cookie)).data.invitation, null);
const marker = Date.now().toString();
for (const [recipient, text] of [['all', `Shared ${marker}`], ['Ariel', `Ariel secret ${marker}`], ['guide', `Guide secret ${marker}`], ['players', `Books only ${marker}`]]) {
  assert.equal((await post('/api/adventure', { action: 'send', recipient, text, kind: 'system', uiType: 'guidance', uiTitle: recipient }, guideCookie)).status, 200);
}
assert.equal((await post('/api/adventure', { action: 'send', recipient: 'Unknown', text: 'Do not broadcast', kind: 'system' }, guideCookie)).status, 400);
assert.equal((await post('/api/adventure', { action: 'send', roomCode: 'REVIEW-ONLY', player: 'Ariel', kind: 'whisper', text: `OOC secret ${marker}`, channel: 'party' })).status, 200);
const display = await get('/api/adventure?view=display&room=REVIEW-ONLY');
assert.equal(display.status, 200);
const displayJSON = JSON.stringify(display.data);
assert.ok(displayJSON.includes(`Shared ${marker}`));
for (const privateText of [`Ariel secret ${marker}`, `Guide secret ${marker}`, `Books only ${marker}`, `OOC secret ${marker}`]) assert.ok(!displayJSON.includes(privateText));
assert.deepEqual(display.data.session.players, []);
const noah = await get('/api/adventure?room=REVIEW-ONLY&player=Noah');
assert.ok(!JSON.stringify(noah.data).includes(`Ariel secret ${marker}`));
assert.ok(!JSON.stringify(noah.data).includes(`OOC secret ${marker}`));
const ariel = await get('/api/adventure?room=REVIEW-ONLY&player=Ariel');
assert.ok(JSON.stringify(ariel.data).includes(`Ariel secret ${marker}`));
assert.ok(!JSON.stringify(ariel.data).includes(`Guide secret ${marker}`));
const longText = 'A long paragraph. '.repeat(400);
assert.equal((await post('/api/adventure', { action: 'send', roomCode: 'REVIEW-ONLY', player: 'Ariel', channel: 'guide', text: longText })).data.message.text, longText.trim());
const roll = await post('/api/adventure', { action: 'request-roll', recipient: 'Ariel', label: 'Wisdom check', sides: 20, modifier: 2 }, guideCookie);
assert.equal(roll.status, 200);
const competing = await Promise.all([1, 2].map(() => post('/api/adventure', { action: 'roll', roomCode: 'REVIEW-ONLY', player: 'Ariel', requestId: roll.data.request.id })));
assert.equal(competing.filter((item) => item.status === 200).length, 1, 'A requested die must be recorded once only.');
const physical = await post('/api/adventure', { action: 'request-roll', recipient: 'Noah', sides: 20, modifier: 3 }, guideCookie);
assert.equal((await post('/api/adventure', { action: 'confirm-roll', requestId: physical.data.request.id, result: 21 }, guideCookie)).status, 400);
assert.equal((await post('/api/adventure', { action: 'confirm-roll', requestId: physical.data.request.id, result: 12 }, guideCookie)).status, 200);
// Finish with a clean public test scene, keeping a pending die available for UI review.
await post('/api/adventure', { action: 'clear' }, guideCookie);
await post('/api/adventure', { action: 'send', recipient: 'all', kind: 'narration', text: 'The path opens into a quiet clearing. A single lantern hangs from a branch, though there is no house nearby.\n\nWhat do you do?' }, guideCookie);
await post('/api/adventure', { action: 'send', recipient: 'Ariel', kind: 'system', uiType: 'guidance', uiTitle: 'A small discovery', text: 'Someone has tied a green ribbon to the branch. It is still dry, despite the rain.' }, guideCookie);
await post('/api/adventure', { action: 'request-roll', recipient: 'Ariel', label: 'Wisdom · Perception', prompt: 'Listen closely to the clearing.', sides: 20, modifier: 2 }, guideCookie);
console.log('PASS: Guide auth, player recognition, eligible invitations, audience filtering, private whispers, long messages, single-use dice, and physical dice.');
