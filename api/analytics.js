const ALLOWED_EVENTS = new Set([
  'page_open',
  'generate_start',
  'generate_success',
  'generate_failed',
  'export_pdf',
  'rewrite_success',
  'followup_success'
]);

const ALLOWED_PAYLOAD_KEYS = new Set([
  'view',
  'jdMode',
  'hasFullJD',
  'hasJobTitle',
  'hasRequirements',
  'hasPortfolioLinks',
  'hasPhoto',
  'fileCount',
  'experienceCharsBucket',
  'languages',
  'theme',
  'errorType',
  'saveRecordConsent',
  'durationMs',
  'clientVersion'
]);

function cleanString(value, max = 120) {
  return String(value || '').slice(0, max);
}

function sanitizePayload(payload = {}) {
  const cleaned = {};
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (!ALLOWED_PAYLOAD_KEYS.has(key)) return;
    if (typeof value === 'string') cleaned[key] = cleanString(value);
    else if (typeof value === 'number' || typeof value === 'boolean') cleaned[key] = value;
    else if (Array.isArray(value)) cleaned[key] = value.map(item => cleanString(item, 40)).slice(0, 6);
  });
  return cleaned;
}

async function insertSupabase(table, body) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { disabled: true };

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Supabase insert failed: ${response.status}`);
  }
  return { disabled: false };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const eventName = cleanString(req.body?.eventName || req.body?.event, 60);
    if (!ALLOWED_EVENTS.has(eventName)) {
      return res.status(400).json({ ok: false, error: 'Unsupported event' });
    }

    const payload = sanitizePayload(req.body?.payload || {});
    const row = {
      session_id: cleanString(req.body?.sessionId, 80),
      event_name: eventName,
      payload,
      user_agent: cleanString(req.headers['user-agent'], 240)
    };

    const result = await insertSupabase('yueli_events', row);
    return res.status(200).json({ ok: true, disabled: result.disabled });
  } catch (error) {
    return res.status(200).json({ ok: false, error: 'analytics_unavailable' });
  }
}
