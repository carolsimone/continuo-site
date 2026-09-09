// Schema.org objects for JSON-LD. Each omits @context; Base wraps them in one @graph.
import { site } from '../../site.config';

export type JsonLd = Record<string, unknown>;

export interface ArticleInput {
  title: string;
  description: string;
  /** Site-relative path with trailing slash, e.g. /blog/why-this-blog/ */
  path: string;
  published: Date;
  modified?: Date;
}

const AUTHOR_ID = `${site.url}/#author`;

/** The site's author. Referenced by @id from every other object. */
export function personSchema(): JsonLd {
  return {
    '@type': 'Person',
    '@id': AUTHOR_ID,
    name: site.author.name,
    description: site.author.bio,
    url: `${site.url}/`,
    sameAs: [site.author.githubUrl, site.linkedinUrl],
  };
}

/** The site as a whole. Landing page only. */
export function websiteSchema(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: `${site.url}/`,
    description: site.description,
    inLanguage: 'en',
    publisher: { '@id': AUTHOR_ID },
  };
}

/** Continuo as an open-source project. Landing page only. */
export function softwareSchema(): JsonLd {
  return {
    '@type': 'SoftwareSourceCode',
    '@id': `${site.url}/#software`,
    name: site.name,
    description: site.description,
    url: `${site.url}/`,
    codeRepository: site.githubUrl,
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
    programmingLanguage: ['Python', 'SQL'],
    runtimePlatform: 'Kubernetes',
    author: { '@id': AUTHOR_ID },
  };
}

/** A blog post. */
export function blogPostingSchema(a: ArticleInput): JsonLd {
  const url = `${site.url}${a.path}`;
  return {
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.description,
    url,
    mainEntityOfPage: url,
    datePublished: a.published.toISOString(),
    dateModified: (a.modified ?? a.published).toISOString(),
    image: `${site.url}${site.ogImage.path}`,
    inLanguage: 'en',
    author: { '@id': AUTHOR_ID },
    publisher: { '@id': AUTHOR_ID },
  };
}

/** A mirrored doc. Same shape as a post, typed as technical documentation. */
export function techArticleSchema(a: ArticleInput): JsonLd {
  return { ...blogPostingSchema(a), '@type': 'TechArticle' };
}
