import { describe, it, expect } from 'vitest';
import { sitemapUrls } from './sitemap-urls.mjs';

describe('sitemapUrls', () => {
  it('returns every <loc> in document order', () => {
    const xml = '<urlset><url><loc>https://s.io/</loc></url><url><loc>https://s.io/blog/</loc><lastmod>x</lastmod></url></urlset>';
    expect(sitemapUrls(xml)).toEqual(['https://s.io/', 'https://s.io/blog/']);
  });

  it('returns an empty array when there are none', () => {
    expect(sitemapUrls('<urlset></urlset>')).toEqual([]);
  });
});
