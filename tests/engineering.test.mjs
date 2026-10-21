import test from 'node:test';import assert from 'node:assert/strict';import {barBbs,takeoff,steelKgPerMeter,csvForSheet} from '../src/engineering.js';
test('16 mm 6m ten bars',()=>assert.ok(Math.abs(barBbs({diameter:16,count:10,segments:'6000'}).quantity-(60*256/162))<1e-8));
test('hook and deduction',()=>assert.equal(barBbs({diameter:12,count:2,segments:'1000,1000',hooks:2,hookLength:150,deduction:100}).cutLengthMm,2200));
test('concrete',()=>assert.equal(takeoff({type:'Concrete',length:5,width:3,height:0.2,count:2}).quantity,6));
test('flooring',()=>assert.equal(takeoff({type:'Flooring',length:5,width:3}).quantity,15));
test('plaster',()=>assert.equal(takeoff({type:'Plaster',length:5,height:3}).quantity,15));
test('negative area rejected',()=>assert.throws(()=>takeoff({type:'Concrete',length:5,width:3,height:.2,deduction:99})));
test('count must be integer',()=>assert.throws(()=>barBbs({diameter:12,count:1.5,segments:'1000'})));
test('CSV injection protection',()=>assert.match(csvForSheet([{description:'=SUM(A1:A2)',quantity:1,unit:'kg',notes:'',source:'manual'}]),/"'=SUM/));
