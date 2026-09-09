// Last-modified dates for the sitemap, read straight from content frontmatter.
// astro.config.mjs cannot use astro:content, so this reads the files itself.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';

/** Frontmatter of a markdown file as an object, or {} when there is none. */
export function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  return m ? parse(m[1]) ?? {} : {};
}

/** Map of site pathname -> ISO date. Blog posts use `date`; docs use `sourceDate`. Drafts are skipped. */
export async function contentLastmod(contentDir) {
  const out = new Map();
  const collect = async (sub, field) => {
    const dir = path.join(contentDir, sub);
    for (const file of await readdir(dir)) {
      if (!file.endsWith('.md')) continue;
      const fm = frontmatter(await readFile(path.join(dir, file), 'utf8'));
      if (fm.draft || !fm[field]) continue;
      out.set(`/${sub}/${file.slice(0, -3)}/`, new Date(fm[field]).toISOString());
    }
  };
  await collect('blog', 'date');
  await collect('docs', 'sourceDate');
  return out;
}
