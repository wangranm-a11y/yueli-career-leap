function json(res, status, body) {
  return res.status(status).json(body);
}

function getToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return String(req.query?.token || '').trim();
}

function requireAdmin(req, res) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return { ok: false, response: json(res, 500, { ok: false, error: 'ADMIN_TOKEN is not configured' }) };
  if (getToken(req) !== expected) return { ok: false, response: json(res, 401, { ok: false, error: 'Unauthorized' }) };
  return { ok: true };
}

async function supabaseGet(path) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { disabled: true, data: null, count: 0 };

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact'
    }
  });
  const data = await response.json().catch(() => null);
  const range = response.headers.get('content-range') || '';
  const count = Number(range.split('/')[1] || 0);
  if (!response.ok) throw new Error(JSON.stringify(data) || `Supabase query failed: ${response.status}`);
  return { disabled: false, data, count };
}

async function countEvents(eventName) {
  const result = await supabaseGet(`yueli_events?event_name=eq.${encodeURIComponent(eventName)}&select=id`);
  return result.disabled ? null : result.count;
}

async function supabaseGetOptional(path) {
  try {
    return await supabaseGet(path);
  } catch {
    return { disabled: false, data: [], count: 0 };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const admin = requireAdmin(req, res);
  if (!admin.ok) return admin.response;

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return json(res, 200, {
        ok: true,
        configured: false,
        message: 'Supabase is not configured yet.'
      });
    }

    const [
      events,
      users,
      records,
      pageOpen,
      generateStart,
      generateSuccess,
      generateFailed,
      exportPdf,
      rewriteSuccess,
      followupSuccess,
      recentRecords,
      feedback,
      recentFeedback
    ] = await Promise.all([
      supabaseGet('yueli_events?select=id'),
      supabaseGet('yueli_events?select=session_id'),
      supabaseGet('yueli_resume_records?select=id'),
      countEvents('page_open'),
      countEvents('generate_start'),
      countEvents('generate_success'),
      countEvents('generate_failed'),
      countEvents('export_pdf'),
      countEvents('rewrite_success'),
      countEvents('followup_success'),
      supabaseGet('yueli_resume_records?select=created_at,jd_title,jd_mode,metadata,input_snapshot&order=created_at.desc&limit=20'),
      supabaseGetOptional('yueli_feedback?select=id'),
      supabaseGetOptional('yueli_feedback?select=created_at,feedback_type,message,contact,context&order=created_at.desc&limit=30')
    ]);

    const uniqueUsers = new Set((users.data || []).map(row => row.session_id).filter(Boolean)).size;
    return json(res, 200, {
      ok: true,
      configured: true,
      totals: {
        events: events.count,
        users: uniqueUsers,
        savedRecords: records.count,
        pageOpen,
        generateStart,
        generateSuccess,
        generateFailed,
        exportPdf,
        rewriteSuccess,
        followupSuccess,
        feedback: feedback.count
      },
      recentRecords: recentRecords.data || [],
      recentFeedback: recentFeedback.data || []
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error?.message || 'Admin stats unavailable'
    });
  }
}
