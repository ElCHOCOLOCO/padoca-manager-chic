export const config = { runtime: 'edge' };

export default async function handler(_req) {
  return new Response(JSON.stringify({ ok: true, now: new Date().toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}