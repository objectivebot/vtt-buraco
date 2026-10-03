import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Exercise the real VirtualTabletop Room.addState method, not just its ZIP reader.
// Run this script with the working directory set to the cloned upstream-vtt.
const save = fs.mkdtempSync(path.join(os.tmpdir(), 'vtt-buraco-room-'));
process.env.VTT_SAVE_DIR = save;
for (const dir of ['states', 'errors', 'rooms', 'assets']) {
  fs.mkdirSync(path.join(save, dir), { recursive: true });
}
const { default: Room } = await import('../upstream-vtt/server/room.mjs');

const room = new Room('buraco-ci', () => {}, () => {});
clearTimeout(room.unloadTimeout);
const messages = [];
room.state = {
  _meta: { version: 24, players: {}, states: {}, starred: {} }
};
room.players = [{
  name: 'Tester',
  sessionID: 'ci-session',
  send(type, args) { messages.push({ type, args }); }
}];
const binary = fs.readFileSync('../dist/buraco.vtt');
await room.addState('buraco001', 'file', binary, 'buraco.vtt');
const saved = room.state._meta.states.buraco001;
assert(saved, 'Upload must leave Buraco in the room game shelf');
assert.equal(saved.name, 'Buraco (manual table)');
assert.equal(saved.variants.length, 1);
assert.equal(saved.variants[0].players, '2,4');
assert(fs.existsSync(room.variantFilename('buraco001', 0)));
const meta = messages.find(m=>m.type==='meta');
assert(meta, 'Upload must broadcast an updated game shelf');
assert(meta.args.meta.states.buraco001, 'Game must be in broadcast shelf metadata');
console.log('Room.addState accepted Buraco and broadcast a persistent shelf entry');
