import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { site } from '../../site.config';
import { absolutizeLinks } from '../lib/markdown';

const parser = new MarkdownIt();

export async function GET(context: APIContext) {
  const origin = context.site!.origin;
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: 'Continuo blog',
    description: site.description,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.description,
      link: `/blog/${p.id}/`,
      content: sanitizeHtml(parser.render(absolutizeLinks(p.body ?? '', origin)), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
    })),
  });
}
