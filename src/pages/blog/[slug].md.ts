import type { APIContext } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../../../site.config';
import { markdownTwin } from '../../lib/markdown';

type Props = { post: CollectionEntry<'blog'> };

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export function GET({ props, site: url }: APIContext<Props>) {
  const origin = url!.origin;
  const { post } = props;
  const body = markdownTwin(
    {
      title: post.data.title,
      description: post.data.description,
      url: `${origin}/blog/${post.id}/`,
      body: post.body ?? '',
      meta: [`Author: ${site.author.name}`, `Published: ${post.data.date.toISOString().slice(0, 10)}`],
    },
    origin,
  );
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
