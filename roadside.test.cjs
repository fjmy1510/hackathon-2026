const assert=require('node:assert/strict');
const S=require('./demo/engine.js'),M=require('./demo/city-map.js');
const locations=seed=>S.create(seed,'B').people.filter(p=>p.pickup).map(p=>p.pickup);
assert.deepEqual(locations(42),locations(42));assert.notDeepEqual(locations(42),locations(43));
assert.deepEqual(S.create(42,'A').people,S.create(42,'B').people);
let boarded=0;
for(let seed=1;seed<=30;seed++)for(const mode of ['A','B']){
 const s=S.create(seed,mode);
 for(const p of s.people.filter(p=>p.pickup)){
  assert.ok(p.pickup.offset>0&&p.pickup.offset<p.pickup.duration);
 }
 for(let t=0;t<180;t++){
  S.step(s);
  for(const p of s.people.filter(p=>p.pickup&&p.boardedAt===s.time)){
   boarded++;
   const expected=M.position({edge:{from:p.pickup.from,to:p.pickup.to,elapsed:p.pickup.offset,duration:p.pickup.duration}});
   const actual=M.position({edge:p.boardedRoad});
   assert.ok(Math.hypot(actual.x-expected.x,actual.y-expected.y)<1e-6,'boarding happens at the actual roadside point');
   assert.ok(p.boardedAt>=p.readyAt&&p.boardedAt<=p.waitUntil);
   assert.equal(s.buses.find(b=>b.id===p.planBus).onboard.includes(p.id),true);
  }
 }
}
assert.ok(boarded>0);
// Until a bus reaches a roadside person, their hidden attributes cannot affect dispatch.
const s=S.create(42,'B');S.step(s);
const other=structuredClone(s);
for(const p of other.people.filter(p=>p.pickup)){
 p.status='waiting';p.readyAt=0;p.waitUntil=30;p.destination='mall';
 p.pickup={from:'hospital',to:'mall',offset:4,duration:8};
}
S.step(s);S.step(other);assert.deepEqual(s.buses,other.buses);
const shown=S.create(42,'B'),p=shown.people.find(p=>p.pickup);p.status='waiting';
assert.ok(M.render(shown).includes('roadside-waiter'));
p.status='onboard';assert.ok(!M.render(shown).includes('data-person="'+p.id+'"'));
console.log('Roadside tests passed: seeded spatial variation, physical pickups across 60 runs, no remote dispatch, map visibility');
