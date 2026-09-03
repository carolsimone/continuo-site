import { describe, it, expect } from 'vitest';
import { rewriteLinks, extractTitle, buildDocFrontmatter } from './rewrite-links.mjs';

const ctx = {
  sourcePath: 'docs/try-it-locally.md',
  slug: 'try-it-locally',
  repo: 'carolsimone/continuo',
  ref: 'main',
  routes: new Map([
    ['docs/try-it-locally.md', '/docs/try-it-locally/'],
    ['deploy/README.md', '/docs/deploy/'],
    ['docs/roadmap.md', '/docs/roadmap/'],
  ]),
};
const deployCtx = { ...ctx, sourcePath: 'deploy/README.md', slug: 'deploy' };

describe('rewriteLinks', () => {
  it('maps a relative link to a manifest file onto its site route', () => {
    expect(rewriteLinks('see [deploy](../deploy/README.md)', ctx).markdown).toBe('see [deploy](/docs/deploy/)');
  });

  it('keeps the anchor on a site route', () => {
    expect(rewriteLinks('[x](../deploy/README.md#install-paths)', ctx).markdown).toBe('[x](/docs/deploy/#install-paths)');
  });

  it('sends a relative link to a non-manifest file to GitHub blob', () => {
    expect(rewriteLinks('[c](../deploy/dbt-image-contract.md)', ctx).markdown)
      .toBe('[c](https://github.com/carolsimone/continuo/blob/main/deploy/dbt-image-contract.md)');
  });

  it('keeps the anchor on a GitHub link', () => {
    expect(rewriteLinks('[r](../README.md#try-it-locally)', ctx).markdown)
      .toBe('[r](https://github.com/carolsimone/continuo/blob/main/README.md#try-it-locally)');
  });

  it('sends a directory link to GitHub tree', () => {
    expect(rewriteLinks('[d](continuo/)', deployCtx).markdown)
      .toBe('[d](https://github.com/carolsimone/continuo/tree/main/deploy/continuo)');
  });

  it('resolves a sibling file from a nested source path', () => {
    expect(rewriteLinks('[a](AUTH.md)', deployCtx).markdown)
      .toBe('[a](https://github.com/carolsimone/continuo/blob/main/deploy/AUTH.md)');
  });

  it('leaves absolute, mailto, root-relative, and same-page links alone', () => {
    const src = '[a](https://x.io/p) [m](mailto:hi@x.io) [h](#top) [s](/already/site)';
    expect(rewriteLinks(src, ctx).markdown).toBe(src);
  });

  it('keeps link titles', () => {
    expect(rewriteLinks('[d](../deploy/README.md "Deploy")', ctx).markdown).toBe('[d](/docs/deploy/ "Deploy")');
  });

  it('rewrites a relative image and records the copy', () => {
    const { markdown, images } = rewriteLinks('![graph](../docs/logo/mark.svg)', deployCtx);
    expect(markdown).toBe('![graph](/docs-assets/deploy/mark.svg)');
    expect(images).toEqual([{ repoPath: 'docs/logo/mark.svg', publicPath: 'public/docs-assets/deploy/mark.svg' }]);
  });

  it('does not touch links inside fenced code blocks', () => {
    const src = 'text\n```bash\necho "[x](../deploy/README.md)"\n```\n[y](../deploy/README.md)';
    expect(rewriteLinks(src, ctx).markdown)
      .toBe('text\n```bash\necho "[x](../deploy/README.md)"\n```\n[y](/docs/deploy/)');
  });
});

describe('extractTitle', () => {
  it('takes the first H1 as title and removes it from the body', () => {
    const { title, body } = extractTitle('# Roadmap\n\nPlanned work.\n');
    expect(title).toBe('Roadmap');
    expect(body).toBe('Planned work.\n');
  });

  it('falls back to the given title when there is no H1', () => {
    const { title, body } = extractTitle('Just text.\n', 'Deploy');
    expect(title).toBe('Deploy');
    expect(body).toBe('Just text.\n');
  });
});

describe('buildDocFrontmatter', () => {
  it('emits YAML with every string quoted', () => {
    const fm = buildDocFrontmatter({
      title: 'Try it locally, with real data projects',
      tab: 'Try it locally',
      order: 1,
      sourcePath: 'docs/try-it-locally.md',
      sourceSha: 'a1b2c3d',
      syncedAt: '2026-09-03T10:00:00.000Z',
      editUrl: 'https://github.com/carolsimone/continuo/edit/main/docs/try-it-locally.md',
    });
    expect(fm).toBe([
      '---',
      'title: "Try it locally, with real data projects"',
      'tab: "Try it locally"',
      'order: 1',
      'sourcePath: "docs/try-it-locally.md"',
      'sourceSha: "a1b2c3d"',
      'syncedAt: "2026-09-03T10:00:00.000Z"',
      'editUrl: "https://github.com/carolsimone/continuo/edit/main/docs/try-it-locally.md"',
      '---',
      '',
    ].join('\n'));
  });
});
