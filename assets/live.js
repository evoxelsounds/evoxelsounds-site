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
    if (/paid|cpc|ads?$|ppc|social_paid/.test(med) || (src && q.get('fbclid')) ) return 'ad';
    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    if (ref === location.hostname) ref = '';
    if (/instagram/.test(ref) || /^(ig|instagram)$/.test(src)) return 'instagram';
    if (/facebook|fb\.|messenger/.test(ref) || /^(fb|facebook)$/.test(src)) return q.get('fbclid') ? 'ad' : 'facebook';
    if (q.get('fbclid')) return 'ad';
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
    var el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    var sec = el && el.closest ? el.closest('section[id], footer') : null;
    return sec ? (sec.id || 'footer').toLowerCase().slice(0, 40) : 'home';
  }

  var dev = device(), lastActive = Date.now(), lastSent = 0, lastPlace = '', timer = null;

  function send(type) {
    var body = JSON.stringify({ t: type, id: visit.id, p: lastPlace, s: visit.s, d: dev });
    try {
      if (type === 'leave' && navigator.sendBeacon) return navigator.sendBeacon(api + '/live', new Blob([body], { type: 'text/plain' }));
      fetch(api + '/live', { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain' }, keepalive: true, credentials: 'omit', mode: 'cors' }).catch(function () {});
    } catch (e) {}
  }

  function tick() {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastActive > IDLE) { stop(); return; }
    var now = place();
    if (now !== lastPlace || Date.now() - lastSent >= BEAT) { lastPlace = now; lastSent = Date.now(); send('ping'); }
  }
  function start() { if (!timer) { timer = setInterval(tick, CHECK); tick(); } }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function active() { lastActive = Date.now(); if (!timer && document.visibilityState === 'visible') start(); }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { addEventListener(ev, active, { passive: true }); });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { lastSent = 0; active(); }
    else { stop(); send('leave'); lastSent = 0; }
  });
  addEventListener('pagehide', function () { send('leave'); });

  // first signal once the page has settled, so it never competes with loading
  (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(start, { timeout: 4000 });
})();
