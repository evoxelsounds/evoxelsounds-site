/* ============================================================
   Pages of the private dashboard: sign-in and the dashboard itself.

   Look: the site's own language (near-black, warm amber, Archivo +
   Hanken Grotesk, pill buttons) in a calm working layout:
   - a side menu grouped with labels and icons
   - a metric strip on top (Shopify-style): each metric's value,
     a sparkline and its change; hover, focus or tap opens a window
     with the metric over time against the previous period
   - live visitors, where visits come from, tasks (only things to
     act on, each can be marked done), the funnel, campaigns, clients
   - ⌘K opens quick actions
   ============================================================ */

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON = {
  logo: '<path d="M4 15V9M8 18V6M12 21V3M16 18V6M20 15V9"/>',
  home: '<path d="M3 12l9-8 9 8M5 10v10h14V10"/>',
  profit: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 8a5 5 0 0 1 0 8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  funnel: '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
  live: '<circle cx="12" cy="12" r="2.5"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
};
const icon = (name, size = 16) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

// the site's own logo, served by the site
const LOGO = 'https://evoxelmusic.com/assets/logo.webp';

const FONTS = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600&family=Heebo:wght@400;500;600;700;800&display=swap">';

/* ---------- shared look (the site's tokens) ---------- */
const STYLE = `
/* layout: side menu + working area; one card style on the site's surfaces */
:root{
  --bg:#08070b; --bg-2:#0c0a10; --surface:#141019; --surface-2:#1b1622;
  --line:rgba(230,180,120,.10); --line-2:rgba(230,180,120,.22);
  --text:#f5efe6; --dim:#b3a999; --mute:#8f8572;
  --accent:#e6a23c; --accent-2:#f3c87a; --good:#7fe0ab; --bad:#ff8a7a; --prev:#6d5f4c;
  --display:"Archivo","Heebo",system-ui,sans-serif; --body:"Hanken Grotesk","Heebo",system-ui,sans-serif;
  --r:14px;
  color-scheme:dark;
}
*{box-sizing:border-box}
[hidden]{display:none!important}
html{height:100%}
body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font:15px/1.5 var(--body);-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(900px 520px at 30% -10%,rgba(230,162,60,.12),transparent 60%),radial-gradient(760px 640px at 110% 30%,rgba(138,79,217,.10),transparent 55%)}
button,input,select{font:inherit;color:inherit}
a{color:var(--accent)}a:hover{color:var(--accent-2)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px}
.ic{flex:none}
.num{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}
`;

/* ---------- sign-in page ---------- */
export function loginPage({ base, nonce, error }) {
  const msg = error === 'locked' ? 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.'
    : error === 'wrong' ? 'הסיסמה לא נכונה.' : '';
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>כניסה</title>${FONTS}<style nonce="${nonce}">${STYLE}
main{position:relative;z-index:1;min-height:100vh;display:grid;place-items:center;padding:16px}
form{width:100%;max-width:340px;display:flex;flex-direction:column;gap:14px;padding:28px;border-radius:var(--r);border:1px solid var(--line);background:var(--surface)}
.brand img{display:block;height:30px;width:auto}
h1{margin:4px 0 0;font-family:var(--display);font-size:22px;font-weight:800}
label{display:flex;flex-direction:column;gap:6px;color:var(--dim);font-size:13px}
input{padding:11px 12px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg-2);direction:ltr}
button{padding:12px;border-radius:100px;border:0;background:var(--accent);color:var(--bg);cursor:pointer;font-weight:700}
.err{margin:0;color:var(--bad);font-size:13px}
</style></head><body><main>
<form method="post" action="${esc(base)}/login" autocomplete="on">
  <div class="brand"><img src="${LOGO}" alt="EVOXEL SOUNDS" width="150" height="34"></div>
  <h1>כניסה לדשבורד</h1>
  <label for="pw">סיסמה<input id="pw" name="password" type="password" autocomplete="current-password" required autofocus maxlength="200"></label>
  ${msg ? `<p class="err" role="alert">${msg}</p>` : ''}
  <button type="submit">כניסה</button>
</form></main></body></html>`;
}

/* ---------- dashboard page ---------- */
export function dashboardPage({ base, nonce }) {
  const navLink = (href, ic, label, extra = '') => `<a href="#${href}" class="nav-a" data-nav="${href}">${icon(ic)}<span>${label}</span>${extra}</a>`;
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow">
<title>Evoxel · דשבורד</title>${FONTS}<style nonce="${nonce}">${STYLE}
.app{position:relative;z-index:1;display:flex;flex-wrap:wrap;min-height:100vh}

/* side menu */
.side{flex:1 1 228px;max-width:248px;min-width:210px;padding:22px 14px;border-inline-end:1px solid var(--line);background:rgba(12,10,16,.85);display:flex;flex-direction:column;gap:20px;position:sticky;top:0;height:100vh;overflow:auto}
.brand{display:flex;align-items:center;margin:2px 8px 8px}
.brand img{display:block;height:30px;width:auto}
.grp{display:flex;flex-direction:column;gap:2px}
.grp>span{padding:0 10px 6px;font-size:11px;letter-spacing:.1em;color:var(--mute)}
.nav-a{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;color:var(--dim);text-decoration:none;font-size:14px}
.nav-a:hover{color:var(--text);background:rgba(27,22,34,.6)}
.nav-a.on{background:var(--surface-2);color:var(--text);font-weight:600}
.nav-a .tag{margin-inline-start:auto;font-size:12px;color:var(--good)}
.side .foot{margin-top:auto;display:flex;flex-direction:column;gap:2px}
.side .foot .nav-a,.side .foot button{font-size:13px;color:var(--mute)}
.side form button{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:9px;background:none;cursor:pointer;text-align:right}
.side form button:hover{color:var(--text);background:rgba(27,22,34,.6)}
@media (max-width:860px){
  .side{position:static;height:auto;max-width:none;flex-basis:100%;flex-direction:row;flex-wrap:wrap;align-items:center;gap:6px;padding:12px max(14px,env(safe-area-inset-right)) 12px max(14px,env(safe-area-inset-left));border-inline-end:0;border-bottom:1px solid var(--line)}
  .side .grp{flex-direction:row;flex-wrap:wrap}.side .grp>span{display:none}
  .side .foot{margin:0;flex-direction:row}.brand{margin:0 0 0 auto;flex-basis:100%}
  .nav-a{padding:7px 9px;font-size:13px}
}

/* working area */
.main{flex:999 1 560px;min-width:0;padding:22px max(16px,min(32px,4vw)) 60px;display:flex;flex-direction:column;gap:22px}
.top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.top h1{margin:0 0 0 auto;font-family:var(--display);font-weight:800;font-size:24px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;border:1px solid rgba(230,180,120,.16);background:var(--bg-2);color:var(--text);font-weight:600;font-size:13px;cursor:pointer}
.btn:hover{border-color:var(--line-2)}
.btn.quiet{color:var(--dim);font-weight:500;cursor:default}
.btn.search{min-width:200px;color:var(--mute);font-weight:500}
.btn kbd{margin-inline-start:auto;font:inherit;font-size:11px;border:1px solid var(--line-2);border-radius:5px;padding:0 5px;color:var(--dim)}
@media (max-width:640px){.btn.search{min-width:0}.btn.search span,.btn.search kbd{display:none}}
.cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:182px;padding:10px 18px;border-radius:100px;border:1px solid var(--accent);background:var(--accent);color:var(--bg);font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 14px 36px -14px var(--accent)}
.cta .hov,.cta .busy,.cta .done{display:none}
.cta:hover .def,.cta:focus-visible .def{display:none}
.cta:hover .hov,.cta:focus-visible .hov{display:inline}
.cta[data-state=busy] .def,.cta[data-state=busy] .hov,.cta[data-state=done] .def,.cta[data-state=done] .hov{display:none}
.cta[data-state=busy] .busy,.cta[data-state=done] .done{display:inline}
@media (prefers-reduced-motion:no-preference){
  .cta{transition:transform .2s ease,box-shadow .2s ease}
  .cta:hover{transform:translateY(-2px)}
  .cta:hover .ic,.cta[data-state=busy] .ic{animation:spin 1.1s cubic-bezier(.5,0,.3,1) infinite}
}
@keyframes spin{to{transform:rotate(-360deg)}}

/* range menu */
.menu-wrap{position:relative}
.menu{position:absolute;top:calc(100% + 8px);inset-inline-start:0;z-index:30;width:300px;max-width:calc(100vw - 32px);padding:12px;border-radius:12px;border:1px solid var(--line-2);background:var(--surface);box-shadow:0 24px 48px -16px rgba(0,0,0,.7);display:flex;flex-direction:column;gap:12px}
.menu .lbl{font-size:11px;letter-spacing:.1em;color:var(--mute)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{padding:6px 12px;border-radius:100px;border:1px solid var(--line-2);background:transparent;color:var(--dim);font-size:13px;cursor:pointer}
.chip:disabled{opacity:.4;cursor:default}
.chip[aria-pressed=true]{border-color:var(--accent);background:rgba(230,162,60,.12);color:var(--text)}
.fields{display:flex;gap:8px;flex-wrap:wrap}
.fields label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--mute);flex:1;min-width:120px}
.in{padding:7px 9px;border-radius:8px;border:1px solid var(--line-2);background:var(--bg-2);font-size:13px;font-variant-numeric:tabular-nums}

/* metric strip and its window */
.strip-wrap{position:relative}
.strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;padding:10px;border-radius:var(--r);border:1px solid var(--line);background:var(--surface)}
@media (max-width:1100px){.strip{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:560px){.strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
.metric{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px 14px;border:0;border-radius:10px;background:transparent;color:var(--text);cursor:pointer;text-align:right;min-width:0}
.metric:hover,.metric[aria-expanded=true]{background:var(--surface-2)}
.metric .l{font-size:13px;color:var(--dim);border-bottom:1px dashed rgba(230,180,120,.28);padding-bottom:1px}
.metric[aria-expanded=true] .l{color:var(--text)}
.metric .row{display:flex;align-items:center;gap:10px;width:100%}
.metric .v{font-family:var(--display);font-weight:700;font-size:22px;white-space:nowrap}
.metric .v.pos{color:var(--good)}.metric .v.neg{color:var(--bad)}
.metric .d{font-size:12px;color:var(--mute)}
.metric .d.good{color:var(--good)}.metric .d.bad{color:var(--bad)}
.metric svg{direction:ltr}
.pop{position:absolute;top:calc(100% + 10px);z-index:20;width:640px;max-width:100%;padding:26px 28px 22px;border-radius:18px;border:1px solid rgba(230,180,120,.16);background:var(--surface);box-shadow:0 30px 60px -20px rgba(0,0,0,.75);display:flex;flex-direction:column;gap:6px}
@media (max-width:700px){.pop{inset-inline:0!important;width:auto;padding:20px}}
.pop .big{font-family:var(--display);font-weight:600;font-size:44px;line-height:1.05;letter-spacing:-.02em;text-align:right}
.pop .t{font-weight:600;font-size:15px;margin-top:4px}
.pop .s{font-size:14px;color:var(--mute)}
.pop .chart{position:relative;margin-top:14px;direction:ltr}
.pop .chart svg{display:block;width:100%;height:auto}
.pop .chart text{fill:var(--mute);font-size:11px;font-family:var(--body)}
.pop .legend{display:flex;justify-content:center;gap:24px;font-size:13px;color:var(--dim);margin-top:6px;flex-wrap:wrap}
.pop .legend i,.tip i{display:inline-block;width:9px;height:9px;border-radius:100px;margin-inline-end:7px;vertical-align:0}
.tip{position:absolute;top:16px;min-width:150px;padding:12px 14px;border-radius:10px;background:#0a080d;border:1px solid var(--line-2);box-shadow:0 16px 30px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:5px;direction:rtl;pointer-events:none;font-size:12px;color:var(--dim)}
.tip b{color:var(--text);font-size:13px}
.tip .val{align-self:flex-start;padding:2px 8px;border-radius:6px;background:var(--surface-2);font-family:var(--display);font-weight:600;font-size:15px;color:var(--text)}
.tip .val.prev{color:var(--dim)}
.extra{margin-top:12px;padding-top:14px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:9px}
.extra>span{font-size:11px;letter-spacing:.1em;color:var(--mute)}
.brk{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) auto;gap:12px;align-items:center;font-size:13px}
.brk .bar{height:6px;border-radius:100px;background:var(--surface-2)}
.brk .bar i{display:block;height:100%;border-radius:100px;background:var(--accent)}
.brk .val{white-space:nowrap}
.brk b{font-family:var(--display);font-weight:600}
.brk small{color:var(--mute);font-weight:400;font-size:12px;margin-inline-start:8px}
.extra .empty{font-size:13px}

/* cards */
.card{padding:20px;border-radius:var(--r);border:1px solid var(--line);background:var(--surface);display:flex;flex-direction:column;gap:14px;min-width:0}
.card h2{margin:0;font-size:16px;font-weight:600}
.card .head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.card .head small{font-size:12px;color:var(--mute)}
.card .head .end{margin-inline-start:auto}
.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.span2{grid-column:span 2}
@media (max-width:1000px){.grid3{grid-template-columns:1fr}.span2{grid-column:auto}}
.empty{margin:0;color:var(--mute);font-size:14px}
.lede{margin:-8px 0 0;color:var(--dim);font-size:14px}
.lede b{color:var(--text);font-weight:600}
.sync{font-size:12px;color:var(--mute)}
.sync.err{color:var(--bad)}

/* live */
.live{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 18px;border-radius:var(--r);border:1px solid rgba(127,224,171,.22);background:rgba(127,224,171,.05)}
.live .tagline{display:inline-flex;align-items:center;gap:8px;font-family:var(--display);font-weight:800;font-size:13px;letter-spacing:.1em;color:var(--good);direction:ltr}
.live .dot{width:8px;height:8px;border-radius:100px;background:var(--mute)}
.live.on .dot{background:var(--good);box-shadow:0 0 0 4px rgba(127,224,171,.15)}
@media (prefers-reduced-motion:no-preference){.live.on .dot{animation:pulse 2s ease-out infinite}}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(127,224,171,.45)}100%{box-shadow:0 0 0 10px rgba(127,224,171,0)}}
.live .n{font-family:var(--display);font-weight:800;font-size:22px}
.live .k{font-size:14px;color:var(--dim);margin-inline-end:6px}
.pill{padding:4px 11px;border-radius:100px;background:var(--surface-2);color:var(--dim);font-size:12px}
.pill b{color:var(--text)}
.pill.hot{background:transparent;border:1px solid rgba(230,162,60,.45);color:var(--accent)}

/* where visits come from */
.geo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px}
@media (max-width:560px){.geo{grid-template-columns:1fr}}
.col{display:flex;flex-direction:column;gap:10px}
.col>span{font-size:11px;letter-spacing:.1em;color:var(--mute)}
.crow{display:grid;grid-template-columns:30px 1fr 52px;gap:10px;align-items:center;font-size:13px}
.crow .cc{font-family:var(--display);font-size:11px;font-weight:700;color:var(--mute);direction:ltr}
.crow .bar{height:5px;border-radius:100px;background:var(--surface-2);margin-top:4px}
.crow .bar i{display:block;height:100%;border-radius:100px;background:var(--accent)}
.crow .p{font-family:var(--display);font-weight:600;text-align:left;direction:ltr}
.city{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:8px;border-bottom:1px solid rgba(230,180,120,.06);font-size:13px}
.city small{color:var(--mute);font-size:12px}
.city b{font-family:var(--display);font-weight:600}
.sources{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding-top:12px;border-top:1px solid rgba(230,180,120,.08)}
.sources>span:first-child{font-size:11px;letter-spacing:.1em;color:var(--mute);margin-inline-end:4px}

/* tasks */
.tasks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.tasks li{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:9px;background:rgba(230,162,60,.08);font-size:13px;color:var(--dim);line-height:1.45}
.tasks li.bad{background:rgba(255,138,122,.08)}
.tasks li.order{background:rgba(127,224,171,.07)}
.tasks li span{flex:1}
.tasks li button{flex:none;display:grid;place-items:center;width:30px;height:30px;margin:-4px -4px -4px 0;border-radius:8px;border:1px solid var(--line-2);background:transparent;color:var(--dim);cursor:pointer}
.tasks li button:hover{color:var(--good);border-color:var(--good)}
.linkbtn{border:0;background:none;color:var(--accent);font-size:13px;cursor:pointer;padding:0}
.linkbtn:hover{color:var(--accent-2)}

/* funnel */
.fun{display:flex;flex-direction:column;gap:10px}
.frow{display:grid;grid-template-columns:120px 1fr 96px;gap:12px;align-items:center;font-size:14px}
.frow>span:first-child{color:var(--dim)}
.frow .bar{height:10px;border-radius:100px;background:var(--surface-2)}
.frow .bar i{display:block;height:100%;border-radius:100px;background:var(--accent)}
.frow b{font-family:var(--display);font-weight:700}
.frow small{font-size:12px;color:var(--mute);font-weight:400}
.note{font-size:12px;color:var(--mute);padding-top:8px;border-top:1px solid rgba(230,180,120,.08)}

/* tables */
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
th{text-align:right;padding:12px 18px;color:var(--mute);font-weight:500;border-bottom:1px solid rgba(230,180,120,.08);white-space:nowrap}
td{padding:12px 18px;border-bottom:1px solid rgba(230,180,120,.06);white-space:nowrap;color:var(--dim)}
td:first-child{color:var(--text)}
td.n{direction:ltr;text-align:right}
.st{padding:2px 9px;border-radius:100px;background:var(--surface-2);font-size:12px}
.st.paid{color:var(--good)}.st.refunded,.st.reversed,.st.partially_refunded{color:var(--bad)}
.clients-h{display:flex;align-items:center;gap:10px}
.clients-h h2{margin:0;font-family:var(--display);font-weight:800;font-size:26px;color:var(--accent)}
.table-card{border-radius:var(--r);border:1px solid var(--line);background:var(--surface);overflow:hidden}
details.how{border-radius:var(--r);border:1px solid var(--line);background:var(--surface)}
details.how summary{padding:16px 20px;font-weight:600;cursor:pointer}
details.how ul{margin:0;padding:0 40px 18px 20px;color:var(--dim);font-size:14px;line-height:1.7}
body.loading [data-k],body.loading .strip{opacity:.45}
.contents{display:contents}.accent{color:var(--accent)}.stack{display:flex;flex-direction:column;gap:14px}.empty.pad{padding:28px 18px;text-align:center}

/* ⌘K */
.scrim{position:fixed;inset:0;z-index:40;background:rgba(5,4,7,.6);display:grid;align-items:start;justify-items:center;padding:12vh 16px 16px}
.palette{width:100%;max-width:560px;border-radius:14px;border:1px solid var(--line-2);background:var(--surface);box-shadow:0 30px 60px rgba(0,0,0,.6);overflow:hidden}
.palette .q{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line);color:var(--mute)}
.palette .q input{flex:1;border:0;background:none;outline:none;font-size:15px;color:var(--text)}
.palette ul{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}
.palette li.g{padding:8px 10px 4px;font-size:11px;letter-spacing:.1em;color:var(--mute)}
.palette li.it{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;cursor:pointer;font-size:14px;color:var(--dim)}
.palette li.it small{margin-inline-start:auto;color:var(--mute)}
.palette li.it[aria-selected=true]{background:var(--surface-2);color:var(--text)}
.palette .none{padding:16px;color:var(--mute);font-size:14px}
</style></head><body class="loading">
<div class="app">
  <nav class="side" aria-label="תפריט">
    <a class="brand" href="https://evoxelmusic.com/" target="_blank" rel="noopener"><img src="${LOGO}" alt="EVOXEL SOUNDS" width="150" height="34"></a>
    <div class="grp">${navLink('overview', 'home', 'סקירה')}</div>
    <div class="grp"><span>כסף</span>${navLink('metrics', 'profit', 'רווח והכנסות')}${navLink('campaigns', 'megaphone', 'קמפיינים')}</div>
    <div class="grp"><span>קהל</span>${navLink('geo', 'globe', 'מאיפה המבקרים')}${navLink('funnel', 'funnel', 'משפך')}${navLink('live', 'live', 'עכשיו באתר', '<span class="tag num" id="nav-live"></span>')}</div>
    <div class="grp"><span>לקוחות</span>${navLink('orders', 'users', 'הזמנות ולקוחות')}</div>
    <div class="foot">
      ${navLink('how', 'info', 'איך מחושב')}
      <form method="post" action="${esc(base)}/logout"><button type="submit">${icon('logout')}<span>יציאה</span></button></form>
    </div>
  </nav>

  <main class="main" id="overview">
    <div class="top">
      <h1>סקירה</h1>
      <div class="menu-wrap">
        <button class="btn" type="button" id="range-btn" aria-expanded="false" aria-controls="range-menu">${icon('calendar', 15)}<span id="range-label">28 הימים האחרונים</span>${icon('chevron', 14)}</button>
        <div class="menu" id="range-menu" hidden>
          <span class="lbl">טווח</span>
          <div class="chips">
            <button type="button" class="chip" data-preset="24h">24 שעות</button>
            <button type="button" class="chip" data-preset="7">7 ימים</button>
            <button type="button" class="chip" data-preset="28">28 ימים</button>
            <button type="button" class="chip" data-preset="month">החודש</button>
            <button type="button" class="chip" data-preset="90">90 ימים</button>
            <button type="button" class="chip" data-preset="365">שנה</button>
          </div>
          <div class="fields">
            <label for="from">מתאריך<input class="in" type="date" id="from" min="2020-01-01" max="2035-12-31"></label>
            <label for="to">עד תאריך<input class="in" type="date" id="to" min="2020-01-01" max="2035-12-31"></label>
          </div>
          <span class="lbl">חלוקה בגרפים</span>
          <div class="chips">
            <button type="button" class="chip" data-grain="day">יום</button>
            <button type="button" class="chip" data-grain="week">שבוע</button>
            <button type="button" class="chip" data-grain="month">חודש</button>
            <button type="button" class="chip" data-grain="2month">חודשיים</button>
          </div>
          <div class="fields"><label for="rate">שער דולר (₪)<input class="in" type="number" id="rate" min="1" max="10" step="0.01"></label></div>
        </div>
      </div>
      <span class="btn quiet" id="compare-label">מול 28 הימים הקודמים</span>
      <button class="btn search" type="button" id="open-palette" aria-label="פעולות מהירות">${icon('search', 15)}<span>חיפוש</span><kbd>⌘K</kbd></button>
      <button class="cta" type="button" id="refresh" hidden>${icon('sync', 15)}<span class="def">רענון ממטא</span><span class="hov">בוא נראה כמה הרווחנו</span><span class="busy">מושך נתונים…</span><span class="done">עודכן</span></button>
    </div>
    <p class="lede" id="lede">טוען נתונים…</p>

    <div class="strip-wrap" id="metrics">
      <section class="strip" aria-label="מדדים עיקריים" id="strip"></section>
      <div class="pop" id="pop" role="dialog" aria-modal="false" hidden>
        <div class="big num" id="pop-big"></div>
        <div class="t" id="pop-title"></div>
        <div class="s" id="pop-desc"></div>
        <div class="chart" id="pop-chart"></div>
        <div class="legend"><span><i class="sw-cur"></i><span id="pop-cur-range"></span></span><span><i class="sw-prev"></i><span id="pop-prev-range"></span></span></div>
        <div class="extra" id="pop-extra" hidden></div>
      </div>
    </div>

    <section class="live" id="live" aria-live="polite">
      <span class="tagline"><span class="dot"></span>LIVE</span>
      <span class="n num" id="live-n">—</span><span class="k">עכשיו באתר</span>
      <span id="live-pills" class="contents"></span>
      <span class="empty" id="live-quiet" hidden>אין כרגע אף אחד באתר.</span>
    </section>

    <section class="grid3">
      <article class="card span2" id="geo">
        <div class="head"><h2>מאיפה המבקרים</h2><small id="geo-total"></small></div>
        <div class="geo">
          <div class="col"><span>מדינות</span><div id="countries" class="col"></div></div>
          <div class="col"><span>ערים</span><div id="cities" class="col"></div></div>
        </div>
        <div class="sources" id="sources"></div>
        <p class="empty" id="geo-empty" hidden>עוד אין ביקורים בתקופה הזו. הספירה לפי מדינה ועיר התחילה ב־16.11.26.</p>
      </article>
      <article class="card" id="tasks-card">
        <div class="head"><h2>לטיפול <span class="num accent" id="tasks-n"></span></h2><button class="linkbtn end" type="button" id="tasks-clear" hidden>נקה הכל</button></div>
        <ul class="tasks" id="tasks"></ul>
        <p class="empty" id="tasks-empty" hidden>אין משימות פתוחות. הזמנה חדשה, החזר או תקלה עם מטא יופיעו כאן.</p>
        <div class="sync" id="sync"></div>
      </article>
    </section>

    <section class="grid3">
      <article class="card span2" id="funnel">
        <div class="head"><h2>משפך</h2><small>כל שלב כחלק מהקודם</small></div>
        <div class="fun">
          <div class="frow"><span>ביקורים</span><span class="bar"><i data-w="visits"></i></span><b class="num" data-k="visits">—</b></div>
          <div class="frow"><span>התחילו הזמנה</span><span class="bar"><i data-w="started"></i></span><b><span class="num" data-k="started">—</span> <small id="rate-started"></small></b></div>
          <div class="frow"><span>שילמו</span><span class="bar"><i data-w="orders"></i></span><b><span class="num" data-k="orders">—</span> <small id="rate-paid"></small></b></div>
        </div>
        <div class="note" id="fun-note"></div>
      </article>
      <article class="card" id="campaigns">
        <div class="head"><h2>קמפיינים במטא</h2><small id="camp-n"></small></div>
        <div class="tw"><table><thead><tr><th>קמפיין</th><th>הוצאה</th><th>קליקים</th></tr></thead><tbody id="camp-rows"></tbody></table></div>
        <p class="empty" id="camp-empty" hidden>אין הוצאה על מודעות בתקופה הזו.</p>
        <div class="extra" id="placements" hidden></div>
      </article>
    </section>

    <section id="orders" class="stack">
      <div class="clients-h"><h2>לקוחות ושירותים</h2><small class="sync" id="orders-n"></small></div>
      <div class="table-card"><div class="tw"><table>
        <thead><tr><th>תאריך</th><th>אמן</th><th>טרק</th><th>שירות</th><th>תוספות</th><th>סכום</th><th>עמלה</th><th>סטטוס</th><th>הזמנה</th></tr></thead>
        <tbody id="rows"></tbody></table></div>
        <p class="empty pad" id="rows-empty" hidden>עוד אין הזמנות ששולמו בתקופה הזו. כל הזמנה שתשולם תופיע כאן עם שם האמן והשירות.</p>
      </div>
    </section>

    <details class="how" id="how"><summary>איך המספרים מחושבים</summary><ul>
      <li>הכנסות: הזמנות בסטטוס "שולם" לפי תאריך התשלום. האתר גובה בדולרים, והסכום מומר לשקלים לפי השער שבתפריט הטווח.</li>
      <li>עמלות PayPal: מה ש־PayPal גבתה בכל תשלום, כמו שהיא מדווחת.</li>
      <li>רווח נקי: הכנסות פחות עמלות פחות מודעות. ROAS: הכנסות חלקי מודעות.</li>
      <li>מודעות: חשבון Evoxel Music במטא, רק קמפיינים שבשמם מופיע "Site". מתעדכן כל 3 שעות או בכפתור הרענון.</li>
      <li>ביקורים: האתר סופר אותם בעצמו, ביקור לכל לשונית פתוחה (חזרה תוך שעה היא אותו ביקור), לפי תאריך בישראל. מדינה ועיר לפי Cloudflare, בלי לשמור כתובת IP. נספרים גם מי שלא אישרו עוגיות.</li>
      <li>השוואה: מול תקופה באותו אורך שקדמה לה. המרה: הזמנות ששולמו חלקי ביקורים.</li>
      <li>מיקום המודעה (רילס, סטורי, פיד): ההוצאה והקליקים לפי מיקום באים ממטא. ביקור נספר כ"מודעה · רילס" או "מודעה · סטורי" כשהקישור במודעה כולל את התג {{placement}} של מטא.</li>
      <li>לטיפול: רק דברים שיש מה לעשות איתם: הזמנה חדשה לביצוע, תשלום שממתין, החזר, או תקלה עם מטא. מי שהתחיל הזמנה ולא סיים מופיע במשפך, לא כמשימה.</li>
    </ul></details>
  </main>
</div>

<div class="scrim" id="scrim" hidden>
  <div class="palette" role="dialog" aria-modal="true" aria-label="פעולות מהירות">
    <div class="q">${icon('search')}<input id="pq" type="text" placeholder="חפש פעולה, טווח או לקוח…" autocomplete="off" aria-controls="plist"></div>
    <ul id="plist" role="listbox"></ul>
  </div>
</div>

<script nonce="${nonce}">
(() => {
  const BASE = ${JSON.stringify(base)};
  const CHECK = ${JSON.stringify(icon('check', 15))};
  const DAY = 86400000;
  const iso = (d) => d.toISOString().slice(0, 10);
  const now0 = new Date();
  const today = new Date(Date.UTC(now0.getFullYear(), now0.getMonth(), now0.getDate()));
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const store = { get(k) { try { return localStorage.getItem('evx.' + k); } catch { return null; } }, set(k, v) { try { localStorage.setItem('evx.' + k, v); } catch {} } };
  const css = getComputedStyle(document.documentElement);
  const C = { accent: css.getPropertyValue('--accent').trim(), prev: css.getPropertyValue('--prev').trim(), line: 'rgba(230,180,120,.08)', base: 'rgba(230,180,120,.18)' };
  $$('.sw-cur').forEach((e) => { e.style.background = C.accent; });
  $$('.sw-prev').forEach((e) => { e.style.background = C.prev; });

  const state = { mode: 'days', from: iso(new Date(today - 27 * DAY)), to: iso(today), grain: store.get('grain') || 'day', rate: Number(store.get('rate')) || null, data: null, prev: null, open: null };
  const HOUR = 3600000;
  const jerFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const jerParts = (ms) => Object.fromEntries(jerFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const jerHour = (ms) => { const p = jerParts(ms); return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour; };
  const jerStamp = (isoStr) => { const p = jerParts(Date.parse(isoStr)); return p.day + '.' + p.month + '.' + p.year.slice(2) + ' ' + p.hour + ':' + p.minute; };
  // a bucket's name on an axis (short) or in a tooltip (full)
  const periodLabel = (p, full) => {
    if (p.length > 10) return full ? dmy(p.slice(0, 10)) + ' · ' + p.slice(11, 13) + ':00' : p.slice(11, 13) + ':00';
    if (!full) return state.grain.includes('month') ? p.slice(5, 7) + '/' + p.slice(2, 4) : p.slice(8, 10) + '.' + p.slice(5, 7);
    return (state.grain === 'week' ? 'שבוע מ־' : '') + dmy(p);
  };
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const fmt = {
    ils: (v) => v == null ? '—' : (v < 0 ? '−' : '') + '₪' + nf.format(Math.abs(v)),
    usd: (v) => v == null ? '—' : '$' + v.toFixed(2),
    int: (v) => v == null ? '—' : nf.format(v),
    pct: (v) => v == null ? '—' : (v * 100).toFixed(2) + '%',
    x: (v) => v == null ? '—' : v.toFixed(2) + '×',
  };
  const dmy = (s) => s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(2, 4);
  const regionName = (() => { try { const dn = new Intl.DisplayNames(['he'], { type: 'region' }); return (c) => { try { return dn.of(c); } catch { return c; } }; } catch { return (c) => c; } })();
  const SRC = { ad: 'מודעה', ad_reels: 'מודעה · רילס', ad_stories: 'מודעה · סטורי', ad_feed: 'מודעה · פיד', instagram: 'אינסטגרם', facebook: 'פייסבוק', google: 'גוגל', other: 'אתר אחר', direct: 'ישיר' };
  const PLATFORM = { instagram: 'אינסטגרם', facebook: 'פייסבוק', messenger: 'מסנג׳ר', audience_network: 'Audience Network', threads: 'Threads' };
  const placeName = (pl, pos) => (PLATFORM[pl] || pl) + ' · ' + (/reel/.test(pos) ? 'רילס' : /stor/.test(pos) ? 'סטורי' : /feed/.test(pos) ? 'פיד' : /explore/.test(pos) ? 'אקספלור' : /search/.test(pos) ? 'חיפוש' : String(pos).replace(/_/g, ' '));
  const PLACE = { home: 'דף הבית', services: 'שירותים', credits: 'קרדיטים', work: 'עבודות', about: 'אודות', contact: 'צור קשר', faq: 'שאלות', footer: 'תחתית', book: 'הזמנה', 'book:1': 'הזמנה · בחירת שירות', 'book:2': 'הזמנה · פרטי הטרק', 'book:3': 'הזמנה · תשלום', 'book:4': 'הזמנה · סיום' };

  function keyOf(s) {
    const d = new Date(s + 'T00:00:00Z');
    if (state.grain === 'week') { d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return iso(d); }
    if (state.grain === 'month') return s.slice(0, 7) + '-01';
    if (state.grain === '2month') { const m = d.getUTCMonth() - (d.getUTCMonth() % 2); return d.getUTCFullYear() + '-' + String(m + 1).padStart(2, '0') + '-01'; }
    return s;
  }

  // the series and totals of one summary over one range
  function build(D, from, to) {
    const rate = state.rate || D.usdIls;
    const buckets = new Map();
    const empty = (k) => ({ period: k, revenue_usd: 0, fees_usd: 0, spend: 0, orders: 0, visits: 0, desktop: 0, mobile: 0 });
    const hours = D.mode === 'hours';
    if (hours) for (let i = 23; i >= 0; i--) { const k = jerHour(D.toMs - i * HOUR); if (!buckets.has(k)) buckets.set(k, empty(k)); }
    else for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) { const k = keyOf(iso(new Date(t))); if (!buckets.has(k)) buckets.set(k, empty(k)); }
    const byDay = (s) => buckets.get(keyOf(s));
    const spendOf = (r) => r.currency === 'USD' ? r.spend * rate : r.spend;
    for (const r of D.adSpend) { const b = hours ? buckets.get(r.hour) : byDay(r.date); if (b) b.spend += spendOf(r); }
    if (hours) for (const v of (D.visitTimes || [])) { const b = buckets.get(jerHour(v.t)); if (b) { b.visits++; if (v.device === 'mobile') b.mobile++; else b.desktop++; } }
    else for (const r of D.visits) { const b = byDay(r.date); if (b) { b.desktop += r.desktop; b.mobile += r.mobile; b.visits += r.total; } }
    for (const o of D.orders) {
      if (!D.revenueStatuses.includes(o.status)) continue;
      const b = hours ? buckets.get(jerHour(Date.parse(o.paid_at))) : byDay(String(o.paid_at).slice(0, 10));
      if (b) { b.orders++; b.revenue_usd += o.amount_usd; b.fees_usd += o.fee_usd || 0; }
    }
    const series = [...buckets.values()].map((b) => {
      const revenue = b.revenue_usd * rate, fees = b.fees_usd * rate;
      return { ...b, revenue, fees, profit: revenue - fees - b.spend, conv: b.visits ? b.orders / b.visits : 0 };
    });
    const sum = (f) => series.reduce((a, r) => a + r[f], 0);
    const t = { revenue: sum('revenue'), fees: sum('fees'), spend: sum('spend'), orders: sum('orders'), visits: sum('visits'), desktop: sum('desktop'), mobile: sum('mobile') };
    t.profit = t.revenue - t.fees - t.spend;
    t.conv = t.visits ? t.orders / t.visits : null;
    t.roas = t.spend > 0 ? t.revenue / t.spend : null;
    const f = Object.fromEntries((D.funnel || []).map((r) => [r.status, r.n]));
    t.started = Object.values(f).reduce((a, n) => a + n, 0);
    t.abandoned = (f.reserved || 0) + (f.pending || 0);
    return { series, t };
  }

  const METRICS = [
    { id: 'profit', label: 'רווח נקי', key: 'profit', f: 'ils', up: 'good', sign: true, desc: 'הכנסות פחות עמלות PayPal פחות הוצאה על מודעות' },
    { id: 'revenue', label: 'הכנסות', key: 'revenue', f: 'ils', up: 'good', desc: 'סכום ההזמנות ששולמו, מומר לשקלים' },
    { id: 'spend', label: 'הוצאה על מודעות', key: 'spend', f: 'ils', up: 'bad', needs: 'ads', desc: 'קמפיינים של האתר במטא' },
    { id: 'visits', label: 'ביקורים', key: 'visits', f: 'int', up: 'good', desc: 'ביקורים באתר. כל לשונית פתוחה היא ביקור אחד' },
    { id: 'orders', label: 'הזמנות', key: 'orders', f: 'int', up: 'good', desc: 'הזמנות ששולמו באתר' },
    { id: 'conv', label: 'המרה', key: 'conv', f: 'pct', up: 'good', desc: 'הזמנות ששולמו חלקי ביקורים' },
  ];

  function deltaText(cur, prev, m) {
    if (prev == null || cur == null) return ['', ''];
    if (!cur && !prev) return ['ללא שינוי', ''];
    if (m.f === 'pct') { const d = (cur - prev) * 100; return [(d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(2) + ' נק׳', (d >= 0) === (m.up === 'good') ? 'good' : 'bad']; }
    if (!prev) return ['▲ חדש', m.up === 'good' ? 'good' : 'bad'];
    const ch = (cur - prev) / Math.abs(prev);
    return [(ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch * 100).toFixed(0) + '%', (ch >= 0) === (m.up === 'good') ? 'good' : 'bad'];
  }

  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  // a smooth line through the points (quadratic curves through the midpoints)
  function smooth(pts) {
    if (!pts.length) return '';
    if (pts.length === 1) return 'M' + pts[0][0] + ' ' + pts[0][1];
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2, my = (pts[i - 1][1] + pts[i][1]) / 2;
      d += ' Q' + pts[i - 1][0].toFixed(1) + ' ' + pts[i - 1][1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    const l = pts[pts.length - 1];
    return d + ' L' + l[0].toFixed(1) + ' ' + l[1].toFixed(1);
  }
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  function short(v, f) {
    if (f === 'pct') return (v * 100).toFixed(1) + '%';
    const a = Math.abs(v), s = a >= 1e6 ? (v / 1e6).toFixed(1).replace(/\\.0$/, '') + 'M' : a >= 1e3 ? (v / 1e3).toFixed(1).replace(/\\.0$/, '') + 'K' : String(Math.round(v * 100) / 100);
    return f === 'ils' ? '₪' + s : s;
  }

  function spark(svg, values, color) {
    svg.replaceChildren();
    const max = Math.max(...values, 0), min = Math.min(...values, 0), span = max - min || 1;
    const pts = values.map((v, i) => [values.length > 1 ? i * 42 / (values.length - 1) : 21, 16 - (v - min) / span * 14]);
    svgEl('path', { d: smooth(pts), fill: 'none', stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, svg);
  }

  let built = null;
  const hoverable = () => matchMedia('(hover: hover)').matches;
  function renderStrip() {
    const strip = $('#strip'); strip.replaceChildren();
    const adsOn = state.data.sources.adSpend.connected;
    for (const m of METRICS) {
      const off = m.needs === 'ads' && !adsOn;
      const cur = built.t[m.key], prev = built.P ? built.P[m.key] : null;
      const b = el('button', 'metric'); b.type = 'button'; b.dataset.metric = m.id;
      b.setAttribute('aria-expanded', String(state.open === m.id)); b.setAttribute('aria-controls', 'pop');
      b.appendChild(el('span', 'l', m.label));
      const row = el('span', 'row');
      const v = el('span', 'v num', off ? '—' : fmt[m.f](cur));
      if (m.sign && !off) { v.classList.toggle('pos', cur > 0); v.classList.toggle('neg', cur < 0); }
      row.appendChild(v);
      const s = svgEl('svg', { width: 42, height: 18, viewBox: '0 0 42 18', 'aria-hidden': 'true' });
      spark(s, built.series.map((r) => r[m.key]), state.open === m.id ? C.accent : C.prev);
      row.appendChild(s);
      b.appendChild(row);
      const [dt, dc] = off ? ['מטא לא מחובר', ''] : deltaText(cur, prev, m);
      b.appendChild(el('span', 'd ' + dc, dt));
      b.addEventListener('mouseenter', () => { if (hoverable()) openPop(m.id); });
      b.addEventListener('focus', () => openPop(m.id));
      b.addEventListener('click', () => { if (!hoverable() && state.open === m.id) closePop(); else openPop(m.id); });
      strip.appendChild(b);
    }
  }

  function openPop(id) {
    if (state.open === id) return;
    state.open = id;
    $$('.metric').forEach((b) => {
      const on = b.dataset.metric === id;
      b.setAttribute('aria-expanded', String(on));
      const m = METRICS.find((x) => x.id === b.dataset.metric);
      spark(b.querySelector('svg'), built.series.map((r) => r[m.key]), on ? C.accent : C.prev);
    });
    drawPop();
  }
  function closePop() {
    state.open = null; $('#pop').hidden = true;
    $$('.metric').forEach((b) => { b.setAttribute('aria-expanded', 'false'); const m = METRICS.find((x) => x.id === b.dataset.metric); spark(b.querySelector('svg'), built.series.map((r) => r[m.key]), C.prev); });
  }
  $('#metrics').addEventListener('mouseleave', () => { if (hoverable()) closePop(); });
  document.addEventListener('click', (e) => { if (state.open && !e.target.closest('#metrics')) closePop(); });

  function drawPop() {
    const pop = $('#pop'), m = METRICS.find((x) => x.id === state.open);
    if (!m || !built) { pop.hidden = true; return; }
    const off = m.needs === 'ads' && !state.data.sources.adSpend.connected;
    const idx = METRICS.indexOf(m), cols = getComputedStyle($('#strip')).gridTemplateColumns.split(' ').length;
    pop.style.insetInlineStart = ''; pop.style.insetInlineEnd = '';
    if (cols === 6) { if (idx < 3) pop.style.insetInlineStart = (idx * 16.66) + '%'; else pop.style.insetInlineEnd = ((5 - idx) * 16.66) + '%'; }
    else pop.style.insetInlineStart = '0';
    $('#pop-big').textContent = off ? '—' : fmt[m.f](built.t[m.key]);
    $('#pop-title').textContent = m.label + ' לאורך זמן';
    $('#pop-desc').textContent = m.desc;
    $('#pop-cur-range').textContent = state.mode === 'hours' ? '24 השעות האחרונות' : dmy(state.from) + ' – ' + dmy(state.to);
    $('#pop-prev-range').textContent = state.mode === 'hours' ? '24 השעות שלפניהן' : dmy(state.prevFrom) + ' – ' + dmy(state.prevTo);
    pop.setAttribute('aria-label', m.label + ' לאורך זמן');
    pop.hidden = false;
    drawBreakdown(m);
    const box = $('#pop-chart'); box.replaceChildren();
    if (off) { box.appendChild(el('p', 'empty', 'מטא עוד לא מחובר.')); return; }
    const cur = built.series.map((r) => r[m.key]);
    const prevS = built.prevSeries ? built.prevSeries.map((r) => r[m.key]) : [];
    const W = 584, H = 210, L = 52, T = 10, B = 160;
    // round steps on the axis: whole numbers stay whole, money in round shekels
    const maxV = Math.max(...cur, ...prevS, 0), minV = Math.min(0, ...cur, ...prevS);
    let step = niceMax(Math.max(maxV - minV, m.f === 'pct' ? 0.0003 : 1) / 3);
    if (m.f !== 'pct') step = Math.max(1, Math.round(step));
    const lo = Math.floor(minV / step) * step, hi = Math.max(Math.ceil(maxV / step) * step, lo + step);
    const y = (v) => B - (v - lo) / (hi - lo) * (B - T);
    const n = Math.max(cur.length, 1), x = (i) => L + (n > 1 ? i * (W - L) / (n - 1) : (W - L) / 2);
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': m.label + ' לאורך זמן' }, box);
    for (let v = lo; v <= hi + step / 1000; v += step) {
      svgEl('line', { x1: L, x2: W, y1: y(v), y2: y(v), stroke: Math.abs(v) < step / 1000 ? C.base : C.line }, svg);
      svgEl('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, svg).textContent = short(Math.abs(v) < step / 1000 ? 0 : v, m.f);
    }
    const labels = built.series.map((r) => r.period);
    const every = Math.max(1, Math.ceil(n / 5));
    labels.forEach((p, i) => {
      if (i % every !== 0 && i !== n - 1) return;
      if (i !== n - 1 && n - 1 - i < every / 2) return;
      const t = svgEl('text', { x: x(i), y: 186, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, svg);
      t.textContent = periodLabel(p, false);
    });
    if (prevS.length) svgEl('path', { d: smooth(prevS.map((v, i) => [x(i), y(v)])), fill: 'none', stroke: C.prev, 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }, svg);
    svgEl('path', { d: smooth(cur.map((v, i) => [x(i), y(v)])), fill: 'none', stroke: C.accent, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, svg);
    const guide = svgEl('line', { y1: T, y2: B, stroke: 'rgba(245,239,230,.18)', visibility: 'hidden' }, svg);
    const dot = svgEl('circle', { r: 5, fill: C.accent, stroke: '#141019', 'stroke-width': 2, visibility: 'hidden' }, svg);
    const tip = el('div', 'tip'); tip.hidden = true; box.appendChild(tip);
    const prevLabels = built.prevSeries ? built.prevSeries.map((r) => r.period) : [];
    svg.addEventListener('pointermove', (ev) => {
      const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * W / r.width;
      const i = Math.max(0, Math.min(n - 1, Math.round((px - L) / ((W - L) / Math.max(n - 1, 1)))));
      guide.setAttribute('x1', x(i)); guide.setAttribute('x2', x(i)); guide.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(cur[i])); dot.setAttribute('visibility', 'visible');
      tip.replaceChildren();
      tip.appendChild(el('b', '', m.label));
      const l1 = el('span'); const i1 = el('i'); i1.style.background = C.accent; l1.append(i1, periodLabel(labels[i], true)); tip.appendChild(l1);
      tip.appendChild(el('span', 'val num', fmt[m.f](cur[i])));
      if (prevS.length && i < prevS.length) {
        const l2 = el('span'); const i2 = el('i'); i2.style.background = C.prev; l2.append(i2, periodLabel(prevLabels[i], true)); tip.appendChild(l2);
        tip.appendChild(el('span', 'val prev num', fmt[m.f](prevS[i])));
      }
      tip.hidden = false;
      const left = x(i) / W * r.width + 14, max = r.width - tip.offsetWidth - 4;
      tip.style.left = (left > max ? x(i) / W * r.width - tip.offsetWidth - 14 : left) + 'px';
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; guide.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); });
  }

  // where it came from, inside the window: ad spend by placement, visits by source
  function breakdownRows(box, rows) {
    const total = rows.reduce((a, r) => a + r.value, 0) || 1;
    for (const r of rows) {
      const row = el('div', 'brk');
      row.appendChild(el('span', '', r.label));
      const bar = el('span', 'bar'); const fill = el('i'); fill.style.width = (r.value / total * 100) + '%'; bar.appendChild(fill); row.appendChild(bar);
      const cell = el('span', 'val'); cell.appendChild(el('b', 'num', r.text)); if (r.note) cell.appendChild(el('small', '', r.note)); row.appendChild(cell);
      box.appendChild(row);
    }
  }
  function placementRows() {
    const D = state.data, rate = state.rate || D.usdIls;
    return (D.placements || []).filter((r) => r.spend > 0 || r.clicks > 0).map((r) => {
      const spend = r.currency === 'USD' ? r.spend * rate : r.spend;
      return { label: placeName(r.platform, r.position), value: spend, text: fmt.ils(spend), note: fmt.int(r.clicks) + ' קליקים' + (r.clicks ? ' · ₪' + (spend / r.clicks).toFixed(2) + ' לקליק' : '') };
    });
  }
  function drawBreakdown(m) {
    const box = $('#pop-extra'); box.replaceChildren(); box.hidden = true;
    const D = state.data;
    if (m.id === 'spend' && D.sources.adSpend.connected) {
      box.hidden = false; box.appendChild(el('span', '', 'לפי מיקום המודעה'));
      if (state.mode === 'hours') { box.appendChild(el('p', 'empty', 'הפירוט לפי מיקום זמין בטווחים של ימים.')); return; }
      const rows = placementRows();
      if (rows.length) breakdownRows(box, rows); else box.appendChild(el('p', 'empty', 'אין הוצאה בתקופה הזו.'));
    } else if (m.id === 'visits') {
      const rows = (D.visitSources || []).map((r) => ({ label: SRC[r.source] || r.source, value: r.visits, text: fmt.int(r.visits) }));
      box.hidden = false; box.appendChild(el('span', '', 'מאיפה נכנסו'));
      if (rows.length) breakdownRows(box, rows); else box.appendChild(el('p', 'empty', 'עוד אין ביקורים בתקופה הזו.'));
    }
  }

  function render() {
    if (!state.data) return;
    const D = state.data;
    const a = build(D, state.from, state.to);
    const p = state.prev ? build(state.prev, state.prevFrom, state.prevTo) : null;
    built = { series: a.series, t: a.t, P: p ? p.t : null, prevSeries: p ? p.series : null };
    const t = a.t, adsOn = D.sources.adSpend.connected;
    const span = Math.round((Date.parse(state.to) - Date.parse(state.from)) / DAY) + 1;
    $('#compare-label').textContent = state.mode === 'hours' ? 'מול 24 השעות הקודמות' : 'מול ' + span + ' הימים הקודמים';
    renderStrip();
    if (state.open) { const o = state.open; state.open = null; openPop(o); }

    const lede = $('#lede'); lede.replaceChildren();
    const say = (...parts) => parts.forEach((x, i) => { const n = i % 2 ? el('b') : document.createTextNode(''); n.textContent = x; lede.appendChild(n); });
    if (t.orders > 0) say('נכנסו ', fmt.ils(t.revenue), ' מ־', fmt.int(t.orders) + (t.orders === 1 ? ' הזמנה' : ' הזמנות'), '. אחרי עמלות ומודעות נשארו ', fmt.ils(t.profit), '.');
    else if (adsOn && t.spend > 0) say('עדיין אין מכירות בתקופה הזו. הוצאת ', fmt.ils(t.spend), ' על מודעות, והאתר קיבל ', fmt.int(t.visits) + ' ביקורים', '.');
    else say('עדיין אין מכירות בתקופה הזו. האתר קיבל ', fmt.int(t.visits) + ' ביקורים', '.');

    // funnel
    for (const n of $$('[data-k]')) n.textContent = fmt.int(t[n.dataset.k]);
    const top = Math.max(t.visits, t.started, t.orders, 1);
    $$('[data-w]').forEach((i) => { i.style.width = (t[i.dataset.w] / top * 100) + '%'; });
    $('#rate-started').textContent = t.visits ? fmt.pct(t.started / t.visits) : '';
    $('#rate-paid').textContent = t.started ? fmt.pct(t.orders / t.started) : '';
    $('#fun-note').textContent = (t.abandoned ? t.abandoned + (t.abandoned === 1 ? ' התחיל הזמנה ולא סיים' : ' התחילו הזמנה ולא סיימו') + ' · ' : '') + 'ROAS ' + fmt.x(t.roas) + ' · דסקטופ ' + fmt.int(t.desktop) + ' · מובייל ' + fmt.int(t.mobile);

    // where visits come from
    const totalGeo = (D.countries || []).reduce((s, c) => s + c.visits, 0);
    $('#geo-total').textContent = totalGeo ? fmt.int(totalGeo) + ' ביקורים' : '';
    const cBox = $('#countries'); cBox.replaceChildren();
    for (const c of (D.countries || [])) {
      const row = el('div', 'crow'); row.appendChild(el('span', 'cc', c.country === '??' ? '—' : c.country));
      const mid = el('div'); mid.appendChild(el('span', '', c.country === '??' ? 'לא ידוע' : regionName(c.country)));
      const bar = el('div', 'bar'); const fill = el('i'); fill.style.width = (c.visits / totalGeo * 100) + '%'; bar.appendChild(fill); mid.appendChild(bar);
      row.appendChild(mid); row.appendChild(el('span', 'p', Math.round(c.visits / totalGeo * 100) + '%'));
      cBox.appendChild(row);
    }
    const ciBox = $('#cities'); ciBox.replaceChildren();
    for (const c of (D.cities || [])) {
      const row = el('div', 'city'); const nm = el('span', '', c.city + ' '); nm.appendChild(el('small', '', '· ' + c.country)); row.appendChild(nm); row.appendChild(el('b', 'num', fmt.int(c.visits))); ciBox.appendChild(row);
    }
    if (!(D.cities || []).length && totalGeo) ciBox.appendChild(el('p', 'empty', 'עוד אין ערים.'));
    const sBox = $('#sources'); sBox.replaceChildren(); sBox.appendChild(el('span', '', 'הגיעו מ־'));
    for (const s of (D.visitSources || [])) { const pl = el('span', 'pill'); pl.append(el('b', 'num', fmt.int(s.visits)), ' ' + (SRC[s.source] || s.source)); sBox.appendChild(pl); }
    sBox.hidden = !(D.visitSources || []).length;
    $('#geo-empty').hidden = totalGeo > 0;
    $('.geo').hidden = !totalGeo;

    renderTasks();

    // campaigns
    const camps = new Map();
    for (const r of D.adSpend) { const c = camps.get(r.campaign) || { spend: 0, clicks: 0 }; c.spend += r.currency === 'USD' ? r.spend * (state.rate || D.usdIls) : r.spend; c.clicks += r.clicks; camps.set(r.campaign, c); }
    const cb = $('#camp-rows'); cb.replaceChildren();
    const live = [...camps].filter(([, c]) => c.spend > 0).sort((x, y) => y[1].spend - x[1].spend);
    for (const [name, c] of live) { const tr = el('tr'); [name || '—', fmt.ils(c.spend), fmt.int(c.clicks)].forEach((v, i) => tr.appendChild(el('td', i ? 'n' : '', v))); cb.appendChild(tr); }
    $('#camp-empty').hidden = live.length > 0;
    $('#camp-empty').textContent = adsOn ? 'אין הוצאה על מודעות בתקופה הזו.' : 'מטא עוד לא מחובר.';
    $('#camp-n').textContent = live.length ? fmt.int(live.length) : '';
    const pBox = $('#placements'); pBox.replaceChildren();
    const pRows = state.mode === 'hours' ? [] : placementRows();
    pBox.hidden = !pRows.length;
    if (pRows.length) { pBox.appendChild(el('span', '', 'לפי מיקום')); breakdownRows(pBox, pRows); }

    // clients
    const tbody = $('#rows'); tbody.replaceChildren();
    const statusName = { paid: 'שולם', partially_refunded: 'הוחזר חלקית', refunded: 'הוחזר', reversed: 'בוטל בבנק' };
    for (const o of D.orders) {
      const tr = el('tr');
      [jerStamp(o.paid_at), o.artist || '—', o.track || '—', o.service || '—', o.options || '—', fmt.usd(o.amount_usd), o.fee_usd == null ? '—' : fmt.usd(o.fee_usd), null, o.ref].forEach((v, i) => {
        const td = el('td', i === 5 || i === 6 ? 'n' : '');
        if (i === 7) td.appendChild(el('span', 'st ' + o.status, statusName[o.status] || o.status)); else td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    $('#rows-empty').hidden = D.orders.length > 0;
    $('#orders-n').textContent = D.orders.length ? fmt.int(D.orders.length) + ' בתקופה' : '';
    showSync(D.sources);
  }

  // tasks: each can be marked done; "clear all" marks every open one
  function renderTasks() {
    const list = (state.data && state.data.tasks) || [];
    const ul = $('#tasks'); ul.replaceChildren();
    for (const t of list) {
      const li = el('li', t.kind); li.appendChild(el('span', '', t.text));
      const b = el('button'); b.type = 'button'; b.title = 'סמן כטופל'; b.setAttribute('aria-label', 'סמן כטופל: ' + t.text);
      b.innerHTML = CHECK;
      b.addEventListener('click', () => dismiss([t.key]));
      li.appendChild(b); ul.appendChild(li);
    }
    $('#tasks-n').textContent = list.length ? String(list.length) : '';
    $('#tasks-empty').hidden = list.length > 0;
    $('#tasks-clear').hidden = list.length < 2;
  }
  async function dismiss(keys) {
    if (!keys.length) return;
    state.data.tasks = state.data.tasks.filter((t) => !keys.includes(t.key));
    renderTasks();
    try { await fetch(BASE + '/api/dismiss', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys }) }); } catch {}
  }
  $('#tasks-clear').addEventListener('click', () => dismiss(((state.data && state.data.tasks) || []).map((t) => t.key)));

  function ago(at) {
    const m = Math.max(0, Math.round((Date.now() - Date.parse(at)) / 60000));
    return m < 1 ? 'עכשיו' : m < 60 ? 'לפני ' + m + ' דק׳' : m < 1440 ? 'לפני ' + Math.round(m / 60) + ' שע׳' : 'לפני ' + Math.round(m / 1440) + ' ימים';
  }
  function showSync(sources) {
    const s = sources.adSpend, box = $('#sync');
    $('#refresh').hidden = s.state === 'not_connected';
    box.classList.toggle('err', s.state === 'error');
    box.textContent = s.state === 'error' ? 'העדכון האחרון ממטא נכשל.' : s.at ? 'מטא עודכן ' + ago(s.at) + ' · כל 3 שעות' : '';
  }

  async function refresh() {
    const b = $('#refresh'); if (b.disabled || b.hidden) return;
    b.disabled = true; b.dataset.state = 'busy';
    try {
      const r = await fetch(BASE + '/api/refresh', { method: 'POST', credentials: 'same-origin' });
      if (r.status === 401) { location.reload(); return; }
      await load(); b.dataset.state = 'done'; setTimeout(() => { b.dataset.state = ''; }, 1800);
    } catch { b.dataset.state = ''; } finally { b.disabled = false; }
  }
  $('#refresh').addEventListener('click', refresh);

  async function summary(from, to) {
    const r = await fetch(BASE + '/api/summary?from=' + from + '&to=' + to, { credentials: 'same-origin', cache: 'no-store' });
    if (r.status === 401) { location.reload(); throw new Error('signed out'); }
    return r.json();
  }
  async function recentData(offset) {
    const r = await fetch(BASE + '/api/recent?offset=' + offset, { credentials: 'same-origin', cache: 'no-store' });
    if (r.status === 401) { location.reload(); throw new Error('signed out'); }
    return r.json();
  }
  async function load() {
    document.body.classList.add('loading');
    const span = Math.round((Date.parse(state.to) - Date.parse(state.from)) / DAY) + 1;
    state.prevTo = iso(new Date(Date.parse(state.from) - DAY));
    state.prevFrom = iso(new Date(Date.parse(state.from) - span * DAY));
    const [data, prev] = state.mode === 'hours'
      ? await Promise.all([recentData(0), recentData(24)])
      : await Promise.all([summary(state.from, state.to), summary(state.prevFrom, state.prevTo)]);
    document.body.classList.remove('loading');
    if (data.error) { $('#lede').textContent = 'הטווח לא תקין.'; return; }
    state.data = data; state.prev = prev.error ? null : prev;
    if (!state.rate) $('#rate').value = data.usdIls;
    render();
  }

  /* live: every 15 s while the page is visible */
  let liveTimer = null;
  async function live() {
    try {
      const r = await fetch(BASE + '/api/live', { credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 401) { location.reload(); return; }
      const d = await r.json();
      $('#live-n').textContent = String(d.count);
      $('#nav-live').textContent = d.count ? '● ' + d.count : '';
      $('#live').classList.toggle('on', d.count > 0);
      $('#live-quiet').hidden = d.count > 0;
      const box = $('#live-pills'); box.replaceChildren();
      const group = (key, names) => { const c = new Map(); for (const v of d.visits) { const k = v[key]; if (!k) continue; c.set(k, (c.get(k) || 0) + 1); } return [...c].sort((x, y) => y[1] - x[1]).map(([k, n]) => [names ? (names[k] || k) : k, n, k]); };
      const add = (label, n, hot) => { const s = el('span', 'pill' + (hot ? ' hot' : '')); s.append(el('b', 'num', String(n)), ' ' + label); box.appendChild(s); };
      for (const [l, n, k] of group('place', PLACE)) add(l, n, String(k).startsWith('book'));
      for (const [l, n] of group('source', SRC)) add(l, n);
      for (const [l, n] of group('city')) add(l, n);
      if (!d.visits.some((v) => v.city)) for (const [l, n] of group('country')) add(regionName(l), n);
    } catch {}
  }
  const liveStart = () => { if (!liveTimer && document.visibilityState === 'visible') { live(); liveTimer = setInterval(live, 15000); } };
  const liveStop = () => { clearInterval(liveTimer); liveTimer = null; };
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' ? liveStart() : liveStop());

  /* range menu */
  const menu = $('#range-menu'), rbtn = $('#range-btn');
  const setMenu = (open) => { menu.hidden = !open; rbtn.setAttribute('aria-expanded', String(open)); };
  rbtn.addEventListener('click', () => setMenu(menu.hidden));
  document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('.menu-wrap')) setMenu(false); });
  function rangeLabel() {
    if (state.mode === 'hours') return '24 השעות האחרונות';
    const span = Math.round((Date.parse(state.to) - Date.parse(state.from)) / DAY) + 1, atToday = state.to === iso(today);
    if (atToday && state.from === iso(today).slice(0, 8) + '01') return 'החודש';
    if (atToday && [7, 28, 90, 365].includes(span)) return span === 365 ? 'השנה האחרונה' : span + ' הימים האחרונים';
    return dmy(state.from) + ' – ' + dmy(state.to);
  }
  function syncControls() {
    $('#from').value = state.from; $('#to').value = state.to;
    if (state.rate) $('#rate').value = state.rate;
    $('#range-label').textContent = rangeLabel();
    const span = Math.round((Date.parse(state.to) - Date.parse(state.from)) / DAY) + 1, atToday = state.to === iso(today);
    const hours = state.mode === 'hours';
    $$('[data-preset]').forEach((b) => { const v = b.dataset.preset; b.setAttribute('aria-pressed', String(v === '24h' ? hours : !hours && atToday && (v === 'month' ? state.from === iso(today).slice(0, 8) + '01' : span === Number(v)))); });
    $$('[data-grain]').forEach((b) => { b.disabled = hours; });
    $$('[data-grain]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.grain === state.grain)));
  }
  function setRange(v) {
    if (v === '24h') { state.mode = 'hours'; syncControls(); load(); return; }
    state.mode = 'days';
    state.to = iso(today);
    state.from = v === 'month' ? iso(today).slice(0, 8) + '01' : iso(new Date(today - (Number(v) - 1) * DAY));
    syncControls(); load();
  }
  function setGrain(g) { state.grain = g; store.set('grain', g); syncControls(); render(); }
  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => { setRange(b.dataset.preset); setMenu(false); }));
  $$('[data-grain]').forEach((b) => b.addEventListener('click', () => setGrain(b.dataset.grain)));
  for (const id of ['from', 'to']) $('#' + id).addEventListener('change', (e) => {
    const v = e.target.value; if (!v || !e.target.validity.valid) return;
    state.mode = 'days'; state[id] = v; if (state.from > state.to) { if (id === 'from') state.to = v; else state.from = v; }
    syncControls(); load();
  });
  $('#rate').addEventListener('change', (e) => { const n = Number(e.target.value); if (n >= 1 && n <= 10) { state.rate = n; store.set('rate', n); render(); } });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 150); });

  /* side menu: mark the section in view */
  const navs = $$('[data-nav]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) navs.forEach((a) => a.classList.toggle('on', a.dataset.nav === e.target.id));
    }, { rootMargin: '-30% 0px -60% 0px' });
    navs.forEach((a) => { const t = document.getElementById(a.dataset.nav); if (t && a.dataset.nav !== 'overview') io.observe(t); });
  }
  navs[0].classList.add('on');

  /* ⌘K */
  const scrim = $('#scrim'), pq = $('#pq'), plist = $('#plist');
  let items = [], sel = 0, lastFocus = null;
  const go = (id) => { const t = document.getElementById(id); if (t) { if (t.tagName === 'DETAILS') t.open = true; t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  function actions() {
    const list = [
      ['טווח', '24 השעות האחרונות', () => setRange('24h')],
      ['טווח', '7 הימים האחרונים', () => setRange('7')],
      ['טווח', '28 הימים האחרונים', () => setRange('28')],
      ['טווח', 'החודש', () => setRange('month')],
      ['טווח', '90 הימים האחרונים', () => setRange('90')],
      ['טווח', 'השנה האחרונה', () => setRange('365')],
      ['טווח', 'טווח מותאם ושער דולר', () => { setMenu(true); $('#from').focus(); }],
      ['תצוגה', 'גרפים לפי יום', () => setGrain('day')],
      ['תצוגה', 'גרפים לפי שבוע', () => setGrain('week')],
      ['תצוגה', 'גרפים לפי חודש', () => setGrain('month')],
      ['מעבר', 'מאיפה המבקרים', () => go('geo')],
      ['מעבר', 'לטיפול', () => go('tasks-card')],
      ['מעבר', 'משפך', () => go('funnel')],
      ['מעבר', 'קמפיינים', () => go('campaigns')],
      ['מעבר', 'לקוחות ושירותים', () => go('orders')],
      ['פעולות', 'רענון ממטא עכשיו', refresh, !$('#refresh').hidden],
      ['פעולות', 'נקה את כל המשימות', () => $('#tasks-clear').click(), ((state.data && state.data.tasks) || []).length > 1],
      ['פעולות', 'פתח את Ads Manager', () => window.open('https://adsmanager.facebook.com/', '_blank', 'noopener')],
      ['פעולות', 'פתח את האתר', () => window.open('https://evoxelmusic.com/', '_blank', 'noopener')],
      ['פעולות', 'יציאה', () => document.querySelector('form[action$="/logout"]').submit()],
    ].filter((a) => a[3] !== false);
    for (const o of (state.data ? state.data.orders : [])) list.push(['לקוחות', (o.artist || '—') + ' · ' + (o.service || '') + ' · ' + o.ref, () => go('orders'), true, dmy(String(o.paid_at).slice(0, 10))]);
    return list;
  }
  function draw() {
    const q = pq.value.trim().toLowerCase();
    items = actions().filter(([g, name]) => !q || (g + ' ' + name).toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, items.length - 1));
    plist.replaceChildren();
    if (!items.length) { plist.appendChild(el('li', 'none', 'לא נמצא. נסה מילה אחרת.')); return; }
    let grp = null;
    items.forEach(([g, name, , , hint], i) => {
      if (g !== grp) { grp = g; plist.appendChild(el('li', 'g', g)); }
      const li = el('li', 'it', name); li.id = 'pi' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === sel));
      if (hint) li.appendChild(el('small', '', hint));
      li.addEventListener('click', () => run(i)); li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; mark(); } });
      plist.appendChild(li);
    });
    pq.setAttribute('aria-activedescendant', 'pi' + sel);
  }
  function mark() { $$('#plist .it').forEach((li, i) => li.setAttribute('aria-selected', String(i === sel))); pq.setAttribute('aria-activedescendant', 'pi' + sel); const c = document.getElementById('pi' + sel); if (c) c.scrollIntoView({ block: 'nearest' }); }
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
    else if (e.key === 'Escape') { if (!scrim.hidden) closePalette(); else if (!menu.hidden) setMenu(false); else if (state.open) closePop(); }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) $('#open-palette kbd').textContent = 'Ctrl K';

  syncControls(); load(); liveStart();
})();
</script></body></html>`;
}
