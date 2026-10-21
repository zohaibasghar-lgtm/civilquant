/** Deterministic site-estimation calculations. SI units unless noted. */
export function positive(value, label) {
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n <= 0) throw new Error(label + ' must be greater than zero');
  return n;
}
export function nonnegative(value, label) {
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n < 0) throw new Error(label + ' cannot be negative');
  return n;
}
export function steelKgPerMeter(diameterMm) {
  const d=positive(diameterMm,'Bar diameter');
  return d*d/162; // conventional approximate bar mass; standards may differ
}
export function barBbs({diameter,count,segments,hooks=0,hookLength=0,deduction=0}) {
  const d=positive(diameter,'Bar diameter'), n=positive(count,'Number of bars');
  if (!Number.isInteger(n)) throw new Error('Bar count must be a whole number');
  const lengths=String(segments).split(',').map(s=>positive(s.trim(),'Bar segment'));
  const h=nonnegative(hooks,'Number of hooks'), hl=nonnegative(hookLength,'Hook length');
  const bd=nonnegative(deduction,'Total bend deduction');
  if (!Number.isInteger(h)) throw new Error('Number of hooks must be a whole number');
  const cutMm=lengths.reduce((a,b)=>a+b,0)+h*hl-bd;
  if (cutMm<=0) throw new Error('Cutting length must exceed zero');
  const totalLengthM=cutMm*n/1000;
  return { diameterMm:d, count:n, cutLengthMm:cutMm, unitWeightKgM:steelKgPerMeter(d), totalLengthM, quantity:totalLengthM*steelKgPerMeter(d), unit:'kg', notes: 'Bar segments '+lengths.join('+')+'mm + '+h+' hooks x '+hl+'mm - '+bd+'mm bends'};
}
export const ITEMS = [
  {name:'Concrete',unit:'m³',kind:'volume'},
  {name:'Excavation',unit:'m³',kind:'volume'},
  {name:'Brick masonry',unit:'m³',kind:'volume'},
  {name:'Plaster',unit:'m²',kind:'wall'},
  {name:'Formwork',unit:'m²',kind:'wall'},
  {name:'Flooring',unit:'m²',kind:'plan'},
  {name:'Waterproofing',unit:'m²',kind:'plan'},
  {name:'Road sub-base',unit:'m³',kind:'volume'},
  {name:'Road asphalt',unit:'m³',kind:'volume'},
];
export function takeoff({type,length,width,height,count=1,deduction=0}) {
  const item=ITEMS.find(x=>x.name===type);
  if(!item) throw new Error('Unsupported item');
  const L=positive(length,'Length'), n=positive(count,'No. of items');
  if(!Number.isInteger(n)) throw new Error('No. of items must be whole');
  const D=nonnegative(deduction,'Deduction');
  const w=item.kind==='volume'||item.kind==='plan'?positive(width,'Width'):null;
  const h=item.kind==='volume'||item.kind==='wall'?positive(height,'Height'):null;
  const gross=L*(w||1)*(h||1)*n;
  const net=gross-D;
  if(net<0) throw new Error('Deduction exceeds gross quantity');
  return {description:item.name,quantity:net,unit:item.unit,notes:'L='+L+'m, '+(w?'B='+w+'m, ':'')+(h?'H='+h+'m, ':'')+'Nos='+n+', deduction='+D+' '+item.unit};
}
export function round(v,d=3){return Number(v).toFixed(d);}
export function csvForSheet(rows){
 const csvCell=x=>{let s=String(x??'');if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return [['No.','Description','Measurements','Quantity','Unit','Source'],...rows.map((r,i)=>[i+1,r.description,r.notes,round(r.quantity),r.unit,r.source])].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
