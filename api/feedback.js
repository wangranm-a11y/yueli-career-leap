const MAX_MESSAGE = 6000;

function cleanString(value, max = 500) {
  return String(value || '').slice(0, max);
}

function truncateDeep(value, depth = 0) {
  if (depth > 5) return null;
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return cleanString(value, 1000);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 30).map(item => truncateDeep(item, depth + 1));
  if (typeof value === 'object') {
    const output = {};
    Object.entries(value).slice(0, 40).forEach(([key, item]) => {
      if (/apiKey|photoDataUrl|data:image|token|secret|resumeZH|resumeEN|experiences|jd/i.test(key)) return;
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

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const message = cleanString(req.body?.message, MAX_MESSAGE).trim();
    if (message.length < 4) return res.status(400).json({ ok: false, error: 'Feedback message is too short' });

    const row = {
      session_id: cleanString(req.body?.sessionId, 80),
      feedback_type: cleanString(req.body?.type || 'other', 80),
      message,
      contact: cleanString(req.body?.contact, 300),
      context: truncateDeep(req.body?.context || {}),
      user_agent: cleanString(req.headers['user-agent'], 240)
    };

    const result = await insertSupabase('yueli_feedback', row);
    return res.status(200).json({ ok: true, disabled: result.disabled });
  } catch (error) {
    return res.status(200).json({ ok: false, error: 'feedback_unavailable' });
  }
}
