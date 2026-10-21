/**
 * Offline, OCR-assisted dimensional extraction.
 * This is NOT a vision language model or a certified measurement process.
 * Derives rectangular quantities only when the OCR output explicitly
 * includes 2 or 3 numeric dimensions and unambiguous physical units.
 * The operator must verify every dimension against the source drawing.
 */
const FACTORS = { mm: 0.001, cm: 0.01, m: 1 };
const DECIMAL = '(?:\\d{1,7}(?:\\.\\d{1,4})?|\\.\\d{1,4})';
const SEP = '\\s*[x×*]\\s*';
const pattern3 = new RegExp('('+DECIMAL+')\\s*(mm|cm|m)?'+SEP+'('+DECIMAL+')\\s*(mm|cm|m)?'+SEP+'('+DECIMAL+')\\s*(mm|cm|m)?(?=\\b|$|[^A-Za-z0-9])', 'gi');
const pattern2 = new RegExp('('+DECIMAL+')\\s*(mm|cm|m)?'+SEP+'('+DECIMAL+')\\s*(mm|cm|m)?(?=\\b|$|[^A-Za-z0-9])', 'gi');

function dimensions(groups){
  const values=groups.filter((_,i)=>i%2===0).map(Number);
  const units=groups.filter((_,i)=>i%2===1).map(s=>(s||'').toLowerCase());
  const explicit=units.filter(Boolean);
  if(!explicit.length) return null;
  const uniform=explicit.length===1&&units[units.length-1]!=='' ? explicit[0] : null;
  const resolved=units.map(u=>u||uniform);
  if(resolved.some(u=>!u||!(u in FACTORS)))return null;
  const converted=values.map((v,i)=>v*FACTORS[resolved[i]]);
  if(converted.some(v=>!Number.isFinite(v)||v<=0||v>10000))return null;
  return {converted,raw:values.map((v,i)=>v+(resolved[i]||''))};
}
const clean=text=>String(text||'').replace(/\s+/g,' ').slice(0,120);

export function offlineDrawingTakeoff(ocrText){
  const lines=String(ocrText||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,200);
  const items=[];
  const warnings=[
    'OCR values may be misread. Cross-check dimensions and units against the approved drawing before use.',
    'These are geometric estimates only: deductions, reinforcement, openings and wastage are not inferred.'
  ];
  for(let i=0;i<lines.length&&items.length<10;i++){
    const line=lines[i];
    const triple=[...line.matchAll(pattern3)];
    if(triple.length){
      for(const m of triple){
        if(m.index>0 && /[0-9.\\-]/.test(line[m.index-1]))continue;
        const d=dimensions([m[1],m[2],m[3],m[4],m[5],m[6]]);
        if(!d)continue;
        const [L,B,H]=d.converted;
        const quantity=Number((L*B*H).toPrecision(12));
        const item={item:'Rectangular volume (OCR-assisted)',quantity,unit:'m³',formula:`${L} m × ${B} m × ${H} m`,evidence:'Source line: '+clean(line),needsVerification:true};
        if(quantity>0)items.push(item);
      }
      continue; // don't double-count the area inside a three-dimensional match
    }
    // A malformed or partly unscaled three-dimensional expression is not a valid 2D area.
    if((line.match(/[x×*]/gi)||[]).length>1)continue;
    for(const m of line.matchAll(pattern2)){
      if(m.index>0 && /[0-9.\\-]/.test(line[m.index-1]))continue;
      const d=dimensions([m[1],m[2],m[3],m[4]]);
      if(!d)continue;
      const [L,B]=d.converted;
      const quantity=Number((L*B).toPrecision(12));
      const item={item:'Rectangular area (OCR-assisted)',quantity,unit:'m²',formula:`${L} m × ${B} m`,evidence:'Source line: '+clean(line),needsVerification:true};
      if(quantity>0)items.push(item);
      if(items.length>=10)break;
    }
  }
  if(!items.length) warnings.push('No usable dimensions with explicit units were found. Enter measured dimensions manually, or use a clearer drawing.');
  return {summary: items.length ? 'Found '+items.length+' candidate geometric quantity/quantities in recognized drawing text. Verify each before adding to the measurement sheet.' : 'No defensible quantity could be calculated from recognized text.',warnings,items};
}
