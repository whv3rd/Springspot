// schema.org JSON-LD for search engines and AI answer engines.
// Pure functions (no astro: imports) so they can be unit-tested with `npm test`.

export type JsonLd = Record<string, unknown>;

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AuthorInfo {
  /** Absolute URL of the author page. */
  url: string;
  name: string;
  role: string;
  bio: string;
  /** Absolute URL of the author photo. */
  image?: string;
  sameAs?: string[];
}

export interface PostInfo {
  /** Absolute URL of the post. */
  url: string;
  title: string;
  description: string;
  date: Date;
  updated?: Date;
  section?: string;
  author: AuthorInfo;
  /** Absolute URL of the site home, used for the publisher. */
  siteUrl: string;
  /** Absolute URLs of images that represent the post (the social card first). */
  images?: string[];
  /** Topics, for `keywords`. */
  keywords?: string[];
  wordCount?: number;
}

export interface SiteInfo {
  /** Absolute URL of the site home, with a trailing slash. */
  url: string;
  name: string;
  description: string;
  /** Absolute URL of a square logo (at least 112×112). */
  logo: string;
  /** Profiles that identify the organisation (schema.org sameAs). */
  sameAs?: string[];
  /** The person behind the site. */
  founder?: { id: string; name: string; url: string };
}

export type WebPageType =
  'WebPage' | 'CollectionPage' | 'AboutPage' | 'ProfilePage' | 'ItemPage' | 'FAQPage';

export interface WebPageInfo {
  url: string;
  name: string;
  description: string;
  siteUrl: string;
  type?: WebPageType;
  /** Absolute URL of the page's main image (its social card). */
  image?: string;
  /** Whether the page has a BreadcrumbList, so the page can point at it. */
  hasBreadcrumb?: boolean;
  datePublished?: Date;
  dateModified?: Date;
  /** @id of what the page is about, e.g. the Person on a profile page. */
  mainEntity?: string;
}

export interface Crumb {
  name: string;
  /** Absolute URL. */
  url: string;
}

/**
 * Absolute URL for a root-relative path, respecting the site's base path.
 * absoluteUrl('/blog', 'https://willvinton.com', '/springspot') → https://willvinton.com/springspot/blog
 */
export function absoluteUrl(path: string, site: URL | string, base = '/'): string {
  const prefix = base.replace(/\/+$/, '');
  const rest = path.startsWith('/') ? path : `/${path}`;
  return new URL(`${prefix}${rest}`, site).href;
}

/**
 * Absolute URL for a page, with the trailing slash the static host redirects to, so
 * schema, sitemap and canonical URLs all agree. Paths with a file extension are left alone.
 * pageUrl('/blog', 'https://willvinton.com', '/springspot') → https://willvinton.com/springspot/blog/
 */
export function pageUrl(path: string, site: URL | string, base = '/'): string {
  const url = new URL(absoluteUrl(path, site, base));
  if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) url.pathname += '/';
  return url.href;
}

/** Stable @ids for the site-wide nodes, so every page refers to the same entities. */
export const organizationId = (siteUrl: string) => `${siteUrl}#organization`;
export const websiteId = (siteUrl: string) => `${siteUrl}#website`;
export const webPageId = (url: string) => `${url}#webpage`;
export const breadcrumbId = (url: string) => `${url}#breadcrumb`;

export function organizationSchema(site: SiteInfo): JsonLd {
  return {
    '@type': 'Organization',
    '@id': organizationId(site.url),
    name: site.name,
    url: site.url,
    description: site.description,
    logo: {
      '@type': 'ImageObject',
      '@id': `${site.url}#logo`,
      url: site.logo,
      contentUrl: site.logo,
      caption: site.name,
    },
    image: { '@id': `${site.url}#logo` },
    ...(site.founder && {
      founder: {
        '@type': 'Person',
        '@id': site.founder.id,
        name: site.founder.name,
        url: site.founder.url,
      },
    }),
    ...(site.sameAs?.length && { sameAs: site.sameAs }),
  };
}

export function websiteSchema(site: SiteInfo): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': websiteId(site.url),
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: 'en-US',
    publisher: { '@id': organizationId(site.url) },
  };
}

export function webPageSchema(page: WebPageInfo): JsonLd {
  return {
    '@type': page.type ?? 'WebPage',
    '@id': webPageId(page.url),
    url: page.url,
    name: page.name,
    description: page.description,
    inLanguage: 'en-US',
    isPartOf: { '@id': websiteId(page.siteUrl) },
    ...(page.image && {
      primaryImageOfPage: { '@type': 'ImageObject', url: page.image },
      image: page.image,
    }),
    ...(page.hasBreadcrumb && { breadcrumb: { '@id': breadcrumbId(page.url) } }),
    ...(page.datePublished && { datePublished: page.datePublished.toISOString() }),
    ...(page.dateModified && { dateModified: page.dateModified.toISOString() }),
    ...(page.mainEntity && { mainEntity: { '@id': page.mainEntity } }),
  };
}

/** Stable @id for the author, so every page refers to the same Person. */
export function personId(author: Pick<AuthorInfo, 'url'>): string {
  return `${author.url}#person`;
}

export function personSchema(author: AuthorInfo): JsonLd {
  return {
    '@type': 'Person',
    '@id': personId(author),
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    url: author.url,
    ...(author.image && { image: author.image }),
    ...(author.sameAs?.length && { sameAs: author.sameAs }),
  };
}

export function blogPostingSchema(post: PostInfo): JsonLd {
  return {
    '@type': 'BlogPosting',
    '@id': `${post.url}#article`,
    headline: post.title,
    description: post.description,
    url: post.url,
    mainEntityOfPage: { '@id': webPageId(post.url) },
    isPartOf: { '@type': 'Blog', '@id': `${post.siteUrl}blog/#blog`, url: `${post.siteUrl}blog/` },
    datePublished: post.date.toISOString(),
    dateModified: (post.updated ?? post.date).toISOString(),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    ...(post.section && { articleSection: post.section }),
    ...(post.keywords?.length && { keywords: post.keywords.join(', ') }),
    ...(post.wordCount && { wordCount: post.wordCount }),
    author: {
      '@id': personId(post.author),
      '@type': 'Person',
      name: post.author.name,
      url: post.author.url,
    },
    publisher: { '@id': organizationId(post.siteUrl) },
    ...(post.images?.length
      ? { image: post.images }
      : post.author.image && { image: post.author.image }),
  };
}

export function faqSchema(faq: FaqItem[], pageUrl: string): JsonLd {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Breadcrumbs, ancestors first; the last crumb is the current page. */
export function breadcrumbSchema(crumbs: Crumb[]): JsonLd {
  const current = crumbs.at(-1);
  return {
    '@type': 'BreadcrumbList',
    ...(current && { '@id': breadcrumbId(current.url) }),
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export interface BlogListing {
  /** Absolute URL of the blog index. */
  url: string;
  name: string;
  description: string;
  siteUrl: string;
  posts: { url: string; title: string; date: Date; updated?: Date }[];
}

/** The blog itself, listing its posts (by @id, so they match each post's own BlogPosting). */
export function blogSchema(blog: BlogListing): JsonLd {
  return {
    '@type': 'Blog',
    '@id': `${blog.url}#blog`,
    url: blog.url,
    name: blog.name,
    description: blog.description,
    inLanguage: 'en-US',
    isPartOf: { '@id': websiteId(blog.siteUrl) },
    publisher: { '@id': organizationId(blog.siteUrl) },
    blogPost: blog.posts.map((post) => ({
      '@type': 'BlogPosting',
      '@id': `${post.url}#article`,
      headline: post.title,
      url: post.url,
      datePublished: post.date.toISOString(),
      dateModified: (post.updated ?? post.date).toISOString(),
    })),
  };
}

export interface GuideInfo {
  url: string;
  title: string;
  description: string;
  siteUrl: string;
  section: string;
  author: AuthorInfo;
  image?: string;
}

/** A free Path guide: a how-to article, free to read. */
export function guideSchema(guide: GuideInfo): JsonLd {
  return {
    '@type': 'TechArticle',
    '@id': `${guide.url}#article`,
    headline: guide.title,
    description: guide.description,
    url: guide.url,
    mainEntityOfPage: { '@id': webPageId(guide.url) },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    articleSection: guide.section,
    author: {
      '@id': personId(guide.author),
      '@type': 'Person',
      name: guide.author.name,
      url: guide.author.url,
    },
    publisher: { '@id': organizationId(guide.siteUrl) },
    ...(guide.image && { image: guide.image }),
  };
}

/** Wraps nodes in one @graph document. */
export function graph(nodes: JsonLd[]): JsonLd {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

/** JSON for a <script type="application/ld+json">, safe against a closing </script>. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
