/* ============================================================
   Pages of the private dashboard: sign-in and the dashboard itself.

   Design rules (after "fix the slop dashboard" principles):
   - one type scale and one card style (frosted glass over a dusk
     "studio" wallpaper drawn in CSS, with a waveform horizon)
   - hierarchy in the order things happen: the result (net profit and
     what it's made of), then the funnel that produced it, then what
     needs attention; detail is folded into accordions
   - every group has a label and an icon
   - one primary action (pull from Meta) whose hover feels like a win
   - ⌘K opens quick actions: ranges, views, actions, customers
   ============================================================ */

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// a faint audio waveform along the bottom of the wallpaper
const WAVE = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="260" viewBox="0 0 1600 260" fill="none">` +
  [0, 1, 2, 3].map((i) => {
    const amp = 46 - i * 9, y = 150 + i * 18, f = 0.006 + i * 0.0025;
    let d = `M0 ${y}`;
    for (let x = 0; x <= 1600; x += 20) d += ` L${x} ${(y + Math.sin(x * f + i) * amp * Math.sin(x / 1600 * Math.PI)).toFixed(1)}`;
    return `<path d="${d}" stroke="white" stroke-opacity="${(0.10 - i * 0.02).toFixed(2)}" stroke-width="1.5"/>`;
  }).join('') + `</svg>`);

const ICON = {
  logo: '<path d="M4 15V9M8 18V6M12 21V3M16 18V6M20 15V9"/>',
  profit: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  funnel: '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M17 3.5a4 4 0 0 1 0 9M22 21a6 6 0 0 0-4-5.6"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 8a5 5 0 0 1 0 8"/>',
  device: '<rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="M6 18h6"/><rect x="17" y="9" width="5" height="11" rx="1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  chevron: '<path d="M15 6l-6 6 6 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  live: '<circle cx="12" cy="12" r="2.5"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
};
const icon = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

/* ---------- shared look ---------- */
const STYLE = `
/* layout: a frosted "window" floating over a dusk studio wallpaper; inside, a 12-column grid read in the order things happen */
:root{
  --ink:#f6efe9; --ink-2:rgba(246,239,233,.72); --ink-3:rgba(246,239,233,.5);
  --glass:rgba(28,20,24,.52); --glass-2:rgba(255,255,255,.06); --line:rgba(255,255,255,.09); --line-2:rgba(255,255,255,.16);
  --amber:#f5b46a; --violet:#9c8cff; --mint:#7fe0ab; --coral:#ff7a6b;
  --c0:var(--amber); --c1:var(--violet); --c2:var(--mint);
  --t-xs:11px; --t-sm:13px; --t-md:15px; --t-lg:19px; --t-xl:30px; --t-2xl:52px;
  --r:16px; --r-sm:10px;
  --font:-apple-system,BlinkMacSystemFont,"SF Hebrew","Segoe UI",Heebo,Arial,sans-serif;
  color-scheme:dark;
}
*{box-sizing:border-box}
[hidden]{display:none!important}
html{height:100%}
body{margin:0;min-height:100%;color:var(--ink);font:var(--t-md)/1.5 var(--font);
  background-color:#140e10;
  background-image:url("${WAVE}"),
    radial-gradient(1100px 620px at 88% -8%,rgba(255,146,72,.55),transparent 62%),
    radial-gradient(900px 640px at 6% 108%,rgba(132,70,210,.42),transparent 60%),
    radial-gradient(760px 420px at 52% 72%,rgba(226,96,70,.22),transparent 70%),
    linear-gradient(180deg,#2b1814 0%,#160f13 55%,#0f0b12 100%);
  background-repeat:no-repeat;background-size:100% 260px,auto,auto,auto,auto;background-position:bottom center,0 0,0 0,0 0,0 0;background-attachment:fixed}
button,input,select{font:inherit;color:inherit}
:focus-visible{outline:2px solid var(--amber);outline-offset:2px;border-radius:6px}
.ic{width:16px;height:16px;flex:none}
.glass{background:var(--glass);border:1px solid var(--line);border-radius:var(--r);
  -webkit-backdrop-filter:blur(26px) saturate(150%);backdrop-filter:blur(26px) saturate(150%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 24px 48px -24px rgba(0,0,0,.55)}
.num{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}
`;

/* ---------- sign-in page ---------- */
export function loginPage({ base, nonce, error }) {
  const msg = error === 'locked' ? 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.'
    : error === 'wrong' ? 'הסיסמה לא נכונה.' : '';
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>כניסה</title><style nonce="${nonce}">${STYLE}
main{min-height:100vh;display:grid;place-items:center;padding:16px}
form{width:100%;max-width:340px;display:flex;flex-direction:column;gap:14px;padding:28px}
.brand{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:.08em;font-size:var(--t-sm)}
.brand .ic{width:22px;height:22px;color:var(--amber)}
h1{margin:4px 0 0;font-size:var(--t-lg);font-weight:600}
label{display:flex;flex-direction:column;gap:6px;color:var(--ink-2);font-size:var(--t-sm)}
input{padding:11px 12px;border-radius:var(--r-sm);border:1px solid var(--line-2);background:rgba(0,0,0,.25);direction:ltr}
button{padding:11px 12px;border-radius:var(--r-sm);border:0;background:var(--ink);color:#1a1214;cursor:pointer;font-weight:600}
.err{margin:0;color:var(--coral);font-size:var(--t-sm)}
</style></head><body><main>
<form class="glass" method="post" action="${esc(base)}/login" autocomplete="on">
  <div class="brand">${icon('logo')}EVOXEL SOUNDS</div>
  <h1>כניסה לדשבורד</h1>
  <label for="pw">סיסמה<input id="pw" name="password" type="password" autocomplete="current-password" required autofocus maxlength="200"></label>
  ${msg ? `<p class="err" role="alert">${msg}</p>` : ''}
  <button type="submit">כניסה</button>
</form></main></body></html>`;
}

/* ---------- dashboard page ---------- */
export function dashboardPage({ base, nonce }) {
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow">
<title>Evoxel · דשבורד</title><style nonce="${nonce}">${STYLE}
.window{max-width:1200px;margin:28px auto;padding:0 0 24px;border-radius:22px}
@media (max-width:720px){.window{margin:0;border-radius:0;border-inline:0}}
.wrap{padding:0 max(18px,env(safe-area-inset-right)) 0 max(18px,env(safe-area-inset-left))}

/* top bar */
.bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:9px;font-weight:600;letter-spacing:.08em;font-size:var(--t-sm);margin-inline-end:auto}
.brand .ic{width:20px;height:20px;color:var(--amber)}
.brand small{font-weight:400;letter-spacing:0;color:var(--ink-3)}
.seg{display:flex;background:rgba(0,0,0,.22);border:1px solid var(--line);border-radius:999px;padding:3px}
.seg button{border:0;background:none;color:var(--ink-2);padding:5px 11px;border-radius:999px;cursor:pointer;font-size:var(--t-sm);white-space:nowrap}
.seg button[aria-pressed=true]{background:var(--glass-2);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line-2)}
.kbd{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:rgba(0,0,0,.22);border-radius:999px;padding:6px 10px;color:var(--ink-3);cursor:pointer;font-size:var(--t-sm)}
.kbd kbd{font:inherit;font-size:var(--t-xs);border:1px solid var(--line-2);border-radius:5px;padding:0 5px;color:var(--ink-2)}
.iconbtn{display:grid;place-items:center;width:34px;height:34px;border-radius:999px;border:1px solid var(--line);background:rgba(0,0,0,.22);color:var(--ink-2);cursor:pointer}
.iconbtn:hover,.kbd:hover{color:var(--ink);border-color:var(--line-2)}
@media (max-width:640px){.kbd span,.kbd kbd{display:none}.cta{min-width:0;flex:1}}
.iconbtn[aria-pressed=true]{color:var(--ink);background:var(--glass-2)}

/* primary action: on hover the label turns into a win and the arrows keep turning */
.cta{position:relative;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:8px 16px;background:var(--ink);color:#1a1214;font-weight:600;font-size:var(--t-sm);cursor:pointer;min-width:178px;justify-content:center}
.cta .hov{display:none}
.cta:hover .def,.cta:focus-visible .def{display:none}
.cta:hover .hov,.cta:focus-visible .hov{display:inline}
.cta[data-state=busy] .def,.cta[data-state=busy] .hov,.cta[data-state=done] .def,.cta[data-state=done] .hov{display:none}
.cta .busy,.cta .done{display:none}
.cta[data-state=busy] .busy,.cta[data-state=done] .done{display:inline}
.cta[disabled]{cursor:default;opacity:.85}
@media (prefers-reduced-motion:no-preference){
  .cta:hover .ic,.cta[data-state=busy] .ic{animation:spin 1.1s cubic-bezier(.5,0,.3,1) infinite}
  .cta{transition:transform .15s ease,box-shadow .2s ease}
  .cta:hover{transform:translateY(-1px);box-shadow:0 8px 24px -8px rgba(245,180,106,.6)}
}
@keyframes spin{to{transform:rotate(-360deg)}}

.settings{display:flex;flex-wrap:wrap;gap:14px;align-items:end;padding:12px 18px;border-bottom:1px solid var(--line);background:rgba(0,0,0,.12)}
.field{display:flex;flex-direction:column;gap:4px;font-size:var(--t-xs);color:var(--ink-3)}
.in{padding:6px 9px;border-radius:8px;border:1px solid var(--line-2);background:rgba(0,0,0,.25);font-size:var(--t-sm);font-variant-numeric:tabular-nums}
.in[type=number]{width:5.5em}

/* headline */
.head{padding:22px 0 6px}
.head h1{margin:0;font-size:var(--t-xl);font-weight:600;letter-spacing:-.01em;text-wrap:balance}
.lede{margin:6px 0 0;color:var(--ink-2);max-width:72ch}
.lede b{color:var(--ink);font-weight:600}
.sync{margin:6px 0 0;font-size:var(--t-xs);color:var(--ink-3)}
.sync.err{color:var(--coral)}

/* grid and the one card style */
.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px;margin-top:16px}
.card{grid-column:span 12;padding:18px;display:flex;flex-direction:column;gap:12px;min-width:0}
.span5{grid-column:span 5}.span4{grid-column:span 4}.span3{grid-column:span 3}
@media (max-width:1000px){.span5,.span4{grid-column:span 6}.span3{grid-column:span 12}}
@media (max-width:640px){.span5,.span4,.span3{grid-column:span 12}}
.label{display:flex;align-items:center;gap:7px;font-size:var(--t-xs);letter-spacing:.06em;color:var(--ink-3)}
.label .ic{width:14px;height:14px}
.label .end{margin-inline-start:auto}

/* result: net profit and what it's made of */
.hero{font-size:var(--t-2xl);font-weight:600;line-height:1;letter-spacing:-.02em}
.hero.pos{color:var(--mint)}.hero.neg{color:var(--coral)}
.delta{font-size:var(--t-sm);color:var(--ink-3)}
.delta b{font-weight:600}.delta .up{color:var(--mint)}.delta .down{color:var(--coral)}
.eq{display:flex;flex-direction:column;gap:2px;margin-top:4px;border-top:1px solid var(--line);padding-top:10px}
.eq div{display:flex;justify-content:space-between;align-items:baseline;font-size:var(--t-sm);color:var(--ink-2);padding:3px 0}
.eq div span:last-child{color:var(--ink);font-weight:500}
.eq .sum{border-top:1px dashed var(--line-2);margin-top:4px;padding-top:7px;color:var(--ink)}
.dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-inline-end:7px;vertical-align:0}

/* funnel */
.steps{display:flex;flex-direction:column;gap:9px}
.step{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:baseline}
.step .n{font-size:var(--t-lg);font-weight:600}
.step .k{font-size:var(--t-sm);color:var(--ink-2)}
.step .bar2{grid-column:1/-1;height:6px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;direction:rtl}
.step .bar2 i{display:block;height:100%;border-radius:999px;background:var(--amber)}
.step .rate{grid-column:1/-1;font-size:var(--t-xs);color:var(--ink-3)}
.split{display:flex;height:6px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.07);direction:ltr}
.split span{display:block;height:100%}
.splitlg{display:flex;justify-content:space-between;font-size:var(--t-xs);color:var(--ink-3)}
.splitlg b{color:var(--ink);font-weight:600}

/* needs attention */
.todo{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.todo li{display:flex;gap:9px;align-items:flex-start;font-size:var(--t-sm);color:var(--ink-2);line-height:1.45}
.todo li::before{content:"";flex:none;width:14px;height:14px;margin-top:2px;border-radius:999px;border:1.5px solid var(--ink-3)}
.todo li.warn::before{border-color:var(--amber);background:rgba(245,180,106,.18)}
.todo li.bad::before{border-color:var(--coral);background:rgba(255,122,107,.18)}
.todo li.ok::before{border-color:var(--mint);background:rgba(127,224,171,.18)}
.todo li b{color:var(--ink);font-weight:600}

/* chart */
.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:var(--t-xs);color:var(--ink-3)}
.legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-inline-end:6px;vertical-align:-1px}
.chart{position:relative;min-height:240px;direction:ltr}
.chart svg{display:block;width:100%;height:auto}
.chart text{fill:var(--ink-3);font-size:var(--t-xs);font-family:var(--font)}
.tip{position:absolute;top:6px;pointer-events:none;background:rgba(20,14,18,.92);border:1px solid var(--line-2);border-radius:10px;padding:8px 10px;font-size:var(--t-xs);white-space:nowrap;direction:rtl;font-variant-numeric:tabular-nums;box-shadow:0 12px 24px rgba(0,0,0,.4)}
.tip b{display:block;margin-bottom:2px;color:var(--ink)}
.empty{margin:0;padding:10px 0;color:var(--ink-3);font-size:var(--t-sm)}

/* folded detail */
.folds{display:flex;flex-direction:column;gap:10px;margin-top:14px}
details.glass>summary{list-style:none;display:flex;align-items:center;gap:10px;padding:13px 18px;cursor:pointer;font-size:var(--t-sm);font-weight:600}
details.glass>summary::-webkit-details-marker{display:none}
details.glass>summary .ic.chev{margin-inline-start:auto;transition:transform .2s ease;color:var(--ink-3)}
details.glass[open]>summary .ic.chev{transform:rotate(-90deg)}
details.glass>summary small{font-weight:400;color:var(--ink-3)}
.fold{padding:0 18px 16px}
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:var(--t-sm)}
th{text-align:right;font-size:var(--t-xs);color:var(--ink-3);font-weight:500;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;letter-spacing:.04em}
td{padding:10px;border-bottom:1px solid var(--line);white-space:nowrap;color:var(--ink-2)}
td:first-child{color:var(--ink)}
td.n{direction:ltr;text-align:right}
.st{font-size:var(--t-xs);padding:2px 8px;border-radius:999px;background:var(--glass-2)}
.st.paid{color:var(--mint)}.st.refunded,.st.reversed,.st.partially_refunded{color:var(--coral)}
.notes{margin:0;padding-inline-start:1.1em;color:var(--ink-2);font-size:var(--t-sm);line-height:1.65}
body.loading [data-k]{opacity:.45}

/* live now */
.live{margin-top:16px;padding:16px 18px;display:grid;grid-template-columns:auto 1fr;gap:6px 22px;align-items:center}
@media (max-width:640px){.live{grid-template-columns:1fr}}
.live-n{display:flex;align-items:center;gap:12px}
.live-n .count{font-size:var(--t-xl);font-weight:600;line-height:1}
.live-n .k{font-size:var(--t-sm);color:var(--ink-2);line-height:1.3}
.pulse{position:relative;width:10px;height:10px;border-radius:999px;background:var(--ink-3);flex:none}
.pulse.on{background:var(--mint)}
@media (prefers-reduced-motion:no-preference){.pulse.on::after{content:"";position:absolute;inset:-5px;border-radius:999px;border:2px solid var(--mint);opacity:0;animation:ping 2s ease-out infinite}}
@keyframes ping{0%{transform:scale(.4);opacity:.8}100%{transform:scale(1.4);opacity:0}}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-xs);color:var(--ink-2);background:var(--glass-2);border:1px solid var(--line);border-radius:999px;padding:3px 9px}
.chip b{color:var(--ink);font-weight:600}
.chip.hot{border-color:rgba(245,180,106,.5);color:var(--amber)}
.live-quiet{font-size:var(--t-sm);color:var(--ink-3)}

/* ⌘K palette */
.scrim{position:fixed;inset:0;background:rgba(8,5,8,.45);display:grid;align-items:start;justify-items:center;padding:12vh 16px 16px;z-index:20}
.palette{width:100%;max-width:560px;overflow:hidden}
.palette .q{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}
.palette .q input{flex:1;border:0;background:none;outline:none;font-size:var(--t-md)}
.palette ul{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}
.palette li.grp{padding:8px 10px 4px;font-size:var(--t-xs);color:var(--ink-3);letter-spacing:.06em}
.palette li.it{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;font-size:var(--t-sm);color:var(--ink-2)}
.palette li.it small{margin-inline-start:auto;color:var(--ink-3)}
.palette li.it[aria-selected=true]{background:var(--glass-2);color:var(--ink)}
.palette .none{padding:16px;color:var(--ink-3);font-size:var(--t-sm)}
</style></head><body class="loading">
<div class="window glass">
  <header class="bar">
    <div class="brand">${icon('logo')}EVOXEL SOUNDS <small>· דשבורד</small></div>
    <div class="seg" role="group" aria-label="טווח">
      <button type="button" data-preset="7">7 ימים</button>
      <button type="button" data-preset="28">28 ימים</button>
      <button type="button" data-preset="month">החודש</button>
      <button type="button" data-preset="90">90 ימים</button>
      <button type="button" data-preset="365">שנה</button>
    </div>
    <button class="iconbtn" type="button" id="toggle-settings" aria-pressed="false" aria-label="טווח מותאם ושער דולר" title="טווח מותאם ושער דולר">${icon('sliders')}</button>
    <button class="kbd" type="button" id="open-palette" aria-label="פעולות מהירות">${icon('search')}<span>חיפוש</span><kbd>⌘K</kbd></button>
    <button class="cta" type="button" id="refresh" hidden>${icon('sync')}<span class="def">רענון ממטא</span><span class="hov">בוא נראה כמה הרווחנו</span><span class="busy">מושך נתונים…</span><span class="done">עודכן</span></button>
    <form method="post" action="${esc(base)}/logout"><button class="iconbtn" type="submit" aria-label="יציאה" title="יציאה">${icon('logout')}</button></form>
  </header>
  <div class="settings" id="settings" hidden>
    <label class="field">מתאריך<input class="in" type="date" id="from"></label>
    <label class="field">עד תאריך<input class="in" type="date" id="to"></label>
    <label class="field">שער דולר (₪)<input class="in" type="number" id="rate" min="1" max="10" step="0.01"></label>
  </div>

  <div class="wrap">
    <section class="head">
      <h1 id="title">כמה נשאר לך בכיס</h1>
      <p class="lede" id="lede">טוען נתונים…</p>
      <p class="sync" id="sync" hidden></p>
    </section>

    <section class="live glass" id="live" aria-live="polite">
      <div class="live-n"><span class="pulse" id="live-pulse"></span><span class="count num" id="live-count">—</span><span class="k">עכשיו<br>באתר</span></div>
      <div>
        <div class="chips" id="live-chips"></div>
        <p class="live-quiet" id="live-quiet" hidden>אין כרגע אף אחד באתר. ברגע שמישהו ייכנס, הוא יופיע כאן תוך דקה.</p>
      </div>
    </section>

    <section class="grid">
      <article class="card glass span5" id="result">
        <div class="label">${icon('profit')}רווח נקי<span class="end" id="range-label"></span></div>
        <div class="hero num" data-k="profit_ils" data-sign="1">—</div>
        <div class="delta" id="profit-delta"></div>
        <div class="eq">
          <div><span><i class="dot" data-c="0"></i>הכנסות</span><span class="num" data-k="revenue_ils">—</span></div>
          <div><span><i class="dot" data-c="3"></i>עמלות PayPal</span><span class="num" data-k="fees_neg">—</span></div>
          <div><span><i class="dot" data-c="1"></i>מודעות</span><span class="num" data-k="spend_neg">—</span></div>
          <div class="sum"><span>נשאר</span><span class="num" data-k="profit_ils">—</span></div>
        </div>
      </article>

      <article class="card glass span4" id="funnel">
        <div class="label">${icon('funnel')}מהצפייה לתשלום<span class="end">ROAS <b class="num" data-k="roas">—</b></span></div>
        <div class="steps">
          <div class="step"><span class="k">צפיות בעמודים</span><span class="n num" data-k="visits">—</span><span class="bar2"><i data-w="visits"></i></span></div>
          <div class="step"><span class="k">התחילו הזמנה</span><span class="n num" data-k="started">—</span><span class="bar2"><i data-w="started"></i></span><span class="rate" id="rate-started"></span></div>
          <div class="step"><span class="k">שילמו</span><span class="n num" data-k="orders">—</span><span class="bar2"><i data-w="orders"></i></span><span class="rate" id="rate-paid"></span></div>
        </div>
        <div class="split" id="split"></div>
        <div class="splitlg"><span><i class="dot" data-c="0"></i>דסקטופ <b class="num" data-k="desktop">—</b></span><span><i class="dot" data-c="1"></i>מובייל <b class="num" data-k="mobile">—</b></span></div>
      </article>

      <article class="card glass span3" id="attention">
        <div class="label">${icon('bell')}לטיפול<span class="end num" id="todo-count"></span></div>
        <ul class="todo" id="todo"></ul>
      </article>

      <article class="card glass" id="over-time">
        <div class="label">${icon('chart')}כסף לאורך זמן
          <span class="end"><select class="in" id="grain" aria-label="חלוקה לפי"><option value="day">לפי יום</option><option value="week">לפי שבוע</option><option value="month">לפי חודש</option><option value="2month">לפי חודשיים</option></select></span></div>
        <div class="legend"><span><i data-c="0"></i>הכנסות</span><span><i data-c="1"></i>מודעות</span><span><i data-c="2"></i>רווח</span></div>
        <div class="chart" id="money"></div>
      </article>
    </section>

    <section class="folds">
      <details class="glass" id="customers">
        <summary>${icon('users')}לקוחות ושירותים <small id="customers-count"></small>${icon('chevron', 'ic chev')}</summary>
        <div class="fold"><div class="tw"><table><thead><tr><th>תאריך</th><th>אמן</th><th>טרק</th><th>שירות</th><th>תוספות</th><th>סכום</th><th>עמלה</th><th>סטטוס</th><th>הזמנה</th></tr></thead><tbody id="rows"></tbody></table></div>
        <p class="empty" id="rows-empty" hidden>אין עדיין הזמנות ששולמו בתקופה הזו. כל הזמנה שתשולם באתר תופיע כאן עם שם האמן והשירות.</p></div>
      </details>
      <details class="glass" id="campaigns">
        <summary>${icon('megaphone')}קמפיינים במטא <small id="campaigns-count"></small>${icon('chevron', 'ic chev')}</summary>
        <div class="fold"><div class="tw"><table><thead><tr><th>קמפיין</th><th>הוצאה</th><th>חשיפות</th><th>קליקים</th><th>עלות לקליק</th></tr></thead><tbody id="camp-rows"></tbody></table></div>
        <p class="empty" id="camp-empty" hidden>אין הוצאה על מודעות בתקופה הזו.</p></div>
      </details>
      <details class="glass" id="devices">
        <summary>${icon('device')}מבקרים לאורך זמן <small>דסקטופ ומובייל</small>${icon('chevron', 'ic chev')}</summary>
        <div class="fold"><div class="legend"><span><i data-c="0"></i>דסקטופ</span><span><i data-c="1"></i>מובייל</span></div><div class="chart" id="visitsChart"></div></div>
      </details>
      <details class="glass" id="how">
        <summary>${icon('info')}איך המספרים מחושבים${icon('chevron', 'ic chev')}</summary>
        <div class="fold"><ul class="notes">
          <li>הכנסות: הזמנות בסטטוס "שולם", לפי תאריך התשלום. האתר גובה בדולרים, והסכום מומר לשקלים לפי השער שבהגדרות (כפתור הסליידרים למעלה).</li>
          <li>עמלות PayPal: מה ש־PayPal גבתה בכל תשלום, כמו שהיא מדווחת. נשמרות מהתשלומים מכאן והלאה.</li>
          <li>מודעות: חשבון Evoxel Music במטא, רק קמפיינים שבשם שלהם מופיע "Site". מתעדכן כל 3 שעות, או מיד בכפתור הרענון.</li>
          <li>רווח נקי: הכנסות פחות עמלות PayPal פחות מודעות. ROAS: הכנסות חלקי מודעות.</li>
          <li>צפיות בעמודים: אירועי PageView מה־Pixel לפי יום (UTC). אלה צפיות ולא מבקרים ייחודיים, והן נספרות רק אצל מי שאישר עוגיות.</li>
          <li>התחילו הזמנה: הזמנות שנפתחו באתר בתקופה, ששולמו או לא. השוואה: מול תקופה באותו אורך שקדמה לה.</li>
        </ul></div>
      </details>
    </section>
  </div>
</div>

<div class="scrim" id="scrim" hidden>
  <div class="palette glass" role="dialog" aria-modal="true" aria-label="פעולות מהירות">
    <div class="q">${icon('search')}<input id="pq" type="text" placeholder="חפש פעולה, טווח או לקוח…" autocomplete="off" aria-controls="plist"></div>
    <ul id="plist" role="listbox"></ul>
  </div>
</div>

<script nonce="${nonce}">
(() => {
  const BASE = ${JSON.stringify(base)};
  const DAY = 86400000;
  const iso = (d) => d.toISOString().slice(0, 10);
  const now0 = new Date();
  const today = new Date(Date.UTC(now0.getFullYear(), now0.getMonth(), now0.getDate()));   // the viewer's own calendar day
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem('evx.' + k); } catch { return null; } }, set(k, v) { try { localStorage.setItem('evx.' + k, v); } catch {} } };
  const css = getComputedStyle(document.documentElement);
  const COLORS = [css.getPropertyValue('--amber').trim(), css.getPropertyValue('--violet').trim(), css.getPropertyValue('--mint').trim(), css.getPropertyValue('--coral').trim()];
  const color = (i) => COLORS[i];
  $$('[data-c]').forEach((e) => { e.style.background = color(Number(e.dataset.c)); });

  const state = { from: iso(new Date(today - 27 * DAY)), to: iso(today), grain: store.get('grain') || 'day', rate: Number(store.get('rate')) || null, data: null, prev: null };
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const fmt = {
    ils: (v) => v == null ? '—' : (v < 0 ? '−' : '') + '₪' + nf.format(Math.abs(v)),
    neg: (v) => v == null ? '—' : (v > 0 ? '−' : '') + '₪' + nf.format(Math.abs(v)),
    usd: (v) => v == null ? '—' : '$' + nf.format(v),
    int: (v) => v == null ? '—' : nf.format(v),
    pct: (v) => v == null ? '—' : (v * 100).toFixed(1) + '%',
    x: (v) => v == null ? '—' : v.toFixed(2) + '×',
  };
  const kfmt = { profit_ils: 'ils', revenue_ils: 'ils', fees_neg: 'neg', spend_neg: 'neg', roas: 'x', visits: 'int', started: 'int', orders: 'int', desktop: 'int', mobile: 'int' };
  const dmy = (s) => s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(2, 4);
  const escH = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PAID = ['paid', 'partially_refunded', 'refunded', 'reversed'];

  function keyOf(s) {
    const d = new Date(s + 'T00:00:00Z');
    if (state.grain === 'week') { d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return iso(d); }
    if (state.grain === 'month') return s.slice(0, 7) + '-01';
    if (state.grain === '2month') { const m = d.getUTCMonth() - (d.getUTCMonth() % 2); return d.getUTCFullYear() + '-' + String(m + 1).padStart(2, '0') + '-01'; }
    return s;
  }

  // works out the series and the totals of one summary over one range
  function build(D, from, to) {
    const rate = state.rate || D.usdIls;
    const buckets = new Map();
    for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) {
      const k = keyOf(iso(new Date(t)));
      if (!buckets.has(k)) buckets.set(k, { period: k, revenue_usd: 0, fees_usd: 0, spend_ils: 0, orders: 0, visits: 0, desktop: 0, mobile: 0 });
    }
    const at = (s) => buckets.get(keyOf(s));
    for (const r of D.adSpend) { const b = at(r.date); if (b) b.spend_ils += r.currency === 'USD' ? r.spend * rate : r.spend; }
    for (const r of D.visits) { const b = at(r.date); if (b) { b.desktop += r.desktop; b.mobile += r.mobile; b.visits += r.total; } }
    for (const o of D.orders) { if (!D.revenueStatuses.includes(o.status)) continue; const b = at(String(o.paid_at).slice(0, 10)); if (b) { b.orders++; b.revenue_usd += o.amount_usd; b.fees_usd += o.fee_usd || 0; } }
    const series = [...buckets.values()].map((b) => ({ ...b, revenue_ils: b.revenue_usd * rate, fees_ils: b.fees_usd * rate, profit_ils: (b.revenue_usd - b.fees_usd) * rate - b.spend_ils }));
    const sum = (f) => series.reduce((a, r) => a + r[f], 0);
    const t = { revenue_ils: sum('revenue_ils'), fees_ils: sum('fees_ils'), spend_ils: sum('spend_ils'), orders: sum('orders'), visits: sum('visits'), desktop: sum('desktop'), mobile: sum('mobile') };
    t.profit_ils = t.revenue_ils - t.fees_ils - t.spend_ils;
    t.fees_neg = t.fees_ils; t.spend_neg = t.spend_ils;
    t.roas = t.spend_ils > 0 ? t.revenue_ils / t.spend_ils : null;
    const f = Object.fromEntries((D.funnel || []).map((r) => [r.status, r.n]));
    t.started = Object.values(f).reduce((a, n) => a + n, 0);
    t.abandoned = (f.reserved || 0) + (f.pending || 0);
    t.waiting = f.payment_pending || 0;
    t.refunds = D.orders.filter((o) => o.status !== 'paid' && PAID.includes(o.status)).length;
    return { series, t };
  }

  function deltaHtml(cur, prev, label) {
    if (prev == null || (!cur && !prev)) return '';
    if (!prev) return '<b class="up">חדש</b> ' + label;
    const ch = (cur - prev) / Math.abs(prev);
    return '<b class="' + (ch >= 0 ? 'up' : 'down') + '">' + (ch >= 0 ? '+' : '−') + Math.abs(ch * 100).toFixed(0) + '%</b> ' + label;
  }

  function render() {
    if (!state.data) return;
    const D = state.data, { series, t } = build(D, state.from, state.to);
    const P = state.prev ? build(state.prev, state.prevFrom, state.prevTo).t : null;
    const adsOn = D.sources.adSpend.connected, visitsOn = D.sources.visits.connected;
    const span = Math.round((Date.parse(state.to) - Date.parse(state.from)) / DAY) + 1;
    const vsLabel = 'מול ' + span + ' הימים שלפני';

    for (const el of $$('[data-k]')) {
      const k = el.dataset.k;
      const off = (!adsOn && ['spend_neg', 'roas'].includes(k)) || (!visitsOn && ['visits', 'desktop', 'mobile'].includes(k));
      el.textContent = off ? '—' : fmt[kfmt[k]](t[k]);
      if (el.dataset.sign) { el.classList.toggle('pos', t[k] > 0); el.classList.toggle('neg', t[k] < 0); }
    }
    $('#range-label').textContent = dmy(state.from) + ' – ' + dmy(state.to);
    $('#profit-delta').innerHTML = P ? deltaHtml(t.profit_ils, P.profit_ils, vsLabel) : '';

    // the sentence under the title says what the numbers say now
    const lede = $('#lede'); lede.replaceChildren();
    const say = (...parts) => parts.forEach((p, i) => { const n = i % 2 ? document.createElement('b') : document.createTextNode(''); n.textContent = p; lede.appendChild(n); });
    if (t.orders > 0) say('נכנסו ', fmt.ils(t.revenue_ils), ' מ־', fmt.int(t.orders) + (t.orders === 1 ? ' הזמנה' : ' הזמנות'), '. אחרי עמלות ומודעות נשארו ', fmt.ils(t.profit_ils), '.');
    else if (adsOn && t.spend_ils > 0) say('עדיין אין מכירות בתקופה הזו. הוצאת ', fmt.ils(t.spend_ils), ' על מודעות, והאתר קיבל ', fmt.int(t.visits), ' צפיות.');
    else say('עדיין אין מכירות בתקופה הזו', '', visitsOn ? '. האתר קיבל ' : '.', visitsOn ? fmt.int(t.visits) + ' צפיות' : '', visitsOn ? '.' : '');

    // funnel bars, each step as a share of the one before
    const top = Math.max(t.visits, t.started, t.orders, 1);
    $$('[data-w]').forEach((i) => { i.style.width = (t[i.dataset.w] / top * 100) + '%'; });
    $('#rate-started').textContent = visitsOn && t.visits ? fmt.pct(t.started / t.visits) + ' מהצפיות' : '';
    $('#rate-paid').textContent = t.started ? fmt.pct(t.orders / t.started) + ' מאלה שהתחילו' : '';
    const split = $('#split'); split.replaceChildren();
    if (visitsOn && t.visits) [['desktop', 0], ['mobile', 1]].forEach(([k, c]) => { const s = document.createElement('span'); s.style.width = t[k] / t.visits * 100 + '%'; s.style.background = color(c); split.appendChild(s); });

    // what needs attention, worst first
    const todo = [];
    for (const [name, s] of [['מודעות', D.sources.adSpend], ['צפיות', D.sources.visits]]) if (s.state === 'error') todo.push(['bad', 'העדכון ממטא נכשל (' + name + '): ' + escH(s.message)]);
    if (D.sources.adSpend.state === 'not_connected') todo.push(['warn', 'מטא עוד לא מחובר, אז מודעות וצפיות חסרות.']);
    if (t.waiting) todo.push(['warn', '<b>' + t.waiting + '</b> תשלומים ממתינים לאישור של PayPal.']);
    if (t.abandoned) todo.push(['warn', '<b>' + t.abandoned + '</b> ' + (t.abandoned === 1 ? 'הזמנה נפתחה ולא שולמה' : 'הזמנות נפתחו ולא שולמו') + '.']);
    if (t.refunds) todo.push(['bad', '<b>' + t.refunds + '</b> החזרים או ביטולים בתקופה.']);
    if (adsOn && t.spend_ils > 0 && !t.orders) todo.push(['warn', 'הוצאת <b>' + fmt.ils(t.spend_ils) + '</b> על מודעות ועדיין אין מכירה.']);
    if (!todo.length) todo.push(['ok', 'הכל שקט. אין משהו שדורש טיפול.']);
    const ul = $('#todo'); ul.replaceChildren();
    for (const [cls, html] of todo) { const li = document.createElement('li'); li.className = cls; li.innerHTML = html; ul.appendChild(li); }
    const open = todo.filter(([c]) => c !== 'ok').length;
    $('#todo-count').textContent = open ? String(open) : '';

    chart($('#money'), series, {
      label: 'הכנסות, מודעות ורווח לפי תקופה',
      bars: [['revenue_ils', 0], ...(adsOn ? [['spend_ils', 1]] : [])], line: 'profit_ils', money: true,
      tip: (d) => [['הכנסות', fmt.ils(d.revenue_ils)], ['עמלות', fmt.ils(d.fees_ils)], ['מודעות', adsOn ? fmt.ils(d.spend_ils) : '—'], ['רווח', fmt.ils(d.profit_ils)], ['הזמנות', fmt.int(d.orders)]],
    });
    if ($('#devices').open) drawVisits(series, visitsOn, D);

    // customers
    const tbody = $('#rows'); tbody.replaceChildren();
    const statusName = { paid: 'שולם', partially_refunded: 'הוחזר חלקית', refunded: 'הוחזר', reversed: 'בוטל בבנק' };
    for (const o of D.orders) {
      const tr = document.createElement('tr');
      [dmy(String(o.paid_at).slice(0, 10)), o.artist || '—', o.track || '—', o.service || '—', o.options || '—', '$' + o.amount_usd.toFixed(2), o.fee_usd == null ? '—' : '$' + o.fee_usd.toFixed(2), statusName[o.status] || o.status, o.ref]
        .forEach((v, i) => { const td = document.createElement('td'); if (i === 7) { const s = document.createElement('span'); s.className = 'st ' + o.status; s.textContent = v; td.appendChild(s); } else td.textContent = v; if (i === 5 || i === 6) td.className = 'n'; tr.appendChild(td); });
      tbody.appendChild(tr);
    }
    $('#rows-empty').hidden = D.orders.length > 0;
    $('#customers-count').textContent = D.orders.length ? '· ' + D.orders.length : '';
    if (D.orders.length && !state.touchedCustomers) $('#customers').open = true;

    // campaigns
    const camps = new Map();
    for (const r of D.adSpend) { const c = camps.get(r.campaign) || { spend: 0, imp: 0, clicks: 0 }; c.spend += r.currency === 'USD' ? r.spend * (state.rate || D.usdIls) : r.spend; c.imp += r.impressions; c.clicks += r.clicks; camps.set(r.campaign, c); }
    const cb = $('#camp-rows'); cb.replaceChildren();
    const live = [...camps].filter(([, c]) => c.spend > 0 || c.imp > 0).sort((a, b) => b[1].spend - a[1].spend);
    for (const [name, c] of live) {
      const tr = document.createElement('tr');
      [name || '—', fmt.ils(c.spend), fmt.int(c.imp), fmt.int(c.clicks), c.clicks ? '₪' + (c.spend / c.clicks).toFixed(2) : '—']
        .forEach((v, i) => { const td = document.createElement('td'); td.textContent = v; if (i) td.className = 'n'; tr.appendChild(td); });
      cb.appendChild(tr);
    }
    $('#camp-empty').hidden = live.length > 0;
    $('#campaigns-count').textContent = live.length ? '· ' + live.length : '';

    showSync(D.sources);
  }

  function drawVisits(series, visitsOn, D) {
    chart($('#visitsChart'), series, {
      label: 'צפיות בעמודים לפי תקופה, דסקטופ ומובייל', stack: [['desktop', 0], ['mobile', 1]],
      empty: visitsOn ? null : (D.sources.visits.state === 'not_connected' ? 'מטא עוד לא מחובר' : 'ממתין לעדכון הראשון ממטא'),
      tip: (d) => [['דסקטופ', fmt.int(d.desktop)], ['מובייל', fmt.int(d.mobile)], ['סה״כ', fmt.int(d.visits)]],
    });
  }
  $('#devices').addEventListener('toggle', () => { if ($('#devices').open && state.data) { const D = state.data; drawVisits(build(D, state.from, state.to).series, D.sources.visits.connected, D); } });
  $('#customers').addEventListener('toggle', () => { state.touchedCustomers = true; });

  function chart(el, data, o) {
    el.replaceChildren();
    if (o.empty) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = o.empty; el.appendChild(p); return; }
    const NS = 'http://www.w3.org/2000/svg', W = Math.max(280, el.clientWidth), H = 240, B = H - 24, T = 10;
    const val = (d) => o.stack ? o.stack.reduce((a, [k]) => a + d[k], 0) : Math.max(...o.bars.map(([k]) => d[k]), o.line ? d[o.line] : 0);
    const lo = o.line ? Math.min(0, ...data.map((d) => d[o.line])) : 0;
    let hi = Math.max(0, ...data.map(val)); if (hi <= lo) hi = lo + 1;
    const step = niceStep((hi - lo) / 4); hi = Math.ceil(hi / step) * step; const lo2 = Math.floor(lo / step) * step;
    const y = (v) => B - (v - lo2) / (hi - lo2) * (B - T);
    const tf = (v) => o.money ? '₪' + short(v) : short(v);
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', o.label);
    el.appendChild(svg);
    const add = (tag, attrs, parent = svg) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };
    const ticks = []; for (let v = lo2; v <= hi + 1e-9; v += step) ticks.push(v);
    const probe = add('text', {}); let widest = 20;
    for (const v of ticks) { probe.textContent = tf(v); widest = Math.max(widest, probe.getComputedTextLength()); }
    const L = Math.ceil(widest) + 10; probe.remove();
    for (const v of ticks) { add('line', { x1: L, x2: W - 4, y1: y(v), y2: y(v), stroke: v === 0 ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.07)' }); const tx = add('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }); tx.textContent = tf(v); }
    const n = data.length, bw = (W - L - 4) / n, pad = Math.min(bw * 0.2, 6);
    const every = Math.max(1, Math.ceil(n / Math.floor((W - L) / 48)));
    data.forEach((d, i) => {
      const x0 = L + i * bw + pad, w = bw - pad * 2;
      if (o.stack) { let acc = 0; for (const [k, c] of o.stack) { add('rect', { x: x0, width: Math.max(w, 1), y: y(acc + d[k]), height: Math.max(0, y(acc) - y(acc + d[k])), fill: color(c) }); acc += d[k]; } }
      else { const sw = w / o.bars.length; o.bars.forEach(([k, c], j) => add('rect', { x: x0 + j * sw, width: Math.max(sw - 1, 1), y: y(Math.max(0, d[k])), height: Math.abs(y(d[k]) - y(0)), fill: color(c), rx: 2 })); }
      if (i % every === 0) { const tx = add('text', { x: L + i * bw + bw / 2, y: H - 6, 'text-anchor': 'middle' }); tx.textContent = state.grain.includes('month') ? d.period.slice(5, 7) + '/' + d.period.slice(2, 4) : d.period.slice(8, 10) + '/' + d.period.slice(5, 7); }
    });
    if (o.line) {
      const pts = data.map((d, i) => [L + i * bw + bw / 2, y(d[o.line])]);
      add('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: color(2), 'stroke-width': 2, 'stroke-linejoin': 'round' });
      const last = pts[pts.length - 1]; if (last) add('circle', { cx: last[0], cy: last[1], r: 3.5, fill: color(2) });
    }
    const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; el.appendChild(tip);
    svg.addEventListener('pointermove', (ev) => {
      const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, i = Math.floor((x - L) / bw);
      if (i < 0 || i >= n) { tip.hidden = true; return; }
      const d = data[i]; tip.replaceChildren();
      const h = document.createElement('b'); h.textContent = (state.grain === 'week' ? 'שבוע מ־' : '') + dmy(d.period); tip.appendChild(h);
      for (const [k, v] of o.tip(d)) { const line = document.createElement('div'); line.textContent = k + ': ' + v; tip.appendChild(line); }
      tip.hidden = false; tip.style.left = Math.min(Math.max(0, ev.clientX - el.getBoundingClientRect().left + 12), el.clientWidth - tip.offsetWidth) + 'px';
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; });
  }
  function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  function short(v) { const a = Math.abs(v); return a >= 1e6 ? (v / 1e6).toFixed(1).replace(/\\.0$/, '') + 'M' : a >= 1e3 ? (v / 1e3).toFixed(1).replace(/\\.0$/, '') + 'K' : String(Math.round(v * 100) / 100); }

  function ago(at) {
    const m = Math.max(0, Math.round((Date.now() - Date.parse(at)) / 60000));
    return m < 1 ? 'עכשיו' : m < 60 ? 'לפני ' + m + ' דק׳' : m < 1440 ? 'לפני ' + Math.round(m / 60) + ' שע׳' : 'לפני ' + Math.round(m / 1440) + ' ימים';
  }
  function showSync(sources) {
    const el = $('#sync'), list = [sources.adSpend, sources.visits];
    $('#refresh').hidden = list.every((s) => s.state === 'not_connected');
    const failed = list.find((s) => s.state === 'error');
    el.classList.toggle('err', !!failed);
    if (failed) { el.textContent = 'העדכון האחרון ממטא נכשל. הפרטים בכרטיס "לטיפול".'; el.hidden = false; return; }
    const at = list.map((s) => s.at).filter(Boolean).sort().pop();
    el.textContent = at ? 'עודכן ממטא ' + ago(at) + ' · מתעדכן לבד כל 3 שעות' : '';
    el.hidden = !at;
  }

  async function refresh() {
    const b = $('#refresh'); if (b.disabled || b.hidden) return;
    b.disabled = true; b.dataset.state = 'busy';
    try {
      const r = await fetch(BASE + '/api/refresh', { method: 'POST', credentials: 'same-origin' });
      if (r.status === 401) { location.reload(); return; }
      await load();
      b.dataset.state = 'done';
      setTimeout(() => { b.dataset.state = ''; }, 1800);
    } catch { b.dataset.state = ''; }
    finally { b.disabled = false; }
  }
  $('#refresh').addEventListener('click', refresh);

  async function summary(from, to) {
    const r = await fetch(BASE + '/api/summary?from=' + from + '&to=' + to, { credentials: 'same-origin', cache: 'no-store' });
    if (r.status === 401) { location.reload(); throw new Error('signed out'); }
    return r.json();
  }
  async function load() {
    document.body.classList.add('loading');
    const span = Math.round((Date.parse(state.to) - Date.parse(state.from)) / DAY) + 1;
    state.prevTo = iso(new Date(Date.parse(state.from) - DAY));
    state.prevFrom = iso(new Date(Date.parse(state.from) - span * DAY));
    const [data, prev] = await Promise.all([summary(state.from, state.to), summary(state.prevFrom, state.prevTo)]);
    document.body.classList.remove('loading');
    if (data.error) { $('#lede').textContent = 'הטווח לא תקין.'; return; }
    state.data = data; state.prev = prev.error ? null : prev;
    if (!state.rate) $('#rate').value = data.usdIls;
    render();
  }

  /* controls */
  function setRange(v) {
    state.to = iso(today);
    state.from = v === 'month' ? iso(today).slice(0, 8) + '01' : iso(new Date(today - (Number(v) - 1) * DAY));
    syncControls(); load();
  }
  function setGrain(g) { state.grain = g; store.set('grain', g); syncControls(); render(); }
  function syncControls() {
    $('#from').value = state.from; $('#to').value = state.to; $('#grain').value = state.grain;
    if (state.rate) $('#rate').value = state.rate;
    const span = Math.round((Date.parse(state.to) - Date.parse(state.from)) / DAY) + 1, atToday = state.to === iso(today);
    $$('[data-preset]').forEach((b) => { const v = b.dataset.preset; b.setAttribute('aria-pressed', String(atToday && (v === 'month' ? state.from === iso(today).slice(0, 8) + '01' : span === Number(v)))); });
  }
  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => setRange(b.dataset.preset)));
  for (const id of ['from', 'to']) $('#' + id).addEventListener('change', (e) => {
    const v = e.target.value; if (!v || !e.target.validity.valid || v < '2020-01-01') return;
    state[id] = v; if (state.from > state.to) { if (id === 'from') state.to = v; else state.from = v; }
    syncControls(); load();
  });
  $('#grain').addEventListener('change', (e) => setGrain(e.target.value));
  $('#rate').addEventListener('change', (e) => { const n = Number(e.target.value); if (n >= 1 && n <= 10) { state.rate = n; store.set('rate', n); render(); } });
  $('#toggle-settings').addEventListener('click', (e) => { const s = $('#settings'); s.hidden = !s.hidden; e.currentTarget.setAttribute('aria-pressed', String(!s.hidden)); });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 150); });

  /* ⌘K quick actions */
  const scrim = $('#scrim'), pq = $('#pq'), plist = $('#plist');
  let items = [], sel = 0, lastFocus = null;
  function actions() {
    const list = [
      ['טווח', '7 הימים האחרונים', () => setRange('7')],
      ['טווח', '28 הימים האחרונים', () => setRange('28')],
      ['טווח', 'החודש', () => setRange('month')],
      ['טווח', '90 הימים האחרונים', () => setRange('90')],
      ['טווח', 'השנה האחרונה', () => setRange('365')],
      ['טווח', 'טווח מותאם ושער דולר', () => { $('#settings').hidden = false; $('#toggle-settings').setAttribute('aria-pressed', 'true'); $('#from').focus(); }],
      ['תצוגה', 'חלוקה לפי יום', () => setGrain('day')],
      ['תצוגה', 'חלוקה לפי שבוע', () => setGrain('week')],
      ['תצוגה', 'חלוקה לפי חודש', () => setGrain('month')],
      ['תצוגה', 'חלוקה לפי חודשיים', () => setGrain('2month')],
      ['פעולות', 'רענון ממטא עכשיו', refresh, !$('#refresh').hidden],
      ['פעולות', 'פתח את לקוחות ושירותים', () => openFold('customers')],
      ['פעולות', 'פתח את הקמפיינים', () => openFold('campaigns')],
      ['פעולות', 'פתח את Ads Manager', () => window.open('https://adsmanager.facebook.com/', '_blank', 'noopener')],
      ['פעולות', 'פתח את האתר', () => window.open('https://evoxelmusic.com/', '_blank', 'noopener')],
      ['פעולות', 'יציאה', () => document.querySelector('form[action$="/logout"]').submit()],
    ].filter((a) => a[3] !== false);
    for (const o of (state.data ? state.data.orders : [])) list.push(['לקוחות', (o.artist || '—') + ' · ' + (o.service || '') + ' · ' + o.ref, () => openFold('customers'), true, dmy(String(o.paid_at).slice(0, 10))]);
    return list;
  }
  function openFold(id) { const d = document.getElementById(id); d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function draw() {
    const q = pq.value.trim().toLowerCase();
    items = actions().filter(([g, name]) => !q || (g + ' ' + name).toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, items.length - 1));
    plist.replaceChildren();
    if (!items.length) { const li = document.createElement('li'); li.className = 'none'; li.textContent = 'לא נמצא. נסה מילה אחרת.'; plist.appendChild(li); return; }
    let grp = null;
    items.forEach(([g, name, , , hint], i) => {
      if (g !== grp) { grp = g; const h = document.createElement('li'); h.className = 'grp'; h.textContent = g; plist.appendChild(h); }
      const li = document.createElement('li'); li.className = 'it'; li.id = 'pi' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === sel));
      li.textContent = name; if (hint) { const s = document.createElement('small'); s.textContent = hint; li.appendChild(s); }
      li.addEventListener('click', () => run(i)); li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; mark(); } });
      plist.appendChild(li);
    });
    pq.setAttribute('aria-activedescendant', 'pi' + sel);
  }
  function mark() { $$('#plist .it').forEach((li, i) => li.setAttribute('aria-selected', String(i === sel))); pq.setAttribute('aria-activedescendant', 'pi' + sel); const cur = document.getElementById('pi' + sel); if (cur) cur.scrollIntoView({ block: 'nearest' }); }
  function openPalette() { lastFocus = document.activeElement; scrim.hidden = false; pq.value = ''; sel = 0; draw(); pq.focus(); }
  function closePalette() { scrim.hidden = true; if (lastFocus) lastFocus.focus(); }
  function run(i) { const a = items[i]; closePalette(); if (a) a[2](); }
  $('#open-palette').addEventListener('click', openPalette);
  scrim.addEventListener('click', (e) => { if (e.target === scrim) closePalette(); });
  pq.addEventListener('input', () => { sel = 0; draw(); });
  pq.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
  });
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); scrim.hidden ? openPalette() : closePalette(); }
    else if (e.key === 'Escape' && !scrim.hidden) closePalette();
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) $('#open-palette kbd').textContent = 'Ctrl K';

  /* live now: asks every 15 seconds, only while this page is visible */
  const PLACE = { home: 'דף הבית', services: 'שירותים', credits: 'קרדיטים', work: 'עבודות', about: 'אודות', contact: 'צור קשר', faq: 'שאלות', footer: 'תחתית', book: 'הזמנה', 'book:1': 'הזמנה · בחירת שירות', 'book:2': 'הזמנה · פרטי הטרק', 'book:3': 'הזמנה · תשלום', 'book:4': 'הזמנה · סיום' };
  const SOURCE = { ad: 'ממודעה', instagram: 'אינסטגרם', facebook: 'פייסבוק', google: 'גוגל', other: 'אתר אחר', direct: 'ישיר' };
  const DEVICE = { mobile: 'מובייל', desktop: 'דסקטופ' };
  let liveTimer = null;
  async function live() {
    try {
      const r = await fetch(BASE + '/api/live', { credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 401) { location.reload(); return; }
      const d = await r.json();
      $('#live-count').textContent = String(d.count);
      $('#live-pulse').classList.toggle('on', d.count > 0);
      $('#live-quiet').hidden = d.count > 0;
      const chips = $('#live-chips'); chips.replaceChildren();
      const group = (key, names) => {
        const c = new Map();
        for (const v of d.visits) { const k = v[key] || '?'; c.set(k, (c.get(k) || 0) + 1); }
        return [...c].sort((a, b) => b[1] - a[1]).map(([k, n]) => [names ? (names[k] || k) : k, n, k]);
      };
      const add = (label, n, hot) => { const s = document.createElement('span'); s.className = 'chip' + (hot ? ' hot' : ''); const b = document.createElement('b'); b.textContent = n; s.append(b, ' ' + label); chips.appendChild(s); };
      for (const [label, n, k] of group('place', PLACE)) add(label, n, String(k).startsWith('book'));
      for (const [label, n] of group('source', SOURCE)) add(label, n);
      for (const [label, n] of group('device', DEVICE)) add(label, n);
      for (const [label, n] of group('country')) if (label !== '?') add(label, n);
    } catch {}
  }
  function liveStart() { if (!liveTimer && document.visibilityState === 'visible') { live(); liveTimer = setInterval(live, 15000); } }
  function liveStop() { clearInterval(liveTimer); liveTimer = null; }
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' ? liveStart() : liveStop());
  liveStart();

  syncControls(); load();
})();
</script></body></html>`;
}
