import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const save = fs.mkdtempSync(path.join(os.tmpdir(), 'buraco-m0-server-'));
process.env.VTT_SAVE_DIR = save;
for(const folder of ['rooms','states','errors','assets'])
  fs.mkdirSync(path.join(save,folder), {recursive:true});
const { default: Room } = await import('../upstream-vtt/server/room.mjs');
const { default: FileLoader } = await import('../upstream-vtt/server/fileloader.mjs');
const binary = fs.readFileSync('../dist/m0-probe.vtt');
const variants = await FileLoader.readStatesFromBuffer(binary);
assert.equal(variants.VTT[0]._meta.info.name,'Buraco M0 — event and rollback probe');
const aliceMessages=[],bobMessages=[];
const alice={name:'Alice',sessionID:'a',send:(type,args)=>aliceMessages.push({type,args})};
const bob={name:'Bob',sessionID:'b',send:(type,args)=>bobMessages.push({type,args})};
const room=new Room('buraco-m0-ci',()=>{},()=>{});
clearTimeout(room.unloadTimeout);
room.state={_meta:{version:24,players:{},states:{},starred:{}}};
room.players=[alice,bob];
room.deltaID=0;
await room.addState('m0state','file',binary,'m0-probe.vtt');
assert(room.state._meta.states.m0state,'the upload must be visible in the shelf');
const saved=JSON.parse(fs.readFileSync(room.variantFilename('m0state',0)));
assert(saved.probeTarget.enterRoutine,'the reversion routine must survive import/storage');
room.setState(variants.VTT[0],alice,false);
assert.equal(room.state.probeCard.parent,'probeOrigin');
// A second client sends a forged/unguarded parent change. The VTT room
// deliberately does NOT execute the target holder's client-side enterRoutine.
room.receiveDelta(bob,{s:{probeCard:{parent:'probeTarget'}},deltaSendId:777});
assert.equal(room.state.probeCard.parent,'probeTarget',
  'VTT currently trusts an arbitrary incoming delta and cannot guarantee rule authority');
assert(bobMessages.some(m=>m.type==='deltaConfirm' && m.args.id===777));
assert(aliceMessages.some(m=>m.type==='delta' && m.args.s.probeCard.parent==='probeTarget'),
  'the invalid change must reach Alice as well; client-side callbacks cannot stop it');
room.writeToFilesystem();
const disk=JSON.parse(fs.readFileSync(room.roomFilename(),'utf8'));
assert.equal(disk.probeCard.parent,'probeTarget','a forged delta is even persisted by the server');
assert(disk._meta.states.m0state,'the uploaded game stays in the persisted shelf');
const restored=new Room('buraco-m0-ci',()=>{},()=>{});
clearTimeout(restored.unloadTimeout);
restored.players=[];
await restored.load();
clearTimeout(restored.unloadTimeout);
assert.equal(restored.state.probeCard.parent,'probeTarget','the persisted state reloads');
assert(restored.state._meta.states.m0state,'the saved Game Shelf reloads');
console.log('M0 result: import, two simulated clients, relay, disk persistence, and reload passed.');
console.log('LIMITATION CONFIRMED: stock VTT server accepts an unapproved remote card delta.');
