# continuo-site

Source of https://continuo-data.com. Landing page, blog, and a read-only mirror of three docs from [continuo](https://github.com/carolsimone/continuo).

## Stack

Astro, static output, on Cloudflare Pages. Decided 2026-09-03, not revisited this quarter. Design: `docs/superpowers/specs/2026-09-03-continuo-site-design.md` in the continuo-strategy repo.

## Run

```bash
npm ci
npm run sync-docs   # fetches the mirrored docs from continuo main
npm run dev
```

## Test

```bash
npm test            # link rewriter
npm run check       # astro check
npm run build
```

## Docs mirror

`docs.manifest.yaml` lists the continuo files shown under `/docs`. Add a line, rebuild. Source of truth stays in continuo. Continuo CI triggers a rebuild when a listed file changes.
