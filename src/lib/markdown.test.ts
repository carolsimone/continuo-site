import { describe, it, expect } from 'vitest';
import { absolutizeLinks, markdownTwin, llmsFull } from './markdown';

describe('absolutizeLinks', () => {
  it('prefixes root-relative links and images with the origin', () => {
    expect(absolutizeLinks('[a](/docs/x/) ![i](/docs-assets/x/y.png)', 'https://s.io'))
      .toBe('[a](https://s.io/docs/x/) ![i](https://s.io/docs-assets/x/y.png)');
  });

  it('leaves absolute, protocol-relative, and anchor links alone', () => {
    const src = '[a](https://x.io/) [b](#top) [c](//cdn.io/x)';
    expect(absolutizeLinks(src, 'https://s.io')).toBe(src);
  });
});

describe('markdownTwin', () => {
  it('writes a title, description, canonical, extra meta, and the absolutized body', () => {
    const md = markdownTwin(
      { title: 'T', description: 'D', url: 'https://s.io/blog/t/', body: 'See [x](/docs/x/).\n', meta: ['Source: continuo/docs/x.md'] },
      'https://s.io',
    );
    expect(md).toBe('# T\n\n> D\n> Canonical: https://s.io/blog/t/\n> Source: continuo/docs/x.md\n\nSee [x](https://s.io/docs/x/).\n');
  });
});

describe('llmsFull', () => {
  it('concatenates the intro, section headings, and pages with separators', () => {
    const out = llmsFull(
      ['# Site', '', '> tagline'],
      [{ heading: 'Docs', pages: [{ title: 'T', description: 'D', url: 'https://s.io/d/', body: 'b' }] }],
      'https://s.io',
    );
    expect(out).toBe('# Site\n\n> tagline\n\n# Docs\n\n## T\n\n> D\n> Canonical: https://s.io/d/\n\nb\n\n---\n');
  });
});
