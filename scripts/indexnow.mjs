#!/usr/bin/env node
// Submits every sitemap URL to IndexNow so Bing (and ChatGPT search, which uses Bing's index) recrawls promptly.
// CI runs it on every push to main. Cloudflare Pages deploys in parallel, so the crawl may land a minute
// before the new build; IndexNow queues the fetch, so that is fine.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sitemapUrls } from './lib/sitemap-urls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY_FILE = 'indexnow-key.txt';
const log = (msg) => console.error(`[indexnow] ${msg}`);

async function main() {
  const key = (await readFile(path.join(ROOT, 'public', KEY_FILE), 'utf8')).trim();
  const urlList = sitemapUrls(await readFile(path.join(ROOT, 'dist/sitemap-0.xml'), 'utf8'));
  if (urlList.length === 0) throw new Error('no URLs in dist/sitemap-0.xml; build first');
  const host = new URL(urlList[0]).host;
  const payload = { host, key, keyLocation: `https://${host}/${KEY_FILE}`, urlList };

  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  log(`${res.status} ${res.statusText} for ${urlList.length} URLs`);
  if (res.status !== 200 && res.status !== 202) process.exit(1);
}

main().catch((err) => {
  log(`FAILED: ${err.message}`);
  process.exit(1);
});
