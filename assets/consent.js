/* ============================================================
   EVOXEL SOUNDS — cookie consent + Meta Pixel loader

   How it works
   - Visitors in the EU, EEA, UK and Switzerland (or anyone whose
     country can't be detected) see a banner. The Pixel loads only
     after they click Accept.
   - Everyone else gets no banner; the Pixel loads by default and
     they can switch it off any time from "Cookie settings".
   - The choice is kept in this browser for 12 months.

   To switch the Pixel on: put the Pixel ID below.
   While it is empty, nothing is sent to Meta.
   ============================================================ */
(function(){
  var PIXEL_ID = '';                      // e.g. '123456789012345'
  var KEY = 'evx-consent', MAX_AGE = 365 * 24 * 3600 * 1000;
  var CONSENT_REGIONS = ('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE ' +
                         'IS LI NO GB CH').split(' ');

  function readChoice(){
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && (c.v === 'accept' || c.v === 'reject') && Date.now() - c.t < MAX_AGE) return c.v;
    } catch(e){}
    return null;
  }
  function saveChoice(v){ try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch(e){} }

  /* ---------- country (Cloudflare edge first, then a public lookup) ---------- */
  function timeout(ms){ return new Promise(function(_, rej){ setTimeout(function(){ rej(new Error('timeout')); }, ms); }); }
  function fetchT(url, ms){ return Promise.race([fetch(url, { cache: 'no-store' }), timeout(ms || 2500)]); }
  function detectCountry(){
    try { var o = new URLSearchParams(location.search).get('cc'); if (o && /^[a-z]{2}$/i.test(o)) return Promise.resolve(o.toUpperCase()); } catch(e){}
    return fetchT('/cdn-cgi/trace', 1500)
      .then(function(r){ return r.ok ? r.text() : ''; })
      .then(function(t){ var m = t.match(/^loc=([A-Z]{2})$/m); if (m && m[1] !== 'XX') return m[1]; throw 0; })
      .catch(function(){
        return fetchT('https://api.country.is/').then(function(r){ return r.json(); })
          .then(function(d){ return (d && /^[A-Z]{2}$/.test(d.country)) ? d.country : null; })
          .catch(function(){ return null; });
      });
  }

  /* ---------- Meta Pixel ---------- */
  var pixelOn = false;
  function loadPixel(){
    if (pixelOn || !PIXEL_ID) return;
    pixelOn = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  // site code calls this for events (booking started, purchase, request). Does nothing without consent.
  window.evxTrack = function(name, params){ if (pixelOn && window.fbq) window.fbq('track', name, params || {}); };

  /* ---------- banner ---------- */
  var css = '' +
    '.evx-ck{position:fixed;z-index:950;left:50%;transform:translateX(-50%);bottom:calc(20px + env(safe-area-inset-bottom,0px));width:min(900px,calc(100vw - 32px));' +
    'background:rgba(0,0,0,.25);-webkit-backdrop-filter:blur(10px) saturate(1.4);backdrop-filter:blur(10px) saturate(1.4);color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:18px;' +
    'padding:16px 18px 16px 24px;box-shadow:0 20px 50px -24px rgba(0,0,0,.6);display:flex;align-items:center;gap:24px;font:400 .95rem/1.5 "Hanken Grotesk",system-ui,sans-serif}' +
    '.evx-ck[hidden]{display:none!important}' +
    '.evx-ck p{margin:0;color:rgba(255,255,255,.88);flex:1;min-width:0;text-shadow:0 1px 8px rgba(0,0,0,.35)}' +
    '.evx-ck p b{color:#fff;font-weight:600}' +
    '.evx-ck p a{color:#f3c87a;text-underline-offset:3px}' +
    '.evx-ck-btns{display:flex;gap:8px;flex:none}' +
    '.evx-ck-btns button{font:600 .9rem "Hanken Grotesk",system-ui,sans-serif;padding:10px 22px;border-radius:100px;cursor:pointer;min-width:100px;background:rgba(0,0,0,.15);color:#fff;border:1.5px solid rgba(255,255,255,.6);transition:border-color .2s,color .2s}' +
    '.evx-ck-btns button:hover{border-color:#e6a23c;color:#e6a23c}' +
    '.evx-ck-btns button[aria-pressed="true"]{border-color:#e6a23c;color:#e6a23c}' +
    '.evx-ck a:focus-visible,.evx-ck button:focus-visible{outline:2px solid #e6a23c;outline-offset:3px}' +
    '.cookie-open{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;text-decoration:none}' +
    '@media(max-width:600px){.evx-ck{flex-direction:column;align-items:stretch;gap:12px;padding:16px}.evx-ck-btns button{flex:1}}' +
    '@media(prefers-reduced-transparency:reduce){.evx-ck{background:rgba(0,0,0,.92)}}' +
    'html.a11y-contrast .evx-ck{background:#000}';

  var box;
  function build(){
    if (box) return box;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    box = document.createElement('div');
    box.className = 'evx-ck'; box.hidden = true;
    box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML =
      '<p id="evxCkText"><b>One cookie, your call.</b> We use the Meta Pixel to measure how our ads perform. You can say no, and change your mind any time. <a href="privacy.html#cookies">Privacy Policy</a></p>' +
      '<div class="evx-ck-btns"><button type="button" data-ck="reject">Reject</button><button type="button" data-ck="accept">Accept</button></div>';
    box.addEventListener('click', function(e){
      var b = e.target.closest('[data-ck]'); if (!b) return;
      choose(b.getAttribute('data-ck'));
    });
    document.body.appendChild(box);
    return box;
  }
  function show(current){
    build();
    [].forEach.call(box.querySelectorAll('[data-ck]'), function(b){
      if (current) b.setAttribute('aria-pressed', String(b.getAttribute('data-ck') === current)); else b.removeAttribute('aria-pressed');
    });
    box.hidden = false;
  }
  function hide(){ if (box) box.hidden = true; }

  function choose(v){
    var wasOn = pixelOn;
    saveChoice(v);
    hide();
    if (v === 'accept') loadPixel();
    else if (wasOn){
      // stop the Pixel that is already running: clear its cookies and reload without it
      ['_fbp', '_fbc'].forEach(function(n){
        document.cookie = n + '=; Max-Age=0; path=/';
        document.cookie = n + '=; Max-Age=0; path=/; domain=.' + location.hostname.replace(/^www\./, '');
      });
      location.reload();
    }
  }

  /* "Cookie settings" links in the footers */
  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-cookie-settings]'); if (!t) return;
    e.preventDefault();
    show(readChoice() || (pixelOn ? 'accept' : null));
    var first = box.querySelector('[data-ck]'); if (first) first.focus();
  });

  function start(){
    var c = readChoice();
    if (c === 'accept') { loadPixel(); return; }
    if (c === 'reject') return;
    detectCountry().then(function(cc){
      if (!cc || CONSENT_REGIONS.indexOf(cc) !== -1) show(null);   // ask first
      else loadPixel();                                             // notice + opt-out regions
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
