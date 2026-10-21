import test from 'node:test';
import assert from 'node:assert/strict';
import {offlineDrawingTakeoff} from '../src/offlineTakeoff.js';
test('dimensioned rectangular slab in meters',()=>{
 const r=offlineDrawingTakeoff('SLAB 5.0m x 3.0m x 0.2m');
 assert.equal(r.items.length,1); assert.equal(r.items[0].unit,'m³');assert.equal(r.items[0].quantity,3);
 assert.equal(r.items[0].needsVerification,true);
});
test('dimensioned three components with trailing mm',()=>{
 const r=offlineDrawingTakeoff('FOOTING 5000 x 3000 x 200 mm');
 assert.equal(r.items[0].quantity,3);assert.equal(r.items[0].unit,'m³');
});
test('centimeters are normalized to meters',()=>{
 const r=offlineDrawingTakeoff('FOOTING 500 cm x 300 cm x 20 cm');
 assert.equal(r.items[0].quantity,3);
});
test('two measured dimensions produce area only',()=>{
 const r=offlineDrawingTakeoff('Floor 5m x 3m');
 assert.equal(r.items[0].unit,'m²');assert.equal(r.items[0].quantity,15);
});
test('no dimensions means no unsupported quantity',()=>{
 const r=offlineDrawingTakeoff('Picture of a house with a large foundation and a nice wall');
 assert.equal(r.items.length,0);
});
test('unscaled distances cannot produce quantities',()=>{
 const r=offlineDrawingTakeoff('SLAB 5000 x 3000 x 200');
 assert.equal(r.items.length,0);
});
test('partially unspecified unit is rejected',()=>{
 const r=offlineDrawingTakeoff('SLAB 5m x 3 x .2m');
 assert.equal(r.items.length,0);
});
test('impossible negative sign cannot become positive length',()=>{
 const r=offlineDrawingTakeoff('5m x 3m x -0.2m');
 assert.equal(r.items.length,0);
});
test('number of parsed candidates is capped',()=>{
 const lines=Array.from({length:100},(_,i)=>'P'+i+' 5m x 3m x 0.2m').join('\n');
 assert.equal(offlineDrawingTakeoff(lines).items.length,10);
});
