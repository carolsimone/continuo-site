#!/usr/bin/env node
// Fetches the docs listed in docs.manifest.yaml from the continuo repo,
// rewrites links, and writes them into src/content/docs. Runs before astro build.
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { rewriteLinks, extractTitle, buildDocFrontmatter } from './lib/rewrite-links.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src/content/docs');
const ASSETS_DIR = path.join(ROOT, 'public/docs-assets');

const log = (msg) => console.error(`[sync-docs] ${msg}`);

async function fetchOk(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

async function latestSha(repo, ref, filePath) {
  const url = `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(filePath)}&sha=${ref}&per_page=1`;
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'continuo-site-sync' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const [first] = await (await fetchOk(url, { headers })).json();
    return first?.sha ? first.sha.slice(0, 7) : ref;
  } catch (err) {
    log(`sha lookup failed for ${filePath} (${err.message}); using "${ref}"`);
    return ref;
  }
}

async function main() {
  const manifest = parse(await readFile(path.join(ROOT, 'docs.manifest.yaml'), 'utf8'));
  const { source_repo: repo, ref, docs } = manifest;
  const routes = new Map(docs.map((d) => [d.path, `/docs/${d.slug}/`]));
  const raw = (p) => `https://raw.githubusercontent.com/${repo}/${ref}/${p}`;

  await rm(OUT_DIR, { recursive: true, force: true });
  await rm(ASSETS_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, '.gitkeep'), '');

  for (const [i, doc] of docs.entries()) {
    const source = await (await fetchOk(raw(doc.path))).text();
    const sha = await latestSha(repo, ref, doc.path);
    const { title, body } = extractTitle(source, doc.title);
    const { markdown, images } = rewriteLinks(body, { sourcePath: doc.path, slug: doc.slug, repo, ref, routes });

    for (const img of images) {
      const dest = path.join(ROOT, img.publicPath);
      await mkdir(path.dirname(dest), { recursive: true });
      const bytes = Buffer.from(await (await fetchOk(raw(img.repoPath))).arrayBuffer());
      await writeFile(dest, bytes);
    }

    const frontmatter = buildDocFrontmatter({
      title,
      tab: doc.title,
      order: i + 1,
      sourcePath: doc.path,
      sourceSha: sha,
      syncedAt: new Date().toISOString(),
      editUrl: `https://github.com/${repo}/edit/${ref}/${doc.path}`,
    });
    await writeFile(path.join(OUT_DIR, `${doc.slug}.md`), frontmatter + markdown);
    log(`${doc.path} -> src/content/docs/${doc.slug}.md (${sha}, ${images.length} images)`);
  }
}

main().catch((err) => {
  log(`FAILED: ${err.message}`);
  process.exit(1);
});
