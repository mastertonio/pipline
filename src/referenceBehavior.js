// Original calculator behavior, initialized within a React-owned DOM island.
// Document listeners and timers are scoped so StrictMode/HMR can clean up safely.
export function initializeCalculator() {
  const controller = new AbortController();
  const timers = new Set();
  const document = new Proxy(window.document, { get(target, key) {
    if (key === 'addEventListener') return (type, listener, options) => target.addEventListener(type, listener, typeof options === 'boolean' ? {capture:options,signal:controller.signal} : {...options,signal:controller.signal});
    const value = Reflect.get(target,key,target);
    return typeof value === 'function' ? value.bind(target) : value;
  }});
  const setTimeout = (callback, delay) => { const id = window.setTimeout(() => {timers.delete(id);callback()},delay); timers.add(id); return id; };
  const clearTimeout = id => {timers.delete(id);window.clearTimeout(id)};

const $ = id => document.getElementById(id);
const num = v => { const n = parseFloat(String(v).replace(/[^0-9.]/g,'')); return isNaN(n) ? null : n; };
const money = n => (n < 0 ? '-$' : '$') + Math.round(Math.abs(n)).toLocaleString('en-US');
const dec = n => Math.abs(n) < 100 ? (+n.toFixed(1)).toLocaleString('en-US') : Math.round(n).toLocaleString('en-US');
const scenName = v => v === 0.01 ? 'Applied Lightly' : v === 0.02 ? 'Fully Mastered' : 'Applied Consistently';
const pct = n => (+n.toFixed(1)) + '%';
let per = 'm', team = false, step = 0, scen = 0.015, locked = false;
const BASE = ['reps','ppw','aov','cr','cyc','cyc-u','think','no','wks'];

const REP = [
  {n:'Conversation Confidence', s:"Conversation", x:["Scripted and quick to pitch; conversations feel forced.", "Can run a call, but defaults to pitching under pressure.", "Leads most conversations well, but still rushes to the presentation.", "Leads with genuine curiosity and holds the pitch until it's earned.", "Every conversation feels natural; prospects feel guided, never sold."], i:'How confidently do I lead a genuine conversation, without scripts or pitching too early?', t:'How confidently do our reps lead a genuine conversation, without scripts or pitching too early?', v:[5.5,8]},
  {n:'Prospect Understanding', s:"Understanding", x:["Hears surface needs and the features prospects ask about.", "Learns the facts, but rarely what prospects feel or why it matters now.", "Uncovers the main problem, but misses the deeper motivation.", "Understands the problem, its cost and what's driving the decision.", "Uncovers what prospects think, feel and need, often before they say it."], i:'How well do I uncover what the prospect is really thinking, feeling and trying to solve?', t:'How well do our reps uncover what the prospect is really thinking, feeling and trying to solve?', v:[4.5,7.5]},
  {n:'Qualification Confidence', s:"Qualification", x:["Presents to almost everyone and hopes it's a fit.", "Senses fit, but often finds out too late.", "Qualifies the basics; readiness to decide is often unclear.", "Knows who's a fit and ready before presenting.", "Presents only once fit and readiness are confirmed. Few surprises."], i:'How clearly do I know whether a prospect is a real fit and ready to decide?', t:'How clearly do our reps know whether a prospect is a real fit and ready to decide?', v:[5,7.5]},
  {n:'Message & Value Confidence', s:"Message & Value", x:["The message is generic; prospects don't see why it matters to them.", "A foundation is there, but the message lacks clarity and impact.", "The message is clear, but not always tied to what the prospect said.", "The value connects directly to the prospect's situation and priorities.", "Prospects can explain the value in their own words, and why it matters now."], i:'How clearly do I explain why this solution matters to this prospect?', t:'How clearly do our reps explain why the solution matters to each prospect?', v:[5,7.5]},
  {n:'Authenticity & Conversation Control', s:"Authenticity", x:["Rapport feels forced, or the conversation loses direction.", "Genuine, but conversations often drift.", "Guides most conversations, with occasional tangents or pressure.", "Natural and in control; the conversation stays on course.", "Fully authentic and in control; the conversation flows to a decision."], i:'How naturally do I guide the conversation without forcing rapport or losing direction?', t:'How naturally do our reps guide the conversation without forcing rapport or losing direction?', v:[5.5,8]}
];
const PRO = [
  {n:'Feeling Heard & Understood', s:"Feeling Heard", x:["Prospects feel pitched at, not listened to.", "Prospects feel partly heard, but their concerns get rushed.", "Prospects feel heard on the main points.", "Prospects feel their situation is truly understood.", "Prospects feel fully understood, and often say so."], i:'"They actually understand me."', v:[5,8]},
  {n:'Prospect Openness', s:"Openness", x:["Prospects stay guarded and defend the way they do it now.", "Prospects listen, but stay skeptical of change.", "Prospects are open to ideas, but not yet to a different way.", "Prospects actively consider a new approach.", "Prospects lean in and want to explore a different way."], i:'"I\'m willing to consider a different way."', v:[4.5,7.5]},
  {n:'Decision Clarity', s:"Decision Clarity", x:["Prospects leave unsure what the real problem is.", "Prospects see the problem, but not what needs to change.", "Prospects understand the problem and some of the cost of waiting.", "Prospects are clear on their situation and what needs to change.", "Prospects can explain the problem, its cost and what must change."], i:'"I understand my situation and what needs to change."', v:[5.5,7.5]},
  {n:'Solution Alignment', s:"Alignment", x:["Prospects see the solution as generic or off-target.", "Prospects see some fit, but the link to their needs is loose.", "Prospects see how it fits their main need.", "Prospects see how it maps to everything they shared.", "Prospects see it as built for their exact situation."], i:'"What they\'re showing me fits what I need."', v:[4.5,7]},
  {n:'Decision Confidence', s:"Confidence", x:["Prospects aren't ready and default to “let me think about it.”", "Prospects are interested, but hesitant to commit.", "Prospects are fairly confident, but open questions lead to follow-ups.", "Prospects feel confident, and most decide on the call.", "Prospects decide on the call, with no need to think it over."], i:'"I feel confident enough to move forward."', v:[5,7]}
];

const BANDS = [['Weak',1,2],['Developing',3,4],['Average',5,6],['Strong',7,8],['Excellent',9,10]];
const bandOf = v => BANDS.findIndex(b => v >= b[1] && v <= b[2]);
const gi = {r:0, p:0};
const LISTS = {r:REP, p:PRO};
const px = v => (v-1)/9*100;
function buildRates(list, host, key){
  $(host).innerHTML = list.map((c, k) => `<input type="hidden" id="${key}${k}n" value=""><input type="hidden" id="${key}${k}d" value="">`).join('')
  + `<div class="gv" id="gv-${key}"></div>
  <div class="cv" aria-label="Lift summary">
    <div class="cv-head"><div class="sec-title"><h3><span class="sec-n">2</span>Your lift at a glance</h3></div><div class="ckey" aria-hidden="true"><span><i style="border:2px solid var(--graphite);background:#fff"></i>Today</span><span><i style="background:var(--navy-800)"></i>With the Framework</span><span><i class="lbar"></i>Impact lift</span></div></div>`
  + list.map((c, k) => `
    <button type="button" class="rate sumrow todo" id="rt-${key}${k}" data-gt="${key}:${k}" aria-label="Edit ${c.n}">
      <span class="sname">${c.s}</span>
      <span class="track empty" id="tr-${key}${k}" aria-hidden="true">
        <span class="thint"></span><span class="rail"></span>
        ${Array.from({length:10}, (_, j) => `<span class="tick" style="left:${px(j+1)}%"></span><span class="tn" style="left:${px(j+1)}%">${j+1}</span>`).join('')}
        <span class="lift hide"></span><span class="kl now hide"></span><span class="kl df hide"></span>
        <span class="knob now hide"></span><span class="knob df hide"></span>
      </span>
      <span class="delta" id="d-${key}${k}">Not rated</span>
    </button>`).join('') + '</div>';
}
function setRate(id, v){
  $(id).value = v;
  if (id.endsWith('n')){ const did = id.slice(0,-1) + 'd', dv = num($(did).value); if (dv !== null && dv < +v) $(did).value = v; }
}
function drawTrack(tr, nv, dv){
  const q = sel => tr.querySelector(sel);
  tr.classList.toggle('empty', nv === null);
  q(".thint").textContent = nv === null ? 'Click where you are today' : dv === null ? 'Now click where you expect to be with the Framework' : '';
  q(".thint").classList.toggle('hide', dv !== null);
  ['.knob.now','.kl.now'].forEach(s => { q(s).classList.toggle('hide', nv === null); if (nv !== null) q(s).style.left = px(nv) + '%'; });
  ['.knob.df','.kl.df','.lift'].forEach(s => q(s).classList.toggle('hide', dv === null));
  if (dv !== null){ q('.knob.df').style.left = q('.kl.df').style.left = px(dv) + '%'; q('.lift').style.left = px(nv) + '%'; q('.lift').style.width = (px(dv) - px(nv)) + '%'; }
  const same = nv !== null && dv === nv;
  q('.kl.now').style.top = same ? '-14px' : '0';
  q('.kl.df').textContent = same ? 'Today · Framework' : 'Framework';
  const close = nv !== null && dv !== null && !same && dv - nv <= 3;
  q('.kl.df').style.transform = same ? '' : dv === 10 ? 'translate(-65%,-100%)' : close ? 'translate(-8px,-100%)' : '';
  q('.kl.now').style.transform = close ? 'translate(calc(-100% + 8px),-100%)' : nv === 1 ? 'translate(-25%,-100%)' : '';
  q('.knob.now').setAttribute('aria-valuenow', nv ?? ''); q('.knob.df').setAttribute('aria-valuenow', dv ?? '');
  tr.querySelectorAll('.tn').forEach((t, j) => t.classList.toggle('on', j+1 === nv || j+1 === dv));
}
function renderGuided(key){
  const list = LISTS[key], k = gi[key], c = list[k], host = $(`gv-${key}`);
  const nv = num($(`${key}${k}n`).value), dv = num($(`${key}${k}d`).value);
  const fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fk : null;
  const tabs = list.map((x, j) => { const a = num($(`${key}${j}n`).value), b = num($(`${key}${j}d`).value), done = a !== null && b !== null;
    return `<button type="button" class="gtab ${j === k ? 'on' : ''} ${done ? 'done' : ''}" data-gt="${key}:${j}" data-fk="t${key}${j}" aria-current="${j === k}"><b>${x.s}</b><span>${done ? `${a} → ${b}<em>+${b-a}</em>` : a !== null ? `${a} → ?` : 'Not rated'}</span></button>`; }).join('');
  const cells = which => Array.from({length:10}, (_, j) => { const v = j+1; let cl = '', dis = false;
    if (which === 'n') cl = v === nv ? 'now' : (nv !== null && v < nv) ? 'fill' : '';
    else { dis = nv === null || v < nv; cl = v === dv ? 'sel' : (nv !== null && v <= nv && dv !== null) ? 'base' : (nv !== null && dv !== null && v > nv && v < dv) ? 'span' : ''; }
    const on = which === 'n' ? v === nv : v === dv;
    return `<button type="button" role="radio" aria-checked="${on}" class="${cl}" data-r="${key}${k}${which}" data-v="${v}" data-fk="c${which}${v}" ${dis ? 'disabled' : ''} aria-label="${c.n}, ${which === 'n' ? 'today' : 'with the Framework'}: ${v} of 10">${v}</button>`; }).join('');
  const panel = (which, lab) => { const v = which === 'n' ? nv : dv, off = which === 'd' && nv === null, b = v === null ? -1 : bandOf(v);
    const lo = which === 'n' ? 1 : (nv ?? 1);
    const desc = v !== null ? c.x[b] : off ? 'Set Today first.' : which === 'n' ? 'Pick a number to see what it means.' : key === 'r' ? (team ? 'Pick where you expect your reps to be with the Framework.' : 'Pick where you expect to be with the Framework.') : team ? 'Pick where you expect it to be when your reps use the Framework.' : 'Pick where you expect it to be with the Framework.';
    return `<div class="gp ${which === 'd' ? 'df' : ''} ${off ? 'off' : ''}"><div class="glbl">${lab}</div>
      <div class="gnum"><div class="v">${v ?? '—'}<small>/10</small></div><div class="gstep">
        <button type="button" data-r="${key}${k}${which}" data-v="${v === null ? lo : Math.max(lo, v-1)}" data-fk="m${which}" ${off || v === null || v <= lo ? 'disabled' : ''} aria-label="Lower ${lab}">−</button>
        <button type="button" data-r="${key}${k}${which}" data-v="${v === null ? (which === 'n' ? 5 : Math.min(10, nv+1)) : Math.min(10, v+1)}" data-fk="p${which}" ${off || v === 10 ? 'disabled' : ''} aria-label="Raise ${lab}">+</button></div></div>
      <div class="gcells" role="radiogroup" aria-label="${c.n}, ${lab}">${cells(which)}</div>
      <div class="gband">${v === null ? 'Not rated' : BANDS[b][0]}</div><div class="gdesc">${desc}</div></div>`; };
  const g = nv !== null && dv !== null ? dv - nv : null;
  document.querySelectorAll(`[id^="rt-${key}"]`).forEach((r, j) => r.classList.toggle('cur', j === k));
  host.innerHTML = `<div class="gtabs" role="tablist">${tabs}</div>
    <div class="ghead"><div><h5>${c.n}</h5><p class="q" data-k="${key}${k}">${key === 'r' && team ? c.t : c.i}</p></div><span class="gcount">${k+1} of 5</span></div>
    <div class="gpanels">${panel('n', 'Today')}<div class="gmid" aria-hidden="true"><i class="l"></i><i class="r"></i><div class="gbadge ${g === null ? 'wait' : ''}"><b>${g === null ? '—' : '+' + g}</b><span>LIFT</span></div></div>${panel('d', 'With the Framework')}</div>
    <div class="gnav"><button type="button" data-gn="${key}:-1" data-fk="gp" ${k === 0 ? 'disabled' : ''}>← Previous category</button><button type="button" data-gn="${key}:1" data-fk="gn" ${k === 4 ? 'disabled' : ''}>Next category →</button></div>`;
  if (fk){ const el = host.querySelector(`[data-fk="${fk}"]`); if (el && !el.disabled) el.focus(); }
}
buildRates(REP, 'rates-rep', 'r');
buildRates(PRO, 'rates-pro', 'p');

const rules = {
  reps:{min:1,max:500,msg:'Enter 1–500 reps.',team:true},
  ppw:{min:1,max:100,msg:'Enter 1–100 presentations a week.'},
  aov:{min:1,max:1e8,msg:'Enter your average offer value.'},
  cr:{min:0.1,max:95,msg:'Enter a close rate between 0.1% and 95%.'},
  wks:{min:1,max:52,msg:'Enter 1–52 weeks.'}
};
const touched = new Set(); let showAll = false, missing = false;
const DEMO = {reps:'6', ppw:'13', aov:'5,000', cr:'20', think:'60', no:'30', cyc:'21',
  r0n:'6', r0d:'8', r1n:'5', r1d:'8', r2n:'5', r2d:'8', r3n:'5', r3d:'7', r4n:'6', r4d:'8',
  p0n:'5', p0d:'8', p1n:'4', p1d:'7', p2n:'5', p2d:'7', p3n:'4', p3d:'7', p4n:'5', p4d:'7'};
let lastR = {done:false}, lastQ = {done:false};
const hints = {};
for (const k in rules){ const h = document.querySelector(`[data-f="${k}"] .hint`); hints[k] = h ? h.textContent : ''; }

function validate(){
  let ok = true; missing = false;
  for (const k in rules){
    const r = rules[k], f = document.querySelector(`[data-f="${k}"]`);
    if (r.team && !team){ f.classList.remove('err'); continue; }
    const raw = $(k).value.trim(), v = num(raw), bad = v === null || v < r.min || v > r.max;
    const show = bad && (raw !== '' || touched.has(k) || showAll);
    if (raw === '') missing = true;
    f.classList.toggle('err', show);
    f.querySelector('.hint').textContent = show ? r.msg : hints[k];
    if (bad) ok = false;
  }
  const tr = $('think').value.trim(), nr = $('no').value.trim();
  const t = num(tr) ?? 0, n = num(nr) ?? 0, over = t + n > 100;
  const tBad = over || (tr === '' && (touched.has('think') || showAll));
  const nBad = over || (nr === '' && (touched.has('no') || showAll));
  document.querySelector('[data-f="think"]').classList.toggle('err', tBad);
  document.querySelector('[data-f="no"]').classList.toggle('err', nBad);
  if (tr === '' || nr === '') { missing = true; ok = false; }
  $('o-msg').textContent = over ? `These add up to ${t+n}%. Bring them to 100% or less.` : (tBad || nBad) ? 'Enter both percentages. A best estimate is fine.' : 'A best estimate is fine. This shows where the lift is most likely to come from.';
  $('o-msg').style.color = (over || tBad || nBad) ? '#a63d29' : '';
  if (over) ok = false;
  return ok;
}

function side(list, key){
  let a = 0, b = 0, cnt = 0, rated = 0;
  const rows = list.map((c, k) => {
    const nv = num($(`${key}${k}n`).value), dv0 = num($(`${key}${k}d`).value);
    let dv = dv0;
    if (nv !== null && dv !== null && dv < nv){ dv = nv; $(`${key}${k}d`).value = nv; }
    drawTrack($(`tr-${key}${k}`), nv, dv);
    const done = nv !== null && dv !== null;
    $(`rt-${key}${k}`).classList.toggle('todo', !done);
    const dl = $(`d-${key}${k}`);
    if (done){ const g = dv - nv; dl.textContent = g ? `+${g} ${g === 1 ? 'pt' : 'pts'}` : 'No change'; dl.classList.toggle('zero', !g); a += nv; b += dv; cnt++; rated++; }
    else { dl.textContent = nv !== null ? 'Pick a target' : 'Not rated'; dl.classList.add('zero'); }
    return {n:c.n, now:nv, df:dv, gap: done ? dv - nv : null};
  });
  const now = cnt ? a/cnt : null, df = cnt ? b/cnt : null;
  renderGuided(key);
  return {now, df, imp: cnt ? (df-now)/now : 0, rows, rated, done: rated === list.length};
}


function timeText(days){
  if (!isFinite(days)) return '—';
  if (days < 1) return 'Under a day';
  if (days < 14) return `${Math.ceil(days)} ${Math.ceil(days) === 1 ? 'day' : 'days'}`;
  if (days < 70) return `About ${Math.round(days/7)} weeks`;
  return `About ${(days/30.4).toFixed(1)} months`;
}

function update(){
  const ok = validate();
  const reps = team ? (num($('reps').value)||0) : 1;
  const ppw = num($('ppw').value)||0, aov = num($('aov').value)||0, cr = Math.min(num($('cr').value)||0, 95);
  const wks = num($('wks').value)||48, d = per === 'm' ? 12 : 1, pl = per === 'm' ? 'per month' : 'per year';
  const P = reps*ppw*wks, yes = P*cr/100;
  const t = num($('think').value)||0, n = num($('no').value)||0, fit = Math.max(0, 100-t-n), nc = 100-cr;
  const dash = '—';

  // Baseline
  const split = $('think').value.trim() !== '' && $('no').value.trim() !== '';
  $('fit').textContent = split ? fit + '%' : dash;
  const cntOn = ppw > 0 && cr > 0 && (!team || reps > 0), u = per === 'm' ? 'mo' : 'yr', cn = v => Math.round(v).toLocaleString('en-US');
  $('nc-count').textContent = `Of the ${+nc.toFixed(1)}% that don't close today` + (cntOn ? ` (about ${cn(Math.round(P*nc/100/d))} presentations a ${per === 'm' ? 'month' : 'year'})` : '');
  $('nc-count').style.visibility = cr ? 'visible' : 'hidden';
  const sh = split ? {yes:cr, think:nc*t/100, no:nc*n/100, fit:nc*fit/100} : {yes:cr, think:0, no:0, fit:0};
  for (const k in sh) $('b-'+k).style.width = sh[k] + '%';
  const cntRows = cntOn && split && t + n <= 100;
  $('outcomes').classList.toggle('has-cnt', cntRows);
  // whole-number counts that add up exactly to the heading (largest remainder)
  const ncN = Math.round(P*nc/100/d), ex = [t, n, fit].map(v => P*nc/100*v/100/d), fl = ex.map(Math.floor);
  let left = ncN - fl.reduce((a,b) => a+b, 0);
  ex.map((v,i) => [v - fl[i], i]).sort((a,b) => b[0]-a[0]).forEach(([,i]) => { if (left > 0){ fl[i]++; left--; } });
  const cnt = {think:fl[0], no:fl[1], fit:fl[2]};
  ['think','no','fit'].forEach(k => { $('c-'+k).textContent = cntRows ? `· ${cn(cnt[k])}/${u}` : ''; });
  $('legend').innerHTML = split
    ? [['yes','Yes'],['think','Think about it'],['no','No'],['fit','Not a fit']].map(([k,l]) => `<span><em class="o-${k}"></em>${l} <b>${pct(sh[k])}</b></span>`).join('')
    : (cr ? `<span><em class="o-yes"></em>Yes <b>${pct(cr)}</b></span><span><em style="background:var(--line)"></em>Not yet split <b>${pct(nc)}</b></span>` : '<span>Enter your close rate and split to see how your presentations end.</span>');
  document.querySelectorAll('.per').forEach(e => e.textContent = pl);
  document.querySelectorAll('.per-p').forEach(e => e.textContent = 'presentations ' + pl);
  $('k-pres').textContent = ok ? dec(P/d) : dash;
  $('k-yes').textContent = ok ? dec(yes/d) : dash;
  $('k-rev').textContent = ok ? money(yes*aov/d) : dash;
  $('k-rpp').textContent = ok ? money(aov*cr/100) : dash;
  $('k-think').textContent = ok ? (split ? cn(cnt.think) : dec(P*sh.think/100/d)) : dash;
  $('k-unc').textContent = ok ? money(P*(sh.think+sh.no)/100*aov/d) : dash;
  $('k-unc-sub').textContent = ok && split ? `${cn(cnt.think + cnt.no)} presentations ${pl}` : pl;
  $('next0').disabled = !ok;
  $('status').textContent = ok ? 'Baseline complete' : (missing && !document.querySelector('[data-panel="0"] .err')) ? 'Enter your numbers to see your current reality.' : 'Complete the highlighted fields to continue.';

  // Presenter & Audience
  document.querySelectorAll('[data-k^="r"]').forEach(p => { const c = REP[+p.dataset.k.slice(1)]; p.textContent = team ? c.t : c.i; });
  $('pres-intro').textContent = team
    ? "How your reps lead the conversation shapes how prospects decide. Rate where they are today, on average, then where they'll be using the Discovery Framework."
    : "How you lead the conversation shapes how prospects decide. Rate where you are today, then where you'll be using the Discovery Framework.";
  $('rep-next').textContent = team ? "Next, you'll rate the experience from your prospects' side." : "Next, you'll rate the experience from your prospect's side.";
  $('aud-intro').textContent = team
    ? "How your prospects experience your reps' conversations shapes whether they say yes. Rate how it feels for them today, then how it will feel when your reps use the Discovery Framework."
    : 'How your prospects experience the conversation shapes whether they say yes. Rate how it feels for them today, then how it will feel when you use the Discovery Framework.';
  $('rep-score-h').textContent = team ? 'Team presenter score' : 'Presenter score';
  const R = side(REP, 'r'), Q = side(PRO, 'p');
  lastR = R; lastQ = Q;
  const f1 = v => v === null ? '—' : v.toFixed(1);
  $('rep-now').textContent = f1(R.now); $('rep-df').textContent = f1(R.df); 
  $('pro-now').textContent = f1(Q.now); $('pro-df').textContent = f1(Q.df); 
  $('rep-status').textContent = R.done ? 'All five rated' : `${R.rated} of 5 rated · Rate all five to continue`;
  $('pro-status').textContent = Q.done ? 'All five rated' : `${Q.rated} of 5 rated · Rate all five to continue`;
  $('next1').disabled = !R.done; $('next2').disabled = !Q.done;
  document.querySelectorAll('[data-go]').forEach(b => { if (b.classList.contains('cta') || b.classList.contains('back')) return; const g = +b.dataset.go; b.disabled = (g >= 1 && !ok) || (g >= 2 && !R.done) || (g >= 3 && !Q.done); });
  const fr = Q.rows.filter(r => r.now !== null).sort((a,b) => a.now-b.now).slice(0,3);
  $('friction').innerHTML = fr.length ? fr.map(r => `<div><span>${r.n}</span><b>${r.now} / 10</b></div>`).join('') : '<div><span>Rate today to see where decisions stall.</span></div>';

  // Impact
  const pts = [...R.rows, ...Q.rows].reduce((t, r) => t + (r.gap || 0), 0), lift = pts*scen;
  const cr2 = Math.min(cr*(1+lift), 95), addY = P*(cr2-cr)/100, addRevY = addY*aov;
  const capped = cr*(1+lift) > 95;
  const rp = R.rows.reduce((t,r)=>t+(r.gap||0),0), qp = Q.rows.reduce((t,r)=>t+(r.gap||0),0);
  $('eq-r').textContent = '+' + rp; $('eq-p').textContent = '+' + qp; $('eq-t').textContent = pts;
  $('eq-s').textContent = (scen*100).toFixed(1) + '%';
  $('eq-sl').textContent = scenName(scen);
  $('eq-l').textContent = '+' + (+(lift*100).toFixed(1)) + '%';
  $('eq-cr').textContent = `${pct(cr)} → ${pct(cr2)}`;
  $('scen-note').textContent = `The lift is relative to today: ${+(lift*100).toFixed(1)}% of your ${pct(cr)} close rate adds ${+(cr2-cr).toFixed(1)} points, for a modeled ${pct(cr2)}.${capped ? ' Modeled close rate is capped at 95%.' : ''}`;
  $('lift-wins').firstChild.textContent = (addY/d >= 0 ? '+' : '') + dec(addY/d);
  $('lift-unit').textContent = per === 'm' ? 'closed deals a month' : 'closed deals a year';
  $('lift-rev').textContent = `+${money(addRevY/d)} in additional ${per === 'm' ? 'monthly' : 'annual'} revenue`;
  const cyc = num($('cyc').value), cu = $('cyc-u').value.toLowerCase();
  $('lift-time').style.display = cyc ? 'block' : 'none';
  if (cyc) $('lift-time').textContent = `First additional wins expected within about ${+cyc.toFixed(1)} ${cyc === 1 ? cu.replace(/s$/,'') : cu}, one sales cycle.`;
  $('cr-now').textContent = pct(cr); $('cr-df').textContent = pct(cr2);
  const nr = num($('reps').value);
  $('r-rev-l').textContent = per === 'm' ? 'Additional monthly revenue' : 'Additional annual revenue';
  $('r-rev').textContent = '+' + money(addRevY/d);
  const v1 = aov*cr/100, v2 = aov*cr2/100;
  $('r-vpp').textContent = '+' + money(v2-v1); $('r-vpp2').textContent = `${money(v1)} → ${money(v2)}`;
  // Closed deals share one precision so Today + Lift = Modeled as shown
  const dd = Math.abs(addY/d) < 100 ? (n => (+n.toFixed(1)).toLocaleString('en-US')) : (n => Math.round(n).toLocaleString('en-US'));
  const rows = [
    ['Presentations', dec(P/d), dec(P/d), 'Same'],
    ['Close rate', pct(cr), pct(cr2), '+' + (+(cr2-cr).toFixed(1)) + ' pts'],
    ['Closed deals', dd(yes/d), dd(P*cr2/100/d), '+' + (Math.abs(addY/d) < 100 ? dd(addY/d) : (Math.round(P*cr2/100/d) - Math.round(yes/d)).toLocaleString('en-US'))],
    ['Revenue', money(yes*aov/d), money(P*cr2/100*aov/d), '+' + money(addRevY/d)],
    ['Revenue per presentation', money(v1), money(v2), '+' + money(v2-v1)]
  ];
  $('cmp').innerHTML = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  $('inv-l').textContent = team ? 'Discovery Framework investment (team)' : 'Discovery Framework investment';
  const inv = num($('inv').value)||0;
  const share = aov ? inv/aov : null;
  $('p-wins').textContent = share === null || !inv ? dash : share <= 1 ? Math.max(1, Math.round(share*100)) + '%' : dec(share) + ' deals';
  $('p-wins').previousElementSibling.textContent = share !== null && share > 1 ? 'Additional deals to pay back' : 'Share of one additional deal';
  $('pay-lead').textContent = !inv || share === null ? 'Enter your investment to see payback.' : share <= 1 ? 'Covered by your first additional deal.' : `Covered after about ${Math.ceil(share)} additional deals.`;
  const cycD = cyc ? cyc * (cu === 'weeks' ? 7 : cu === 'months' ? 30.4 : 1) : 0;
  $('p-time-n').style.display = cycD ? 'block' : 'none';
  $('p-time').textContent = addRevY > 0 && inv ? timeText(cycD + Math.max(1, Math.ceil(share)) * 365/addY) : dash;
  // Presenter / Audience lift summaries
  const lp = v => '+' + (+(v*scen*100).toFixed(1)) + '%', sp = (scen*100).toFixed(1) + '%';
  const rowH = (lbl, sub, val, cls='') => `<div class="ls-row ${cls}"><span>${lbl}${sub ? `<small>${sub}</small>` : ''}</span><b>${val}</b></div>`;
  const who = team ? "your team's" : 'your';
  const rl = rp*scen, crR = Math.min(cr*(1+rl), 95), rCap = cr*(1+rl) > 95, rPts = `${rp} ${rp === 1 ? 'point' : 'points'}`;
  $('rep-lift').innerHTML = `<div class="rl"><span class="rl-l">Presenter lift</span><b>${rp ? lp(rp) + ' lift' : '—'}</b><small class="rl-a">${rPts} × ${sp} per point</small>${cr && rp ? `<small class="rl-b">${pct(cr)} → ${pct(crR)} close rate</small>` : ''}</div>`;
  const ql = qp*scen, tl = pts*scen, crT = Math.min(cr*(1+tl), 95), qPts = `${qp} ${qp === 1 ? 'point' : 'points'}`;
  $('pro-lift').innerHTML = `<div class="rl"><span class="rl-l">Audience lift</span><b>${qp ? lp(qp) + ' lift' : '—'}</b><small class="rl-a">${qPts} × ${sp} per point</small>${cr && pts ? `<small class="rl-b"><em>Presenter + Audience:</em> ${pct(cr)} → ${pct(crT)} close rate</small>` : ''}</div>`;
  $('pm-s2').textContent = Q.now === null ? '—' : `${f1(Q.now)} → ${f1(Q.df)}`;
  $('pm-x2').textContent = qp ? `${lp(qp)} lift${cr ? ` · Presenter + Audience: ${pct(cr)} → ${pct(crT)}` : ''}` : 'Rate a category to see the lift';
  $('pro-note').textContent = `These are ${who} ratings, not a forecast. `
    + (qp && cr ? `${team ? "Your reps'" : 'Your'} ${qp} Audience ${qp === 1 ? 'point raises' : 'points raise'} ${who} close rate by ${+(ql*100).toFixed(1)}% of itself. Together with ${team ? 'their' : 'your'} Presenter points, ${pct(cr)} becomes ${pct(crT)}.${cr*(1+tl) > 95 ? ' Modeled close rate is capped at 95%.' : ''} `
      : cr ? `Each point raises ${who} ${pct(cr)} close rate by ${sp} of itself. ` : `Each point raises ${who} close rate by ${sp} of itself. `)
    + 'You can change the rate per point on the Impact step.';
  $('pm-s').textContent = R.now === null ? '—' : `${f1(R.now)} → ${f1(R.df)}`;
  $('pm-x').textContent = rp ? `${lp(rp)} lift${cr ? ` · ${pct(cr)} → ${pct(crR)} close rate` : ''}` : 'Rate a category to see the lift';
  $('rep-mini').querySelector('.pm-l').textContent = team ? 'Team presenter score' : 'Presenter score';
  $('rep-note').textContent = `These are ${who} ratings, not a forecast. `
    + (rp && cr ? `${team ? "Your team's" : 'Your'} ${rPts} ${rp === 1 ? 'raises' : 'raise'} ${who} close rate by ${+(rl*100).toFixed(1)}% of itself: ${pct(cr)} becomes ${pct(crR)}.${rCap ? ' Modeled close rate is capped at 95%.' : ''} `
      : cr ? `Each point raises ${who} ${pct(cr)} close rate by ${sp} of itself. ` : `Each point raises ${who} close rate by ${sp} of itself. `)
    + 'You can change the rate per point on the Impact step.';
  // where deals come from
  const waitY = split ? P*sh.think/100 : 0, poolY = split ? P*(sh.think+sh.no)/100 : 0;
  const src = addY > 0 && waitY ? (addY <= waitY ? [addY/waitY, waitY, 'waiting on a decision'] : [addY/poolY, poolY, 'that end in "think about it" or "no"']) : null;
  const pu = per === 'm' ? 'a month' : 'a year';
  if (src && addY <= src[1]){
    $('r-wins-l').textContent = addY <= waitY ? 'Waiting on a decision' : '"Think about it" or "no"';
    $('r-wins').innerHTML = `${dec(addY/d)} <span class="ru">of ${dec(src[1]/d)} ${pu}</span>`;
    $('r-wins2').textContent = 'now closing with the lift';
  } else {
    $('r-wins-l').textContent = 'Additional wins';
    $('r-wins').textContent = (addY >= 0 ? '+' : '') + dec(addY/d);
    $('r-wins2').textContent = (per === 'm' ? 'per month' : 'per year') + (team && nr > 1 ? ` · +${dec(addY/d/nr)} per rep` : '');
  }
  $('pm-s3').textContent = cr && pts ? `${(addY/d >= 0 ? '+' : '') + dec(addY/d)} deals ${pu}` : '—';
  $('pm-x3').textContent = cr && pts ? `+${money(addRevY/d)} · ${pct(cr)} → ${pct(cr2)}` : 'No lift entered yet';
  $('scen-print').textContent = `Value per point: ${scenName(scen)}, ${(scen*100).toFixed(1)}%.`;
  $('cmp-per').textContent = per === 'm' ? 'per month' : 'per year';
  // prepared line (fixed)
  const today = new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
  $('prep').textContent = `Prepared by Pipeline Conversions  ·  ${today}`;
  $('opps').innerHTML = [...R.rows, ...Q.rows].filter(r => r.gap).sort((a,b) => b.gap-a.gap || a.now-b.now).slice(0,3).map(r => `<div><span>${r.n}<em>${r.now} → ${r.df} of 10</em></span><b>+${r.gap} pts<small>+${+(r.gap*scen*100).toFixed(1)}% lift</small></b></div>`).join('') || '<div><span>No lift entered yet.</span></div>';
}

const fields = () => [...document.querySelectorAll('input,select')].filter(x => x.id);
function save(){
  try {
    const v = {};
    fields().forEach(x => { if (x.id === 'inv' && !invTouched) return; const def = x.type === 'hidden' ? '' : x.tagName === 'SELECT' ? x.options[0].value : x.defaultValue; if (x.value !== def || x.id === 'inv') v[x.id] = x.value; });
    localStorage.setItem('pipeline-original-assessment-v1', '#s=' + encodeURIComponent(JSON.stringify({v, t:team?1:0, lk:locked?1:0, p:per, c:scen, st:step})));
  } catch {}
}
let invTouched = false;
function setTeam(on){
  team = on;
  if (!invTouched) $('inv').value = on ? '997' : '297';
  document.querySelectorAll('.toggle button').forEach(x => x.setAttribute('aria-pressed', (x.dataset.type === 'team') === on));
  document.body.classList.toggle('is-team', on);
  $('type-note').textContent = on ? "Use your team's numbers. Totals are calculated across all reps." : 'Use your own numbers as one presenter.';
}
function setLock(on){
  locked = on;
  document.querySelectorAll('.toggle button').forEach(x => {
    x.disabled = on && x.getAttribute('aria-pressed') !== 'true';
    x.setAttribute('aria-disabled', String(x.disabled));
    x.toggleAttribute('data-muted', on && x.getAttribute('aria-pressed') !== 'true');
  });
  $('b-chg').hidden = !on;
}
function setPer(p){ per = p; document.querySelectorAll('[data-per]').forEach(x => x.setAttribute('aria-pressed', x.dataset.per === per)); }
function setScen(v){ scen = v; document.querySelectorAll('[data-s]').forEach(x => x.setAttribute('aria-pressed', +x.dataset.s === v)); }
function restore(){
  let st = null;
  try {
    if (!location.hash && !localStorage.getItem('pipeline-original-assessment-v1')) {
      const old = JSON.parse(localStorage.getItem('pipeline-discovery-assessment-v1'));
      if (old && old.presentations) {
        const v = {ppw:old.presentations,aov:old.offerValue,cr:old.closeRate,think:old.think,no:old.no,wks:old.weeks || '48',cyc:old.cycle || '', 'cyc-u':old.cycleUnit || 'Days'};
        st = {v,t:old.type==='Sales Team'?1:0,lk:1,p:'m',c:0.015,st:0};
      }
    }
  } catch {}
  // Import old assessment links without keeping their data in the address bar.
  try {
    const saved = location.hash || localStorage.getItem('pipeline-original-assessment-v1') || '';
    const m = saved.match(/^#s=(.+)$/);
    if (m) st = JSON.parse(decodeURIComponent(m[1]));
  } catch {}
  if (location.hash.startsWith('#s=')) {
    try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  }
  if (st && st.v){
    delete st.v.pfor; delete st.v.pby;
    for (const id in st.v){ const el = $(id); if (el) el.value = st.v[id]; }
    invTouched = st.v.inv !== undefined;
    setTeam(!!st.t); setPer(st.p || 'm'); setScen(st.c && st.c <= 0.05 ? st.c : 0.015);
    setLock(!!st.lk || BASE.some(k => k !== 'wks' && k !== 'cyc-u' && st.v[k] !== undefined && st.v[k] !== ''));
    return st.st || 0;
  }
  if (new URLSearchParams(location.search).has('demo')){ for (const id in DEMO) $(id).value = DEMO[id]; setLock(true); }
  return 0;
}
function resetAll(){
  try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  fields().forEach(x => { x.value = x.type === 'hidden' ? '' : x.tagName === 'SELECT' ? x.options[0].value : x.defaultValue; });
  gi.r = 0; gi.p = 0; invTouched = false;
  touched.clear(); showAll = false;
  setTeam(false); setLock(false); setPer('m'); setScen(0.015);
  update(); go(0);
}

function go(i){
  if (i > 0 && !validate()){ showAll = true; update(); return; }
  if ((i >= 2 && !lastR.done) || (i >= 3 && !lastQ.done)) return;
  step = i;
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', +p.dataset.panel === i));
  document.querySelectorAll('.steps .step').forEach((s, k) => { s.classList.toggle('active', k === i); s.classList.toggle('done', k < i); s.toggleAttribute('aria-current', k === i); });
  document.querySelectorAll('.nav .sub button').forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); s.toggleAttribute('aria-current', k === i); if (k === i) s.setAttribute('aria-current', 'step'); s.querySelector('.vh').textContent = k < i ? ' (completed)' : ''; });
  window.scrollTo({top:0, behavior:'smooth'});
  save();
}

// Enter commits an entry without interrupting multi-digit typing.
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.isComposing || e.target.tagName !== 'INPUT' || e.target.type === 'hidden') return;
  const panel = e.target.closest('.panel.on');
  if (!panel) return;
  e.preventDefault();
  touched.add(e.target.id);
  update();
  const field = e.target.closest('[data-f]');
  if (!e.target.value.trim() || field?.classList.contains('err')) return;
  const entries = [...panel.querySelectorAll('input:not([type="hidden"]),select')]
    .filter(x => !x.disabled && x.getClientRects().length);
  const next = entries[entries.indexOf(e.target) + 1];
  (next || panel.querySelector('.cta:not(:disabled)'))?.focus();
  if (next?.tagName === 'INPUT') next.select();
});
document.addEventListener('change', e => {
  if (e.target.id === 'cyc-u' && document.activeElement === e.target) $('think').focus();
});

document.addEventListener('input', () => { update(); save(); });
document.addEventListener('change', e => { if (e.target.tagName === 'SELECT'){ update(); save(); } });
document.addEventListener('focusout', e => { const id = e.target.id; if (rules[id] || id === 'think' || id === 'no'){ touched.add(id); update(); } });
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g && !g.disabled) go(+g.dataset.go);
  const p = e.target.closest('[data-per]');
  if (p){ setPer(p.dataset.per); update(); save(); }
  const rb = e.target.closest('[data-r]');
  if (rb && !rb.disabled){
    setRate(rb.dataset.r, rb.dataset.v);
    update(); save();
  }
  const gt = e.target.closest('[data-gt]');
  if (gt){ const [k, j] = gt.dataset.gt.split(':'); gi[k] = +j; renderGuided(k); if (gt.classList.contains('sumrow')) $(`gv-${k}`).scrollIntoView({behavior:'smooth', block:'start'}); }
  const gn = e.target.closest('[data-gn]');
  if (gn && !gn.disabled){ const [k, d] = gn.dataset.gn.split(':'); gi[k] = Math.min(4, Math.max(0, gi[k] + +d)); renderGuided(k); }

  const s = e.target.closest('[data-s]');
  if (s){ setScen(+s.dataset.s); update(); save(); }
});
$('aov').addEventListener('blur', e => { const v = num(e.target.value); if (v !== null) e.target.value = Math.round(v).toLocaleString('en-US'); });
$('inv').addEventListener('input', () => { invTouched = true; }, true);
$('inv').addEventListener('blur', e => { const v = num(e.target.value); if (v !== null) e.target.value = Math.round(v).toLocaleString('en-US'); });
document.querySelectorAll('.toggle button').forEach(b => b.addEventListener('click', () => {
  const nextTeam = b.dataset.type === 'team';
  if (locked || b.disabled) return;
  setTeam(nextTeam); setLock(true); update(); save();
}));
// typing a Baseline number also confirms the current type
document.addEventListener('input', e => { if (!locked && e.target.closest('[data-panel="0"] .card.form')){ setLock(true); save(); } }, true);
const dlg = $('dlg-type');
$('b-chg').addEventListener('click', () => { dlg.showModal(); $('dlg-no').focus(); });
$('dlg-no').addEventListener('click', () => dlg.close());
$('dlg-ok').addEventListener('click', () => {
  dlg.close();
  BASE.forEach(id => { const x = $(id); if (x) x.value = x.tagName === 'SELECT' ? x.options[0].value : x.defaultValue; touched.delete(id); });
  showAll = false;
  setTeam(!team); setLock(true); update(); save();
  document.querySelector('.toggle button[aria-pressed="true"]').focus();
});
let resetArmed = null;
$('b-reset').addEventListener('click', () => {
  const lbl = $('b-reset').querySelector('span');
  if (resetArmed){ clearTimeout(resetArmed); resetArmed = null; lbl.textContent = 'Start over'; resetAll(); return; }
  lbl.textContent = 'Click again to clear';
  resetArmed = setTimeout(() => { resetArmed = null; lbl.textContent = 'Start over'; }, 3000);
});
$('b-present').addEventListener('click', () => {
  const on = document.body.classList.toggle('present');
  $('b-present').lastChild.textContent = on ? 'Exit Presentation' : 'Presentation Mode'; $('b-present').setAttribute('aria-label', on ? 'Exit Presentation' : 'Presentation Mode');
});
$('b-share').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.origin + location.pathname); $('b-share').querySelector('span').textContent = 'Link copied'; }
  catch { $('b-share').querySelector('span').textContent = 'Copy the page link'; }
  setTimeout(() => $('b-share').querySelector('span').textContent = 'Share', 2200);
});

$('b-print').addEventListener('click', () => window.print());
$('aov').addEventListener('input', e => {
  const input = e.target;
  const significant = input.value.slice(0,input.selectionStart).replaceAll(',', '').length;
  const [whole, fraction] = input.value.replaceAll(',', '').split('.');
  input.value = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction !== undefined ? '.' + fraction : '');
  let position=0, count=0;
  while(position<input.value.length && count<significant){if(input.value[position]!==',')count++;position++;}
  input.setSelectionRange(position,position);
});

const startStep = restore();
update();
if (startStep && validate()) go(startStep);


(() => {
  const b = document.getElementById('b-menu'), s = document.getElementById('side'), sc = document.getElementById('scrim');
  if (!b || !s) return;
  const set = on => { document.body.classList.toggle('nav-open', on); b.setAttribute('aria-expanded', on); b.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); };
  b.addEventListener('click', () => set(!document.body.classList.contains('nav-open')));
  sc.addEventListener('click', () => set(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  s.addEventListener('click', e => { if (e.target.closest('.sub button')) set(false); });
})();

  return () => {
    controller.abort();
    timers.forEach(id => window.clearTimeout(id));
    document.body.classList.remove('nav-open','is-team','present');
  };
}
