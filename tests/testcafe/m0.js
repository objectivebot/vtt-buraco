import fs from 'node:fs';
import { ClientFunction, Selector } from 'testcafe';
import { prepareClient, getStateObject, setRoomState, roomURL, setupTestEnvironment } from './test-util.js';
import { openRoom, dragPath, stateWhen } from './interaction-util.js';

setupTestEnvironment();
const probe=JSON.parse(fs.readFileSync(new URL('../../../dist/m0-probe.json',import.meta.url)));
delete probe._meta;
const storeName=ClientFunction(name=>localStorage.setItem('playerName',name));
async function namedClient(t,name){
  await storeName(name);
  await t.navigateTo(roomURL());
  await ClientFunction(prepareClient)();
  await t.click('#activeGameButton');
}
test('M0: locally reject invalid drop and allow a single authorized move', async t=>{
  await storeName('Alice');
  await t.navigateTo(roomURL());
  await openRoom(t,'modern',{...probe,probeSeat1:{...probe.probeSeat1,player:'Alice'},probeSeat2:{...probe.probeSeat2,player:'Bob'}});
  await dragPath(t,'probeCard',[{onto:'probeTarget'}]);
  const rejected=await stateWhen(s=>s.probeStatus?.text?.startsWith('Rejeitado pelo cliente'));
  await t.expect(rejected.probeCard.parent).eql('probeOrigin');
  await t.click('#w_probeApprove');
  const gated=await stateWhen(s=>s.probeGate?.gate==='open');
  await t.expect(gated.probeGate.gateOwner).eql('Alice');
  await dragPath(t,'probeCard',[{onto:'probeTarget'}]);
  const accepted=await stateWhen(s=>s.probeCard?.parent==='probeTarget' && s.probeGate?.gate==='closed');
  await t.expect(accepted.probeCard.parent).eql('probeTarget');
  await t.click('#w_probeReset');
  const reset=await stateWhen(s=>s.probeCard?.parent==='probeOrigin' && s.probeGate?.gate==='closed');
  await t.expect(reset.probeCard.parent).eql('probeOrigin');
});
test('M0: two browser windows converge and reconnect after accepted move', async t=>{
  await storeName('Alice');
  await t.navigateTo(roomURL());
  await openRoom(t,'modern',{...probe,probeSeat1:{...probe.probeSeat1,player:'Alice'},probeSeat2:{...probe.probeSeat2,player:'Bob'}});
  const first=await t.getCurrentWindow();
  const second=await t.openWindow(roomURL());
  await namedClient(t,'Bob');
  await t.click('#w_probeApprove');
  const refused=await stateWhen(s=>s.probeStatus?.text?.startsWith('Rejeitado: só Alice'));
  await t.expect(refused.probeGate.gate).eql('closed');
  await t.switchToWindow(first);
  await t.click('#w_probeApprove');
  await stateWhen(s=>s.probeGate?.gate==='open');
  await dragPath(t,'probeCard',[{onto:'probeTarget'}]);
  await stateWhen(s=>s.probeCard?.parent==='probeTarget' && s.probeGate?.gate==='closed');
  await t.switchToWindow(second);
  await t.expect(Selector('#w_probeCard').exists).ok();
  await t.expect((await getStateObject()).probeCard.parent).eql('probeTarget');
  await t.navigateTo(roomURL());
  await ClientFunction(prepareClient)();
  await t.click('#activeGameButton');
  await t.expect(Selector('#w_probeCard').exists).ok();
  await t.expect((await getStateObject()).probeCard.parent).eql('probeTarget');
  await t.closeWindow(second);
});
