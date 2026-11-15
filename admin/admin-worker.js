/* ============================================================
   EVOXEL SOUNDS — private business dashboard (Cloudflare Worker)

   Who can reach it
   - Only one address answers: https://hq.evoxelmusic.com/<DASH_PATH>/
     DASH_PATH is a random code of 10+ characters (set with
     setup.mjs, about 58 bits), so the link can't be guessed by
     trying addresses. Every other address answers a plain 404,
     the same one a random URL gets, so nothing hints that a page
     exists. The repo is public, so the secret is never in the code.
   - Behind the link there is a password. It is stored only as a
     PBKDF2 hash (DASH_PASSWORD_HASH).
   - A correct password gives a signed cookie for 12 hours
     (HttpOnly, Secure, SameSite=Strict). Changing the password signs
     everyone out, because the cookie's key includes the hash.
   - Wrong passwords are counted in D1: 5 per IP or 30 in total
     within 15 minutes lock sign-in for 15 minutes.
   - Pages are never cached or indexed, can't be framed, and run
     only their own scripts (CSP with a nonce).

   Routes (all under /<DASH_PATH>)
   - GET  /                 sign-in page, or the dashboard when signed in
   - POST /login            checks the password
   - POST /logout           signs out
   - GET  /api/summary      the dashboard's data for ?from=YYYY-MM-DD&to=YYYY-MM-DD
   - POST /api/refresh      pulls from Meta now instead of waiting for the next run
   - POST /api/dismiss      marks tasks as handled ({keys: [...]}); they stay hidden
   - GET  /api/live         who is on the site right now (signals from assets/live.js,
                            kept by the checkout Worker in live_sessions)

   Data
   - Orders, revenue and PayPal fees: the "orders" table the checkout
     Worker writes (paypal_fee / paypal_net come from each capture).
   - Ad spend: ad_spend_daily, filled from Meta's Graph API every 3
     hours (cron) with the META_TOKEN secret (ads_read). The first run
     reaches back 90 days; later runs redo the last week, since Meta
     still corrects recent numbers.
   - Visits: site_visits_daily, counted by the site itself (assets/live.js
     → checkout Worker), one per visit, by Israel date, source and device.
     It counts everyone, cookies or not, unlike the Pixel.
   - admin_sync remembers each source's last run and error, so the page
     can say when Meta stopped answering (an expired token, say).
   ============================================================ */

import { loginPage, dashboardPage } from './pages.js';

const SESSION_HOURS = 12;
const COOKIE = '__Host-evx_session';
const LOCK = { perIp: 5, total: 30, minutes: 15 };
const MIN_PATH_LENGTH = 10;
const REVENUE_STATUSES = ['paid'];
const SHOWN_STATUSES = ['paid', 'partially_refunded', 'refunded', 'reversed'];

const enc = new TextEncoder();
const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uDecode = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const b64Decode = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const rest = await matchSecretPath(url.pathname, env);
    if (rest === null) return notFound();
    const base = '/' + env.DASH_PATH;

    try {
      if (request.method === 'POST' && !sameOrigin(request, url)) return notFound();

      if (rest === '/login' && request.method === 'POST') return await login(request, env, base);
      if (rest === '/logout' && request.method === 'POST') return redirect(base + '/', clearCookie());

      const signedIn = await readSession(request, env);

      if (rest === '/api/summary' && request.method === 'GET') {
        if (!signedIn) return json({ error: 'signed_out' }, 401);
        return json(await summary(url, env));
      }
      if (rest === '/api/dismiss' && request.method === 'POST') {
        if (!signedIn) return json({ error: 'signed_out' }, 401);
        return json(await dismiss(await request.json().catch(() => ({})), env));
      }
      if (rest === '/api/live' && request.method === 'GET') {
        if (!signedIn) return json({ error: 'signed_out' }, 401);
        return json(await liveNow(env));
      }
      if (rest === '/api/refresh' && request.method === 'POST') {
        if (!signedIn) return json({ error: 'signed_out' }, 401);
        return json(await syncMeta(env));
      }
      if ((rest === '' || rest === '/') && request.method === 'GET') {
        if (rest === '') return redirect(base + '/');
        return signedIn ? page(dashboardPage, base, env) : page(loginPage, base, env, {});
      }
      return notFound();
    } catch (err) {
      console.error('admin error', err && err.stack || err);
      return new Response('Something went wrong', { status: 500, headers: baseHeaders('text/plain; charset=utf-8') });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(syncMeta(env));
  },
};

/* ---------- Meta: ad spend and visits ---------- */
const DAY_MS = 86400000;
const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

async function graph(env, path, params) {
  let next = `https://graph.facebook.com/${env.META_API_VERSION || 'v23.0'}/${path}?` +
    new URLSearchParams({ ...params, access_token: env.META_TOKEN });
  const rows = [];
  for (let page = 0; next && page < 50; page++) {
    const r = await fetch(next);
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body.error) throw new Error((body.error && body.error.message) || `Meta answered ${r.status}`);
    rows.push(...(body.data || []));
    next = body.paging && body.paging.next;
  }
  return rows;
}

async function recordSync(DB, source, ok, message) {
  await DB.prepare(`INSERT INTO admin_sync (source, ok, at, message) VALUES (?1, ?2, ?3, ?4)
      ON CONFLICT (source) DO UPDATE SET ok = ?2, at = ?3, message = ?4`)
    .bind(source, ok ? 1 : 0, new Date().toISOString(), message ? String(message).slice(0, 300) : null).run();
}

async function syncMeta(env) {
  const DB = await database(env);
  if (!env.META_TOKEN) return { adSpend: 'no_token', visits: 'no_token' };
  const result = {};
  const now = new Date().toISOString();

  // ad spend: one row per campaign per day, for campaigns whose name holds META_CAMPAIGN_FILTER
  try {
    const has = await DB.prepare('SELECT COUNT(*) AS n FROM ad_spend_daily').first();
    const since = utcDay(Date.now() - (has.n ? 7 : 90) * DAY_MS);
    const rows = await graph(env, `act_${env.META_AD_ACCOUNT}/insights`, {
      level: 'campaign', time_increment: '1', limit: '500',
      fields: 'campaign_id,campaign_name,spend,impressions,inline_link_clicks,account_currency',
      time_range: JSON.stringify({ since, until: utcDay(Date.now()) }),
      filtering: JSON.stringify([{ field: 'campaign.name', operator: 'CONTAIN', value: env.META_CAMPAIGN_FILTER || 'Site' }]),
    });
    const stmts = rows.map((r) => DB.prepare(`INSERT INTO ad_spend_daily (date, campaign_id, campaign, spend, currency, impressions, clicks, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ON CONFLICT (date, campaign_id) DO UPDATE SET campaign = ?3, spend = ?4, currency = ?5, impressions = ?6, clicks = ?7, updated_at = ?8`)
      .bind(r.date_start, String(r.campaign_id), r.campaign_name || null, Number(r.spend) || 0, r.account_currency || 'ILS',
        Number(r.impressions) || 0, Number(r.inline_link_clicks) || 0, now));
    for (let i = 0; i < stmts.length; i += 50) await DB.batch(stmts.slice(i, i + 50));
    await recordSync(DB, 'adSpend', true, `${rows.length} rows since ${since}`);
    result.adSpend = { ok: true, rows: rows.length };
  } catch (err) {
    await recordSync(DB, 'adSpend', false, err.message);
    result.adSpend = { ok: false, message: err.message };
  }

  return result;
}

/* ---------- the secret link ---------- */
// the part of the path after the secret, or null when the path isn't ours
async function matchSecretPath(pathname, env) {
  const secret = env.DASH_PATH || '';
  if (secret.length < MIN_PATH_LENGTH) return null;          // not set up: nothing answers
  const first = pathname.split('/')[1] || '';
  if (!(await safeEqual(first, secret))) return null;
  return pathname.slice(1 + first.length);
}

// compares two strings in constant time by comparing their SHA-256 digests
async function safeEqual(a, b) {
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))));
  return crypto.subtle.timingSafeEqual(x, y);
}

// a POST must come from this page itself, never from a form on another site
function sameOrigin(request, url) {
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin') return false;
  const origin = request.headers.get('Origin');
  return !origin || origin === url.origin;
}

/* ---------- password ---------- */
// stored as pbkdf2-sha256$<iterations>$<salt base64>$<hash base64>
async function verifyPassword(password, stored) {
  const [alg, iterations, salt, hash] = String(stored || '').split('$');
  if (alg !== 'pbkdf2-sha256' || !salt || !hash) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: b64Decode(salt), iterations: Number(iterations) }, key, 256));
  const want = b64Decode(hash);
  return bits.length === want.length && crypto.subtle.timingSafeEqual(bits, want);
}

async function login(request, env, base) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const DB = await database(env);
  const since = Date.now() - LOCK.minutes * 60000;

  if (DB) {
    const row = await DB.prepare(`SELECT
        SUM(CASE WHEN ip = ?1 THEN 1 ELSE 0 END) AS mine, COUNT(*) AS total
        FROM admin_login_attempts WHERE at > ?2`).bind(ip, since).first();
    if ((row && row.mine >= LOCK.perIp) || (row && row.total >= LOCK.total)) {
      return page(loginPage, base, env, { error: 'locked' }, 429);
    }
  }

  const form = await request.formData().catch(() => null);
  const password = String((form && form.get('password')) || '').slice(0, 200);
  const ok = password.length > 0 && env.DASH_PASSWORD_HASH && await verifyPassword(password, env.DASH_PASSWORD_HASH);

  if (!ok) {
    if (DB) {
      await DB.batch([
        DB.prepare('INSERT INTO admin_login_attempts (ip, at) VALUES (?1, ?2)').bind(ip, Date.now()),
        DB.prepare('DELETE FROM admin_login_attempts WHERE at < ?1').bind(Date.now() - 86400000),
      ]);
    }
    return page(loginPage, base, env, { error: 'wrong' }, 401);
  }

  if (DB) await DB.prepare('DELETE FROM admin_login_attempts WHERE ip = ?1').bind(ip).run();
  return redirect(base + '/', await sessionCookie(env));
}

/* ---------- session cookie ---------- */
async function sessionKey(env) {
  if (!env.DASH_SESSION_KEY || !env.DASH_PASSWORD_HASH) throw new Error('Dashboard secrets are not set');
  return crypto.subtle.importKey('raw', enc.encode(env.DASH_SESSION_KEY + '|' + env.DASH_PASSWORD_HASH),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sessionCookie(env) {
  const exp = Date.now() + SESSION_HOURS * 3600000;
  const payload = b64u(enc.encode(JSON.stringify({ exp, n: b64u(crypto.getRandomValues(new Uint8Array(12))) })));
  const sig = b64u(await crypto.subtle.sign('HMAC', await sessionKey(env), enc.encode(payload)));
  return `${COOKIE}=${payload}.${sig}; Path=/; Max-Age=${SESSION_HOURS * 3600}; HttpOnly; Secure; SameSite=Strict`;
}

function clearCookie() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

async function readSession(request, env) {
  const cookies = request.headers.get('Cookie') || '';
  const m = cookies.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([A-Za-z0-9_-]+)\\.([A-Za-z0-9_-]+)'));
  if (!m) return false;
  try {
    const valid = await crypto.subtle.verify('HMAC', await sessionKey(env), b64uDecode(m[2]), enc.encode(m[1]));
    if (!valid) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(b64uDecode(m[1])));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/* ---------- database ---------- */
let schemaReady = null;

// the database with this Worker's own tables in place; null when no DB is bound
async function database(env) {
  if (!env.DB) return null;
  if (!schemaReady) {
    schemaReady = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (ip TEXT NOT NULL, at INTEGER NOT NULL)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS admin_login_attempts_at ON admin_login_attempts (at)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS ad_spend_daily (
        date        TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign    TEXT,
        spend       REAL NOT NULL DEFAULT 0,
        currency    TEXT NOT NULL DEFAULT 'ILS',
        impressions INTEGER NOT NULL DEFAULT 0,
        clicks      INTEGER NOT NULL DEFAULT 0,
        updated_at  TEXT NOT NULL,
        PRIMARY KEY (date, campaign_id)
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_dismissed (key TEXT PRIMARY KEY, at TEXT NOT NULL)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_sync (
        source  TEXT PRIMARY KEY,
        ok      INTEGER NOT NULL,
        at      TEXT NOT NULL,
        message TEXT
      )`),
    ]).then(async () => {
      // fee columns on the checkout Worker's table, in case it hasn't added them yet (an error means they exist or there's no table)
      for (const col of ['paypal_fee REAL', 'paypal_net REAL']) {
        await env.DB.prepare('ALTER TABLE orders ADD COLUMN ' + col).run().catch(() => {});
      }
    }).catch((err) => { schemaReady = null; throw err; });
  }
  await schemaReady;
  return env.DB;
}

/* ---------- live visitors ---------- */
const LIVE_WINDOW_MS = 90000;   // a visit counts as live for 90 s after its last signal (they come once a minute)

async function liveNow(env) {
  const since = Date.now() - LIVE_WINDOW_MS;
  const rows = await env.DB.prepare(`SELECT place, source, device, country, city, first_seen FROM live_sessions
      WHERE last_seen > ?1 ORDER BY first_seen`).bind(since).all().then((r) => r.results).catch(() => []);
  return { at: new Date().toISOString(), count: rows.length, visits: rows.map((r) => ({ ...r, minutes: Math.max(0, Math.round((Date.now() - r.first_seen) / 60000)) })) };
}

/* ---------- tasks: only things there is something to do about ---------- */
// Not tasks: checkouts that were opened and never paid, or ad spend without a sale; the funnel and the
// headline show those. Each task has a stable key, so once dismissed it stays hidden; a new event is a new key.
const TASK_DAYS = 60;

async function tasks(DB, env, syncs) {
  const since = new Date(Date.now() - TASK_DAYS * 86400000).toISOString();
  const rows = await DB.prepare(`SELECT ref, status, service, artist, track, amount_paid, paid_at, updated_at FROM orders
      WHERE kind = 'booking' AND status IN ('paid', 'payment_pending', 'partially_refunded', 'refunded', 'reversed')
        AND COALESCE(paid_at, updated_at) >= ? ORDER BY COALESCE(paid_at, updated_at) DESC LIMIT 100`)
    .bind(since).all().then((r) => r.results).catch(() => []);
  const list = [];
  for (const o of rows) {
    const who = [o.artist, o.track].filter(Boolean).join(' – ');
    if (o.status === 'paid') list.push({ key: 'order:' + o.ref, kind: 'order', at: o.paid_at, text: 'הזמנה חדשה: ' + (o.service || 'שירות') + (who ? ' · ' + who : '') + ' (' + o.ref + ')' });
    else if (o.status === 'payment_pending') list.push({ key: 'pending:' + o.ref, kind: 'warn', at: o.updated_at, text: 'התשלום של ' + o.ref + ' ממתין לאישור של PayPal. כדאי לבדוק בחשבון PayPal.' });
    else list.push({ key: 'refund:' + o.ref + ':' + o.status, kind: 'bad', at: o.updated_at, text: (o.status === 'reversed' ? 'ביטול דרך הבנק' : o.status === 'refunded' ? 'החזר מלא' : 'החזר חלקי') + ' בהזמנה ' + o.ref + (who ? ' · ' + who : '') });
  }
  const meta = syncs.adSpend;
  if (!env.META_TOKEN) list.push({ key: 'meta:none', kind: 'warn', text: 'מטא לא מחובר, אז ההוצאה על מודעות חסרה.' });
  else if (meta && !meta.ok) list.push({ key: 'meta:' + meta.at, kind: 'bad', at: meta.at, text: 'העדכון ממטא נכשל: ' + meta.message });
  if (!list.length) return [];
  const done = new Set((await DB.prepare(`SELECT key FROM admin_dismissed WHERE key IN (${list.map(() => '?').join(',')})`)
    .bind(...list.map((t) => t.key)).all()).results.map((r) => r.key));
  return list.filter((t) => !done.has(t.key));
}

async function dismiss(body, env) {
  const keys = (Array.isArray(body.keys) ? body.keys : []).filter((k) => typeof k === 'string' && /^[a-z]+:[A-Za-z0-9:._-]{1,80}$/.test(k)).slice(0, 100);
  const DB = await database(env);
  if (keys.length) {
    const at = new Date().toISOString();
    await DB.batch(keys.map((k) => DB.prepare('INSERT OR IGNORE INTO admin_dismissed (key, at) VALUES (?1, ?2)').bind(k, at)));
  }
  return { ok: true, dismissed: keys.length };
}

/* ---------- the dashboard's data ---------- */
async function summary(url, env) {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!isDate(from) || !isDate(to) || from > to) return { error: 'bad_range' };
  const DB = await database(env);
  const end = to + 'T23:59:59.999Z';

  // the orders table belongs to the checkout Worker; if it doesn't exist yet there are simply no orders
  const orders = await DB.prepare(`SELECT ref, paid_at, artist, track, service, options, amount_paid AS amount_usd,
      paypal_fee AS fee_usd, status
      FROM orders WHERE status IN (${SHOWN_STATUSES.map(() => '?').join(',')}) AND paid_at >= ? AND paid_at <= ?
      ORDER BY paid_at DESC`).bind(...SHOWN_STATUSES, from, end).all().then((r) => r.results).catch(() => []);

  const funnel = await DB.prepare(`SELECT status, COUNT(*) AS n FROM orders
      WHERE kind = 'booking' AND created_at >= ? AND created_at <= ? GROUP BY status`)
    .bind(from, end).all().then((r) => r.results).catch(() => []);

  const adSpend = (await DB.prepare(`SELECT date, campaign, spend, currency, impressions, clicks FROM ad_spend_daily
      WHERE date >= ? AND date <= ? ORDER BY date`).bind(from, to).all()).results;
  // visits the site counted itself; until the checkout Worker has made the table there are none
  const visits = await DB.prepare(`SELECT date,
        SUM(CASE WHEN device = 'desktop' THEN visits ELSE 0 END) AS desktop,
        SUM(CASE WHEN device = 'mobile' THEN visits ELSE 0 END) AS mobile,
        SUM(visits) AS total
      FROM site_visits_daily WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date`)
    .bind(from, to).all().then((r) => r.results).catch(() => []);
  const visitSources = await DB.prepare(`SELECT source, SUM(visits) AS visits FROM site_visits_daily
      WHERE date >= ? AND date <= ? GROUP BY source ORDER BY visits DESC`)
    .bind(from, to).all().then((r) => r.results).catch(() => []);

  // where visits came from: countries and the busiest cities
  const countries = await DB.prepare(`SELECT country, SUM(visits) AS visits FROM site_visits_geo
      WHERE date >= ? AND date <= ? GROUP BY country ORDER BY visits DESC LIMIT 8`)
    .bind(from, to).all().then((r) => r.results).catch(() => []);
  const cities = await DB.prepare(`SELECT country, city, SUM(visits) AS visits FROM site_visits_geo
      WHERE date >= ? AND date <= ? AND city != '' GROUP BY country, city ORDER BY visits DESC LIMIT 8`)
    .bind(from, to).all().then((r) => r.results).catch(() => []);

  const syncs = Object.fromEntries((await DB.prepare('SELECT source, ok, at, message FROM admin_sync').all()).results
    .map((s) => [s.source, s]));
  const metaSource = (key) => {
    const s = syncs[key];
    if (!env.META_TOKEN) return { connected: false, state: 'not_connected' };
    if (!s) return { connected: false, state: 'waiting' };
    return { connected: true, state: s.ok ? 'ok' : 'error', at: s.at, message: s.ok ? null : s.message };
  };

  return {
    generatedAt: new Date().toISOString(),
    range: { from, to },
    usdIls: Number(env.USD_ILS) || 3.7,
    revenueStatuses: REVENUE_STATUSES,
    orders: orders.map((o) => ({ ...o, amount_usd: Number(o.amount_usd) || 0, fee_usd: o.fee_usd == null ? null : Number(o.fee_usd) })),
    funnel,
    adSpend,
    visits,
    visitSources,
    countries,
    cities,
    tasks: await tasks(DB, env, syncs),
    sources: {
      orders: { connected: true },
      adSpend: metaSource('adSpend'),
      visits: { connected: true, state: 'ok', own: true },
    },
  };
}

/* ---------- responses ---------- */
function baseHeaders(type) {
  return {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Referrer-Policy': 'same-origin',   // nothing leaks to other sites, and our own forms keep their Origin
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

function notFound() {
  return new Response('Not found', { status: 404, headers: baseHeaders('text/plain; charset=utf-8') });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: baseHeaders('application/json; charset=utf-8') });
}

function redirect(location, cookie) {
  const headers = { ...baseHeaders('text/plain; charset=utf-8'), Location: location };
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(null, { status: 303, headers });
}

function page(render, base, env, data = {}, status = 200) {
  const nonce = b64u(crypto.getRandomValues(new Uint8Array(16)));
  const headers = {
    ...baseHeaders('text/html; charset=utf-8'),
    'Content-Security-Policy': [
      "default-src 'none'", `script-src 'nonce-${nonce}'`, `style-src 'nonce-${nonce}' https://fonts.googleapis.com`, 'font-src https://fonts.gstatic.com',
      "connect-src 'self'", "img-src data:", "form-action 'self'", "frame-ancestors 'none'", "base-uri 'none'",
    ].join('; '),
  };
  return new Response(render({ base, nonce, env, ...data }), { status, headers });
}
