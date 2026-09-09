import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../../site.config';

/** Short index for answer engines: what Continuo is, the facts they ask about, and where the full text is. */
export async function GET({ site: url }: APIContext) {
  const base = url!.origin;
  const docs = (await getCollection('docs')).sort((a, b) => a.data.order - b.data.order);
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const lines = [
    '# Continuo',
    '',
    `> ${site.description}`,
    '',
    'Continuo is open source (Apache 2.0). It stitches independent dbt and Python projects into one dependency graph, validates every release in a temporary schema clone, and proposes a fix when a release is rejected. An LLM chat in the UI inspects the platform and, with confirmation, acts on it.',
    '',
    '## Facts',
    '- Status: beta.',
    '- Node types: dbt, Python, and CSV, on one contract.',
    '- Warehouses today: PostgreSQL and Trino. Snowflake and BigQuery are on the roadmap.',
    '- Runs on Kubernetes. Local install on a kind cluster takes about ten minutes.',
    `- Install: helm install continuo oci://ghcr.io/carolsimone/charts/continuo --version ${site.chartVersion} -n continuo --create-namespace`,
    `- Author: ${site.author.name}, Berlin. ${site.linkedinUrl}`,
    '',
    '## Full text',
    `- [llms-full.txt](${base}/llms-full.txt): every doc and post inline, one file`,
    '',
    '## Docs',
    ...docs.map((d) => `- [${d.data.title}](${base}/docs/${d.id}/): ${d.data.description} ([markdown](${base}/docs/${d.id}.md))`),
    '',
    '## Blog',
    ...posts.map((p) => `- [${p.data.title}](${base}/blog/${p.id}/): ${p.data.description} ([markdown](${base}/blog/${p.id}.md))`),
    `- [RSS feed](${base}/rss.xml): full text of every post`,
    '',
    '## Source',
    `- [GitHub repository](${site.githubUrl})`,
    `- [README](https://raw.githubusercontent.com/carolsimone/continuo/main/README.md): full overview from the repository`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
