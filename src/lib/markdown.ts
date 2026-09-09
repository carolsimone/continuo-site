// Text formats for crawlers and answer engines: markdown twins of pages and the llms-full.txt bundle.

export interface MarkdownPage {
  title: string;
  description: string;
  /** Absolute canonical URL of the HTML page. */
  url: string;
  /** Raw markdown body. Links may be site-relative. */
  body: string;
  /** Extra header lines, e.g. source path or publish date. */
  meta?: string[];
}

/** Make root-relative links and images absolute so the text survives outside the site. */
export function absolutizeLinks(markdown: string, origin: string): string {
  return markdown.replace(/\]\(\/(?!\/)/g, `](${origin}/`);
}

/** One page as standalone markdown: a short header block, then the body. */
export function markdownTwin(page: MarkdownPage, origin: string): string {
  const meta = (page.meta ?? []).map((m) => `> ${m}`);
  return [
    `# ${page.title}`,
    '',
    `> ${page.description}`,
    `> Canonical: ${page.url}`,
    ...meta,
    '',
    absolutizeLinks(page.body, origin).trim(),
    '',
  ].join('\n');
}

/** Every page inline in one file, for engines that fetch a single URL. */
export function llmsFull(intro: string[], sections: { heading: string; pages: MarkdownPage[] }[], origin: string): string {
  const out = [...intro, ''];
  for (const s of sections) {
    out.push(`# ${s.heading}`, '');
    for (const p of s.pages) {
      out.push(markdownTwin(p, origin).replace(/^# /, '## '), '---', '');
    }
  }
  return out.join('\n');
}
