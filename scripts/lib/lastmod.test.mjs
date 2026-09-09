import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { contentLastmod, frontmatter } from './lastmod.mjs';

let root;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'lastmod-'));
  await mkdir(path.join(root, 'blog'));
  await mkdir(path.join(root, 'docs'));
  await writeFile(path.join(root, 'blog/a.md'), '---\ntitle: "A"\ndate: 2026-09-03\n---\nbody\n');
  await writeFile(path.join(root, 'blog/d.md'), '---\ntitle: "D"\ndate: 2026-09-05\ndraft: true\n---\nbody\n');
  await writeFile(path.join(root, 'docs/x.md'), '---\ntitle: "X"\nsourceDate: "2026-09-01T10:00:00Z"\n---\nbody\n');
  await writeFile(path.join(root, 'docs/.gitkeep'), '');
});

afterAll(() => rm(root, { recursive: true, force: true }));

describe('frontmatter', () => {
  it('parses the YAML block', () => {
    expect(frontmatter('---\na: 1\nb: "x"\n---\nbody')).toEqual({ a: 1, b: 'x' });
  });

  it('returns an empty object without a block', () => {
    expect(frontmatter('no frontmatter')).toEqual({});
  });
});

describe('contentLastmod', () => {
  it('maps blog posts by date and docs by sourceDate', async () => {
    const m = await contentLastmod(root);
    expect(m.get('/blog/a/')).toBe('2026-09-03T00:00:00.000Z');
    expect(m.get('/docs/x/')).toBe('2026-09-01T10:00:00.000Z');
  });

  it('skips drafts and non-markdown files', async () => {
    const m = await contentLastmod(root);
    expect(m.has('/blog/d/')).toBe(false);
    expect(m.size).toBe(2);
  });
});
