/* ============================================================
   EVOXEL SOUNDS — live visitors (for the private dashboard)

   Says "someone is here" about once a minute while this tab is
   visible, and "left" when it is hidden or closed, so the dashboard
   can show who is on the site right now.

   - Anonymous: a random id kept only in this tab (sessionStorage).
     No cookies, nothing personal, nothing shared with the Meta Pixel.
   - Light: runs after the page is idle, sends nothing while the tab
     is hidden, and stops after 30 minutes without any activity.
   - Only on the real site (like the Pixel), so local copies and
     previews don't count as visitors.
   ============================================================ */
(function () {
  var LIVE_HOSTS = ['evoxelmusic.com', 'www.evoxelmusic.com'];
  var script = document.currentScript;
  var api = script && script.getAttribute('data-api');
  // a local test can point at a test server with ?liveapi=http://localhost:8788 (never on the real site)
  var testApi = LIVE_HOSTS.indexOf(location.hostname) === -1 && /^http:\/\/localhost:\d+$/.test(new URLSearchParams(location.search).get('liveapi') || '')
    ? new URLSearchParams(location.search).get('liveapi') : null;
  if (testApi) api = testApi;
  else if (LIVE_HOSTS.indexOf(location.hostname) === -1) return;
  if (!api || !window.fetch) return;

  var BEAT = 60000, CHECK = 10000, IDLE = 30 * 60000;
  var KEY = 'evx-live';

  // this visit: an id and where it came from, worked out once per tab
  var visit;
  try { visit = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { visit = null; }
  if (!visit || !visit.id) {
    var bytes = new Uint8Array(12), chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', id = '';
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    for (var i = 0; i < bytes.length; i++) id += chars[bytes[i] % 62] + chars[(bytes[i] >> 2) % 62];
    visit = { id: id, s: source() };
    try { sessionStorage.setItem(KEY, JSON.stringify(visit)); } catch (e) {}
  }

  function source() {
    var q = new URLSearchParams(location.search);
    var src = (q.get('utm_source') || '').toLowerCase(), med = (q.get('utm_medium') || '').toLowerCase();
    // ads carry utm_medium=paid and the placement Meta fills in ({{placement}}: Instagram_Reels, Instagram_Stories…)
    var where = (q.get('placement') || q.get('utm_content') || '').toLowerCase();
    var adKind = function () {
      if (/reel/.test(where)) return 'ad_reels';
      if (/stor/.test(where)) return 'ad_stories';
      if (/feed|explore/.test(where)) return 'ad_feed';
      return 'ad';
    };
    if (/paid|cpc|ppc|ads?$/.test(med) || /^(meta|fb|ig|facebook|instagram)[_-]?ads?$/.test(src) || (src && q.get('fbclid')) || (q.get('placement') && q.get('fbclid'))) return adKind();
    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    if (ref === location.hostname) ref = '';
    if (/instagram/.test(ref) || /^(ig|instagram)$/.test(src)) return 'instagram';
    if (/facebook|fb\.|messenger/.test(ref) || /^(fb|facebook)$/.test(src)) return q.get('fbclid') ? adKind() : 'facebook';
    if (q.get('fbclid')) return adKind();
    if (/google\./.test(ref) || q.get('gclid')) return 'google';
    if (ref || src) return 'other';
    return 'direct';
  }

  function device() {
    return (window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820) ? 'mobile' : 'desktop';
  }

  // which part of the site is in view: a booking step, or the section in the middle of the screen
  function place() {
    var hire = document.getElementById('view-hire');
    if (hire && !hire.hidden) {
      for (var n = 1; n <= 4; n++) { var p = document.getElementById('ck' + n); if (p && !p.hidden) return 'book:' + n; }
      return 'book';
    }
    // the section that spans the middle of the screen, by position (overlays and fixed layers can't hide it)
    var mid = (window.innerHeight || document.documentElement.clientHeight || 0) / 2;
    var secs = document.querySelectorAll('section[id], footer');
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) return (secs[i].id || 'footer').toLowerCase().slice(0, 40);
    }
    return 'home';
  }

  var dev = device(), lastActive = Date.now(), lastSent = 0, lastPlace = '', timer = null;

  /* ---------- the visit's path ----------
     Short codes for the steps a visit reached, so the dashboard can show where people drop off:
       s:<section>   the section was on screen (services, credits, work, about, contact, faq)
       d25 d50 d75 d90  scrolled that far down the page
       h             opened the booking page; b2 b3 b4  reached step 2 (track), 3 (pay), 4 (done)
       ba ab dl      played the before/after player, switched Before/After while playing, listened 30 s or 3 tracks
       pr en         pricing on screen, 60 s on the page and scrolled half of it
       ad fs pc      ticked an extra, started typing details, closed PayPal without paying
       ct            clicked a contact link (email, WhatsApp, Instagram)
     Everything stays in this tab until it is sent with the anonymous visit signal. */
  var steps = {}, stepsSent = '';
  var STEP_OF = { PlayBeforeAfter: 'ba', CompareAB: 'ab', DeepListen: 'dl', ViewPricing: 'pr', Engaged60s: 'en', SelectAddon: 'ad', FormStart: 'fs', PaymentCancel: 'pc' };
  function reach(code) { if (!steps[code]) { steps[code] = 1; lastSent = 0; } }
  function stepList() { return Object.keys(steps).sort().join(','); }
  addEventListener('evx:step', function (e) { if (STEP_OF[e.detail]) reach(STEP_OF[e.detail]); });
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { reach('s:' + e.target.id); seen.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -35% 0px' });
    ['services', 'credits', 'work', 'about', 'contact', 'faq'].forEach(function (id) { var el = document.getElementById(id); if (el) seen.observe(el); });
  }
  function depth() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (max <= 0) return;
    var f = scrollY / max;
    [25, 50, 75, 90].forEach(function (d) { if (f >= d / 100) reach('d' + d); });
  }
  function bookingStep(p) {
    if (p.indexOf('book') === 0) reach('h');
    var n = +p.split(':')[1];
    if (n >= 2) reach('b2');
    if (n >= 3) reach('b3');
    if (n >= 4) reach('b4');
  }
  var depthQueued = false;   // the deepest point reached, checked at most once a frame while scrolling
  addEventListener('scroll', function () { if (!depthQueued) { depthQueued = true; requestAnimationFrame(function () { depthQueued = false; depth(); }); } }, { passive: true });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && /^(mailto:|tel:)|wa\.me|whatsapp|instagram\.com/i.test(a.getAttribute('href'))) reach('ct');
  }, { passive: true, capture: true });

  function send(type) {
    var body = JSON.stringify({ t: type, id: visit.id, p: lastPlace, s: visit.s, d: dev, st: stepList() });
    stepsSent = stepList();
    try {
      if (type === 'leave' && navigator.sendBeacon) return navigator.sendBeacon(api + '/live', new Blob([body], { type: 'text/plain' }));
      fetch(api + '/live', { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain' }, keepalive: true, credentials: 'omit', mode: 'cors' }).catch(function () {});
    } catch (e) {}
  }

  function tick() {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastActive > IDLE) { stop(); return; }
    var now = place();
    depth(); bookingStep(now);
    if (now !== lastPlace || stepList() !== stepsSent || Date.now() - lastSent >= BEAT) { lastPlace = now; lastSent = Date.now(); send('ping'); }
  }
  function start() { if (!timer) { timer = setInterval(tick, CHECK); tick(); } }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function active() { lastActive = Date.now(); if (!timer && document.visibilityState === 'visible') start(); }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { addEventListener(ev, active, { passive: true }); });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { lastSent = 0; active(); }
    else { stop(); lastPlace = place(); depth(); bookingStep(lastPlace); send('leave'); lastSent = 0; }
  });
  addEventListener('pagehide', function () { send('leave'); });

  // first signal once the page has settled, so it never competes with loading
  (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(start, { timeout: 4000 });
})();
