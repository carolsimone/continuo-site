import { describe, it, expect } from 'vitest';
import { personSchema, websiteSchema, softwareSchema, blogPostingSchema, techArticleSchema } from './schema';

const article = {
  title: 'Why this blog exists',
  description: 'Data pipelines ship without a release process.',
  path: '/blog/why-this-blog/',
  published: new Date('2026-09-03T00:00:00Z'),
};

describe('personSchema', () => {
  it('identifies the author and links the profiles', () => {
    const p = personSchema();
    expect(p['@type']).toBe('Person');
    expect(p['@id']).toBe('https://continuo-data.com/#author');
    expect(p.name).toBe('Simone Carolini');
    expect(p.sameAs).toEqual(['https://github.com/carolsimone', 'https://www.linkedin.com/in/simonecarolini/']);
  });
});

describe('websiteSchema', () => {
  it('names the site and points its publisher at the author', () => {
    const w = websiteSchema();
    expect(w['@type']).toBe('WebSite');
    expect(w.url).toBe('https://continuo-data.com/');
    expect(w.publisher).toEqual({ '@id': 'https://continuo-data.com/#author' });
  });
});

describe('softwareSchema', () => {
  it('points at the repository and the Apache 2.0 licence', () => {
    const s = softwareSchema();
    expect(s['@type']).toBe('SoftwareSourceCode');
    expect(s.codeRepository).toBe('https://github.com/carolsimone/continuo');
    expect(s.license).toBe('https://www.apache.org/licenses/LICENSE-2.0');
    expect(s.author).toEqual({ '@id': 'https://continuo-data.com/#author' });
  });
});

describe('blogPostingSchema', () => {
  it('builds absolute URLs and ISO dates', () => {
    const s = blogPostingSchema(article);
    expect(s['@type']).toBe('BlogPosting');
    expect(s.headline).toBe('Why this blog exists');
    expect(s.url).toBe('https://continuo-data.com/blog/why-this-blog/');
    expect(s.mainEntityOfPage).toBe('https://continuo-data.com/blog/why-this-blog/');
    expect(s.datePublished).toBe('2026-09-03T00:00:00.000Z');
    expect(s.dateModified).toBe('2026-09-03T00:00:00.000Z');
    expect(s.image).toBe('https://continuo-data.com/og.jpg');
    expect(s.author).toEqual({ '@id': 'https://continuo-data.com/#author' });
  });

  it('uses the modified date when given', () => {
    const s = blogPostingSchema({ ...article, modified: new Date('2026-09-08T12:00:00Z') });
    expect(s.dateModified).toBe('2026-09-08T12:00:00.000Z');
  });
});

describe('techArticleSchema', () => {
  it('is a TechArticle with the same fields as a BlogPosting', () => {
    const t = techArticleSchema(article);
    expect(t['@type']).toBe('TechArticle');
    expect(t.url).toBe('https://continuo-data.com/blog/why-this-blog/');
  });
});
