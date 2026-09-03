import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../../site.config';

export async function GET(context: APIContext) {
  const base = context.site!.origin;
  const docs = (await getCollection('docs')).sort((a, b) => a.data.order - b.data.order);
  const lines = [
    '# Continuo',
    '',
    `> ${site.description}`,
    '',
    'Continuo is open source (Apache 2.0). It stitches independent dbt and Python projects into one dependency graph, validates every release in a temporary schema clone, and proposes a fix when a release is rejected.',
    '',
    '## Start',
    `- [Landing page](${base}/): what Continuo is, quickstart, video`,
    `- [README](https://raw.githubusercontent.com/carolsimone/continuo/main/README.md): full overview from the repository`,
    '',
    '## Docs',
    ...docs.map((d) => `- [${d.data.title}](${base}/docs/${d.id}/)`),
    '',
    '## Blog',
    `- [Blog index](${base}/blog/)`,
    `- [RSS feed](${base}/rss.xml)`,
    '',
    '## Source',
    `- [GitHub repository](${site.githubUrl})`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
