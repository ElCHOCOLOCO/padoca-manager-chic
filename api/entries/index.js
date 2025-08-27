import https from 'https';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function restRequest(method, urlString, headers = {}, payload = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlString);
      const opts = {
        hostname: url.hostname,
        path: url.pathname + (url.search || ''),
        port: url.port || 443,
        method,
        headers,
      };
      const req = https.request(opts, (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ status: res.statusCode || 0, body });
        });
      });
      req.on('error', (e) => resolve({ status: 0, body: String(e?.message || e) }));
      if (payload) req.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
      req.end();
    } catch (e) {
      resolve({ status: 0, body: String(e?.message || e) });
    }
  });
}

function buildQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.append(k, String(v));
  });
  return usp.toString();
}

export default async function handler(req, res) {
  try {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    const q = (req && req.query) ? req.query : {};
    res.end(JSON.stringify({ ok: true, method: req.method, q }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: e?.message || 'internal' }));
  }
}