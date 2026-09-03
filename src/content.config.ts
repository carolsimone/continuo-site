import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    tab: z.string(),
    order: z.number(),
    sourcePath: z.string(),
    sourceSha: z.string(),
    syncedAt: z.string(),
    editUrl: z.string().url(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    video: z.string().optional(),
  }),
});

export const collections = { blog, docs };
