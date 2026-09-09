import path from 'node:path/posix';

// [text](url "title") and ![alt](url "title"). Group 1 is "!" for images.
const LINK_RE = /(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g;
const FENCE_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;

function isExternal(url) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
}

function rewriteSegment(segment, ctx, images) {
  const fromDir = path.dirname(ctx.sourcePath);
  return segment.replace(LINK_RE, (whole, bang, text, url, title) => {
    if (url.startsWith('#') || url.startsWith('/') || isExternal(url)) return whole;

    const [rawPath, anchor] = url.split('#');
    const resolved = path.normalize(path.join(fromDir, rawPath));
    const hash = anchor ? `#${anchor}` : '';

    if (bang === '!') {
      const file = path.basename(resolved);
      images.push({ repoPath: resolved, publicPath: `public/docs-assets/${ctx.slug}/${file}` });
      return `![${text}](/docs-assets/${ctx.slug}/${file}${title})`;
    }

    const route = ctx.routes.get(resolved);
    if (route) return `[${text}](${route}${hash}${title})`;

    const kind = rawPath.endsWith('/') ? 'tree' : 'blob';
    const clean = resolved.replace(/\/$/, '');
    return `[${text}](https://github.com/${ctx.repo}/${kind}/${ctx.ref}/${clean}${hash}${title})`;
  });
}

/** Rewrite relative Markdown links and images for a doc mirrored from the continuo repo. */
export function rewriteLinks(markdown, ctx) {
  const images = [];
  const out = markdown
    .split(FENCE_RE)
    .map((part, i) => (i % 2 === 1 ? part : rewriteSegment(part, ctx, images)))
    .join('');
  return { markdown: out, images };
}

/** First H1 becomes the title. The body starts after it. */
export function extractTitle(markdown, fallback = '') {
  const m = markdown.match(/^# (.+)\n+/);
  if (!m) return { title: fallback, body: markdown };
  return { title: m[1].trim(), body: markdown.slice(m[0].length) };
}

const SKIP_PARAGRAPH_RE = /^(#|>|```|~~~|[-*] |\d+\. |\||!\[|<)/;

/** First prose paragraph as plain text for a meta description, capped at `max` characters. */
export function extractDescription(markdown, max = 160) {
  const para = markdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !SKIP_PARAGRAPH_RE.test(p));
  if (!para) return '';
  const text = para
    .replace(/\n/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

const q = (v) => JSON.stringify(String(v));

/** YAML frontmatter for a generated doc. Strings are JSON-quoted, which YAML accepts. */
export function buildDocFrontmatter(f) {
  return [
    '---',
    `title: ${q(f.title)}`,
    `tab: ${q(f.tab)}`,
    `order: ${f.order}`,
    `description: ${q(f.description)}`,
    `sourcePath: ${q(f.sourcePath)}`,
    `sourceSha: ${q(f.sourceSha)}`,
    `sourceDate: ${q(f.sourceDate)}`,
    `syncedAt: ${q(f.syncedAt)}`,
    `editUrl: ${q(f.editUrl)}`,
    '---',
    '',
  ].join('\n');
}
