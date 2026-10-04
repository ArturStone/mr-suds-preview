// Vercel serverless function: booking requests from the wizard → email via SMTP2GO.
// Env (Vercel → Settings → Environment Variables):
//   SMTP2GO_API_KEY  required  (a key created for this project)
//   QUOTE_TO         optional  default Mrsuds22@gmail.com
//   QUOTE_FROM       optional  default "Mr. Suds Website <noreply@arturstone.com>"
//                              (the sender domain must be verified in SMTP2GO)

const TO = process.env.QUOTE_TO || 'Mrsuds22@gmail.com';
const FROM = process.env.QUOTE_FROM || 'Mr. Suds Website <noreply@arturstone.com>';
const ALLOWED_ORIGINS = ['https://mr-suds.ca', 'https://www.mr-suds.ca'];

// Best-effort per-instance throttle (serverless instances don't share memory).
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
function throttled(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

const oneLine = (v, max) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
const multi = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

function fail(res, status, error) {
  res.status(status).json({ ok: false, error });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) {
    return fail(res, 403, 'Forbidden.');
  }

  const apiKey = process.env.SMTP2GO_API_KEY;
  if (!apiKey) {
    console.error('[quote] SMTP2GO_API_KEY is not set');
    return fail(res, 503, 'Sending is not available right now.');
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (throttled(ip)) return fail(res, 429, 'Too many requests — please try again in a few minutes.');

  const name = oneLine(body.name, 100);
  const phone = oneLine(body.phone, 40);
  const email = oneLine(body.email, 200);
  const address = oneLine(body.address, 200);
  const notes = multi(body.notes, 2000);

  if (!name) return fail(res, 400, 'Please enter your name.');
  if (!address) return fail(res, 400, 'Please enter the address.');
  if (!phone && !email) return fail(res, 400, 'Please enter a phone number or an email.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Please enter a valid email address.');

  const lines = [
    ['Service', oneLine(body.service, 120)],
    ['Vehicle', oneLine(body.vehicle, 120)],
    ['Add-ons', oneLine(body.addons, 400)],
    ['Estimated total', oneLine(body.estimate, 160)],
    ['Preferred', oneLine(body.preferred, 120)],
    ['Name', name],
    ['Phone', phone || '-'],
    ['Email', email || '-'],
    ['Address', address],
    ['Notes', notes || '-'],
  ].map(([k, v]) => `${k}: ${v || '-'}`);

  const payload = {
    sender: FROM,
    to: [TO],
    subject: `[Website] Booking request — ${name}`,
    text_body: lines.join('\n'),
  };
  if (email) {
    payload.custom_headers = [{ header: 'Reply-To', value: `${name.replace(/[<>"]/g, '')} <${email}>` }];
  }

  try {
    const r = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', 'X-Smtp2go-Api-Key': apiKey },
      body: JSON.stringify(payload),
    });
    const json = await r.json().catch(() => null);
    const d = json && json.data;
    if (!r.ok || !d || (d.succeeded || 0) < 1 || (d.failed || 0) > 0) {
      console.error('[quote] SMTP2GO rejected the message', r.status, d && d.error);
      return fail(res, 502, 'Could not send your request right now.');
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[quote] SMTP2GO request failed', err);
    return fail(res, 502, 'Could not send your request right now.');
  }
};
