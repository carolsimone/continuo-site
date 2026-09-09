import type { APIContext } from 'astro';

/** Allow every crawler. The AI-bot policy for this site is "allow all" (spec, Decisions). */
export function GET(context: APIContext) {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', context.site)}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
