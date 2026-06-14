const CONSENT_VERSION = '2026-06-13-v1';
const MAX_TEXT = 50000;

function cleanString(value, max = 500) {
  return String(value || '').slice(0, max);
}

function truncateDeep(value, depth = 0) {
  if (depth > 8) return null;
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.slice(0, MAX_TEXT);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 100).map(item => truncateDeep(item, depth + 1));
  if (typeof value === 'object') {
    const output = {};
    Object.entries(value).slice(0, 80).forEach(([key, item]) => {
      if (/apiKey|photoDataUrl|data:image|token|secret/i.test(key)) return;
      output[key] = truncateDeep(item, depth + 1);
    });
    return output;
  }
  return null;
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    if (req.body?.consent !== true || req.body?.consentVersion !== CONSENT_VERSION) {
      return res.status(400).json({ ok: false, error: 'Consent required' });
    }

    const inputSnapshot = truncateDeep(req.body.inputSnapshot || {});
    const resumeZH = truncateDeep(req.body.resumeZH || null);
    const resumeEN = truncateDeep(req.body.resumeEN || null);

    const row = {
      session_id: cleanString(req.body.sessionId, 80),
      consent_version: CONSENT_VERSION,
      jd_title: cleanString(inputSnapshot?.jdTitle, 200),
      jd_mode: cleanString(inputSnapshot?.jdMode, 40),
      input_snapshot: inputSnapshot,
      resume_zh: resumeZH,
      resume_en: resumeEN,
      metadata: truncateDeep(req.body.metadata || {}),
      user_agent: cleanString(req.headers['user-agent'], 240)
    };

    const result = await insertSupabase('yueli_resume_records', row);
    return res.status(200).json({ ok: true, disabled: result.disabled });
  } catch (error) {
    return res.status(200).json({ ok: false, error: 'record_save_unavailable' });
  }
}
