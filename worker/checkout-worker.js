/* ============================================================
   EVOXEL SOUNDS — checkout server (Cloudflare Worker)

   What it does
   - POST /orders                 → works out the price from the
                                    price list below and creates a
                                    PayPal order
   - POST /orders/{id}/capture    → takes the payment and checks it

   The browser never decides the price, so it can't be tampered with.

   Settings (Cloudflare dashboard → this Worker → Settings →
   Variables and Secrets):
     PAYPAL_CLIENT_ID   (text)    the app's Client ID
     PAYPAL_SECRET      (secret)  the app's Secret — never put it in code
     PAYPAL_ENV         (text)    sandbox  or  live
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
  'https://evoxelsounds.github.io',
  'https://evoxelmusic.com',
  'https://www.evoxelmusic.com',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method !== 'POST') return json({ error: 'Not found' }, 404);
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Origin not allowed' }, 403);

    const url = new URL(request.url);
    try {
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

  const ref = clip(body.ref, 40) || 'EVX-' + crypto.randomUUID().slice(0, 6).toUpperCase();
  const track = clip(body.trackTitle, 60), artist = clip(body.artist, 50);

  const token = await accessToken(env);
  const r = await fetch(apiBase(env) + '/v2/checkout/orders', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'PayPal-Request-Id': ref },
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
  return { id: data.id, ref, total };
}

/* ---------- capture ---------- */
async function captureOrder(orderId, env) {
  const token = await accessToken(env);
  const r = await fetch(apiBase(env) + '/v2/checkout/orders/' + orderId + '/capture', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  });
  const data = await r.json();

  // card declined or similar: let the buyer try another way
  const issue = data.details && data.details[0] && data.details[0].issue;
  if (issue === 'INSTRUMENT_DECLINED') return { status: 'DECLINED' };
  if (!r.ok) throw httpError(502, (data.details && data.details[0] && data.details[0].description) || 'Payment could not be completed');

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
