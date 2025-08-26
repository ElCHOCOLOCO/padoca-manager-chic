export const config = { runtime: 'edge' } as const;

export default async function handler(_req: Request): Promise<Response> {
	return new Response(JSON.stringify({ ok: true, now: new Date().toISOString() }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
}