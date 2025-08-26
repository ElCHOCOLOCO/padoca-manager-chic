export default async function handler(_req, res) {
  try {
    const hasUrl = Boolean(process.env.SUPABASE_URL);
    const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 10);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, hasUrl, hasKey, now: new Date().toISOString() }));
  } catch (e) {
    res.statusCode = 500;
    res.end('debug error: ' + (e?.message || 'unknown'));
  }
}