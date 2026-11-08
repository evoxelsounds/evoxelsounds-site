/* ============================================================
   EVOXEL SOUNDS — checkout server (Cloudflare Worker)

   What it does
   - POST /ref                    → gives out the next order number
                                    (EVX-1001, EVX-1002, … or REQ-1001
                                    for Music Production requests) and
                                    records the order
   - POST /orders                 → works out the price from the
                                    price list below and creates a
                                    PayPal order
   - POST /orders/{id}/capture    → takes the payment and checks it
   - POST /webhook                → PayPal tells us a payment changed
                                    (paid, refunded, …); see below

   The browser never decides the price or the order number, so
   neither can be tampered with.

   Order numbers
   - Counted up by the server in a D1 database, one step per order,
     so two orders can never get the same number.
   - Every order is kept in the "orders" table with its status:
       reserved  number given, customer is at the payment step
       pending   PayPal order created, waiting for payment
       payment_pending  paid, but PayPal is still checking the payment
       paid      payment captured
       failed    payment was declined
       partially_refunded / refunded   money (partly) given back
       reversed  money taken back by the buyer's bank (chargeback)
       received  Music Production request (no payment)
   - Numbers of checkouts that were never paid stay "reserved" or
     "pending" and are not reused.
   - The tables are created automatically on first use.

   Settings (Cloudflare dashboard → this Worker → Settings):
     Variables and Secrets
       PAYPAL_CLIENT_ID   (text)    the app's Client ID
       PAYPAL_SECRET      (secret)  the app's Secret — never put it in code
       PAYPAL_ENV         (text)    sandbox  or  live
     Bindings
       DB                 (D1 database)  where order numbers and orders
                                         are kept
   ============================================================ */

/* PRICE LIST — must match the SERVICES list on the website.
   Labels must be written exactly as on the site. Prices in USD. */
const PRICES = {
  mixing: {
    name: 'Mixing', base: 479,
    options: {
      'Up to 50 multitracks': 0,
      'Up to 100 multitracks': 110,
      '100+ multitracks': 270,
      'Analog mastering': 100,
      'Rush delivery (top of the queue)': 100,
    },
    pickOne: [['Up to 50 multitracks', 'Up to 100 multitracks', '100+ multitracks']],
  },
  mastering: {
    name: 'Mastering', base: 229,
    options: {
      'Stereo mastering': 0,
      'Stem mastering (up to 12 stems)': 70,
      'Rush delivery (within 24 hours)': 50,
    },
    pickOne: [['Stereo mastering', 'Stem mastering (up to 12 stems)']],
  },
};

const ALLOWED_ORIGINS = [
  'https://evoxelsounds.github.io',          // GitHub Pages copy
  'https://evoxelsounds.pages.dev',          // Cloudflare Pages (main site)
  'https://evoxelsounds.com',
  'https://www.evoxelsounds.com',
  'https://evoxelmusic.com',
  'https://www.evoxelmusic.com',
];
// Cloudflare Pages preview links look like https://abc123.evoxelsounds.pages.dev
const isAllowed = o => ALLOWED_ORIGINS.includes(o) || /^https:\/\/[a-z0-9-]+\.evoxelsounds\.pages\.dev$/.test(o);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': isAllowed(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method !== 'POST') return json({ error: 'Not found' }, 404);
    if (origin && !isAllowed(origin)) return json({ error: 'Origin not allowed' }, 403);

    const url = new URL(request.url);
    try {
      if (url.pathname === '/webhook') return json(await handleWebhook(await request.json().catch(() => ({})), env));
      if (url.pathname === '/ref') return json(await newRef(await request.json(), env));
      if (url.pathname === '/orders') return json(await createOrder(await request.json(), env));
      const m = url.pathname.match(/^\/orders\/([A-Z0-9]+)\/capture$/);
      if (m) return json(await captureOrder(m[1], env));
      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: err.message || 'Something went wrong' }, err.status || 500);
    }
  },
};

/* ---------- PayPal helpers ---------- */
function apiBase(env) {
  return env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function accessToken(env) {
  const r = await fetch(apiBase(env) + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw httpError(502, 'Could not reach PayPal');
  return (await r.json()).access_token;
}

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }
const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const usd = n => n.toFixed(2);
const now = () => new Date().toISOString();

/* ---------- order numbers (D1) ---------- */
const FIRST_NUMBER = 1001;
const PREFIX = { booking: 'EVX', request: 'REQ' };
let schemaReady = null;

// the database, with its tables in place; null when no DB is bound
async function database(env) {
  if (!env.DB) return null;
  if (!schemaReady) {
    schemaReady = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS counters (
        name  TEXT PRIMARY KEY,
        value INTEGER NOT NULL
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (
        ref             TEXT PRIMARY KEY,
        kind            TEXT NOT NULL,
        status          TEXT NOT NULL,
        service         TEXT,
        options         TEXT,
        email           TEXT,
        artist          TEXT,
        track           TEXT,
        total           REAL,
        paypal_order_id TEXT,
        capture_id      TEXT,
        amount_paid     REAL,
        payer_email     TEXT,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL,
        paid_at         TEXT
      )`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS orders_paypal ON orders (paypal_order_id)`),
    ]).catch(err => { schemaReady = null; throw err; });
  }
  await schemaReady;
  return env.DB;
}

// takes the next number and records the order in one transaction
async function reserveRef(DB, kind, info) {
  const prefix = PREFIX[kind];
  const t = now();
  const [, inserted] = await DB.batch([
    DB.prepare(`INSERT INTO counters (name, value) VALUES (?1, ?2)
                ON CONFLICT (name) DO UPDATE SET value = value + 1`).bind(prefix, FIRST_NUMBER),
    DB.prepare(`INSERT INTO orders (ref, kind, status, service, email, artist, track, created_at, updated_at)
                SELECT ?1 || '-' || value, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8 FROM counters WHERE name = ?1
                RETURNING ref`)
      .bind(prefix, kind, kind === 'request' ? 'received' : 'reserved',
            clip(info.service, 40), clip(info.email, 127), clip(info.artist, 50), clip(info.trackTitle, 60), t),
  ]);
  return inserted.results[0].ref;
}

async function newRef(body, env) {
  const kind = body.kind === 'request' ? 'request' : 'booking';
  const DB = await database(env);
  if (!DB) throw httpError(503, 'Order numbers are not set up');
  return { ref: await reserveRef(DB, kind, body) };
}

// a fallback that is still very unlikely to repeat, used only if the database is down
const fallbackRef = () => 'EVX-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();

/* ---------- create ---------- */
async function createOrder(body, env) {
  const svc = PRICES[body.service];
  if (!svc) throw httpError(400, 'Unknown service');

  const picked = Array.isArray(body.options) ? body.options.map(String) : [];
  for (const label of picked) {
    if (!(label in svc.options)) throw httpError(400, 'Unknown option: ' + label);
  }
  for (const group of svc.pickOne) {
    if (picked.filter(l => group.includes(l)).length > 1) throw httpError(400, 'Choose one option per group');
  }

  const items = [{ name: svc.name, quantity: '1', unit_amount: { currency_code: 'USD', value: usd(svc.base) }, category: 'DIGITAL_GOODS' }];
  let total = svc.base;
  for (const label of picked) {
    const price = svc.options[label];
    if (price > 0) {
      items.push({ name: clip(label, 127), quantity: '1', unit_amount: { currency_code: 'USD', value: usd(price) }, category: 'DIGITAL_GOODS' });
      total += price;
    }
  }

  // the order number must be one this server gave out and not yet paid;
  // anything else gets a fresh number
  let ref = clip(body.ref, 40), DB = null;
  try {
    DB = await database(env);
    if (DB) {
      const row = ref ? await DB.prepare(`SELECT status FROM orders WHERE ref = ?1 AND kind = 'booking'`).bind(ref).first() : null;
      if (!row || row.status === 'paid') ref = await reserveRef(DB, 'booking', body);
    }
  } catch (err) {
    console.error('order number lookup failed', err);
    DB = null;
  }
  if (!ref) ref = fallbackRef();
  const track = clip(body.trackTitle, 60), artist = clip(body.artist, 50);

  const token = await accessToken(env);
  const r = await fetch(apiBase(env) + '/v2/checkout/orders', {
    method: 'POST',
    // a new request id each time, so a retry with other options gets a new PayPal order at the right price
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'PayPal-Request-Id': crypto.randomUUID() },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: ref,
        invoice_id: ref,
        custom_id: clip(body.email, 127),
        description: clip(svc.name + ' · ' + track + (artist ? ' – ' + artist : ''), 127),
        amount: { currency_code: 'USD', value: usd(total), breakdown: { item_total: { currency_code: 'USD', value: usd(total) } } },
        items,
      }],
      application_context: { brand_name: 'EVOXEL SOUNDS', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' },
    }),
  });
  const data = await r.json();
  if (!r.ok) throw httpError(502, (data.details && data.details[0] && data.details[0].description) || 'PayPal could not create the order');

  if (DB) {
    try {
      await DB.prepare(`UPDATE orders SET status = 'pending', service = ?2, options = ?3, email = ?4, artist = ?5, track = ?6,
                          total = ?7, paypal_order_id = ?8, updated_at = ?9 WHERE ref = ?1`)
        .bind(ref, svc.name, picked.join(' | '), clip(body.email, 127), artist, track, total, data.id, now()).run();
    } catch (err) { console.error('could not record order', ref, err); }
  }
  return { id: data.id, ref, total };
}

/* ---------- capture ---------- */
async function captureOrder(orderId, env) {
  const token = await accessToken(env);
  const r = await fetch(apiBase(env) + '/v2/checkout/orders/' + orderId + '/capture', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  });
  let data = await r.json();

  // card declined or similar: let the buyer try another way
  const issue = data.details && data.details[0] && data.details[0].issue;
  if (issue === 'INSTRUMENT_DECLINED') return { status: 'DECLINED' };
  if (issue === 'ORDER_ALREADY_CAPTURED') {
    // already taken, for example by the PayPal notification a moment earlier: read the order instead
    data = await getOrder(orderId, env, token);
    if (!data) throw httpError(502, 'Payment could not be completed');
  } else if (!r.ok) {
    throw httpError(502, (data.details && data.details[0] && data.details[0].description) || 'Payment could not be completed');
  }

  await syncOrder(data, env);

  const unit = data.purchase_units && data.purchase_units[0];
  const cap = unit && unit.payments && unit.payments.captures && unit.payments.captures[0];
  return {
    status: data.status,                       // COMPLETED when paid
    captureId: cap && cap.id,
    amount: cap && cap.amount && cap.amount.value,
    ref: unit && unit.reference_id,
    payerEmail: data.payer && data.payer.email_address,
  };
}

// a PayPal order straight from PayPal; null when PayPal has no such order
async function getOrder(orderId, env, token) {
  const r = await fetch(apiBase(env) + '/v2/checkout/orders/' + encodeURIComponent(orderId), {
    headers: { 'Authorization': 'Bearer ' + (token || await accessToken(env)) },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw httpError(502, 'Could not read the order from PayPal');
  return r.json();
}

/* ---------- order status in the database ---------- */
// PayPal payment state → our order status
const CAPTURE_STATUS = {
  COMPLETED: 'paid',
  PENDING: 'payment_pending',          // PayPal is still checking the payment
  PARTIALLY_REFUNDED: 'partially_refunded',
  REFUNDED: 'refunded',
  REVERSED: 'reversed',                // taken back, e.g. a chargeback
  DECLINED: 'failed',
  FAILED: 'failed',
};
// a status only moves forward, so notifications arriving out of order can't undo a later one
const STATUS_RANK = { reserved: 0, pending: 1, payment_pending: 2, failed: 3, paid: 4, partially_refunded: 5, refunded: 6, reversed: 6 };

// writes what PayPal says about an order into the database. The payment may already be
// taken when this runs, so a database problem is logged and never turned into an error.
async function syncOrder(order, env) {
  try {
    const unit = order && order.purchase_units && order.purchase_units[0];
    const cap = unit && unit.payments && unit.payments.captures && unit.payments.captures[0];
    const status = cap && CAPTURE_STATUS[cap.status];
    if (!status) return;
    const DB = await database(env);
    if (!DB) return;

    const t = now();
    const paidAt = status === 'payment_pending' || status === 'failed' ? null : (cap.create_time || t);
    const amount = cap.amount ? Number(cap.amount.value) : null;
    const payer = (order.payer && order.payer.email_address) || null;
    const row = await DB.prepare(`SELECT status FROM orders WHERE paypal_order_id = ?1`).bind(order.id).first();

    if (row) {
      if ((STATUS_RANK[status] || 0) <= (STATUS_RANK[row.status] || 0)) return;
      await DB.prepare(`UPDATE orders SET status = ?2, capture_id = ?3, amount_paid = ?4, payer_email = COALESCE(?5, payer_email),
                          paid_at = COALESCE(paid_at, ?6), updated_at = ?7 WHERE paypal_order_id = ?1`)
        .bind(order.id, status, cap.id || null, amount, payer, paidAt, t).run();
    } else {
      // an order this database never saw (its number came from the fallback): keep it anyway
      await DB.prepare(`INSERT OR IGNORE INTO orders (ref, kind, status, service, email, total, paypal_order_id, capture_id,
                          amount_paid, payer_email, created_at, updated_at, paid_at)
                        VALUES (?1, 'booking', ?2, ?3, ?4, ?5, ?6, ?7, ?5, ?8, ?9, ?9, ?10)`)
        .bind(clip(unit.reference_id || unit.invoice_id || order.id, 40), status, clip(unit.description, 127) || null,
              clip(unit.custom_id, 127) || null, amount, order.id, cap.id || null, payer, t, paidAt).run();
    }
  } catch (err) {
    console.error('could not record payment for PayPal order', order && order.id, err);
  }
}

/* ---------- PayPal notifications (webhook) ----------
   PayPal calls POST /webhook when a payment changes. The message itself
   is never trusted: the order is always read again from PayPal with our
   own credentials, so a forged message can't mark anything paid.

   Events to subscribe to in the PayPal app:
     CHECKOUT.ORDER.APPROVED       buyer approved; take the money even if
                                   they closed the page before the site did
     PAYMENT.CAPTURE.COMPLETED     paid
     PAYMENT.CAPTURE.PENDING       PayPal is still checking the payment
     PAYMENT.CAPTURE.DENIED        payment failed
     PAYMENT.CAPTURE.REFUNDED      refunded (fully or partly)
     PAYMENT.CAPTURE.REVERSED      taken back, e.g. a chargeback
   ---------------------------------------------------- */
async function handleWebhook(event, env) {
  const type = (event && event.event_type) || '';
  const res = (event && event.resource) || {};
  const token = await accessToken(env);
  let orderId = null;

  if (type === 'CHECKOUT.ORDER.APPROVED' && res.id) {
    try {
      await captureOrder(res.id, env);
      return { ok: true, captured: res.id };
    } catch (err) {
      orderId = res.id;                 // could not capture: just record whatever state it is in
    }
  } else if (type.startsWith('PAYMENT.CAPTURE.')) {
    orderId = res.supplementary_data && res.supplementary_data.related_ids && res.supplementary_data.related_ids.order_id;
    if (!orderId) {
      // a refund points to its capture, and the capture knows the order
      const up = (res.links || []).find(l => l.rel === 'up' && typeof l.href === 'string');
      if (up && up.href.startsWith(apiBase(env) + '/v2/payments/captures/')) {
        const r = await fetch(up.href, { headers: { 'Authorization': 'Bearer ' + token } });
        if (r.ok) {
          const c = await r.json();
          orderId = c.supplementary_data && c.supplementary_data.related_ids && c.supplementary_data.related_ids.order_id;
        }
      }
    }
  }
  if (!orderId) return { ok: true, ignored: type };

  const order = await getOrder(orderId, env, token);
  if (!order) return { ok: true, ignored: 'unknown order' };
  await syncOrder(order, env);
  return { ok: true, synced: order.id };
}
