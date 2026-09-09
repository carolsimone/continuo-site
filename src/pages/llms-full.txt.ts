import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../../site.config';
import { llmsFull } from '../lib/markdown';

/** Every doc and published post inline. Answer engines fetch this one URL instead of crawling the site. */
export async function GET({ site: url }: APIContext) {
  const origin = url!.origin;
  const docs = (await getCollection('docs')).sort((a, b) => a.data.order - b.data.order);
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const text = llmsFull(
    [
      '# Continuo',
      '',
      `> ${site.description}`,
      '',
      `Full text of every page on ${url!.host}. The short index is ${origin}/llms.txt.`,
    ],
    [
      {
        heading: 'Docs',
        pages: docs.map((d) => ({
          title: d.data.title,
          description: d.data.description,
          url: `${origin}/docs/${d.id}/`,
          body: d.body ?? '',
          meta: [`Source: ${site.githubUrl}/blob/main/${d.data.sourcePath} (commit ${d.data.sourceSha}, ${d.data.sourceDate.slice(0, 10)})`],
        })),
      },
      {
        heading: 'Blog',
        pages: posts.map((p) => ({
          title: p.data.title,
          description: p.data.description,
          url: `${origin}/blog/${p.id}/`,
          body: p.body ?? '',
          meta: [`Author: ${site.author.name}`, `Published: ${p.data.date.toISOString().slice(0, 10)}`],
        })),
      },
    ],
    origin,
  );
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
