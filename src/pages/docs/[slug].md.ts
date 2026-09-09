import type { APIContext } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../../../site.config';
import { markdownTwin } from '../../lib/markdown';

type Props = { doc: CollectionEntry<'docs'> };

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  return docs.map((doc) => ({ params: { slug: doc.id }, props: { doc } }));
}

export function GET({ props, site: url }: APIContext<Props>) {
  const origin = url!.origin;
  const { doc } = props;
  const body = markdownTwin(
    {
      title: doc.data.title,
      description: doc.data.description,
      url: `${origin}/docs/${doc.id}/`,
      body: doc.body ?? '',
      meta: [`Source: ${site.githubUrl}/blob/main/${doc.data.sourcePath} (commit ${doc.data.sourceSha}, ${doc.data.sourceDate.slice(0, 10)})`],
    },
    origin,
  );
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
