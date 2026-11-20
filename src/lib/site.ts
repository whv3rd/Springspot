// Site-wide identity and search settings, shared by the layout, the sitemap and the feed.

export const SITE_NAME = 'Springspot AI';
export const SITE_TAGLINE =
  'Your jumping-off point to run leaner, launch more and scale without adding headcount.';
export const SITE_DESCRIPTION =
  'Springspot AI teaches small and mid-sized ecommerce businesses to connect their design, platform and marketing systems to AI, so one operator or a small team can run the store.';

/** The author who speaks for the site, as an authors-collection slug. */
export const SITE_AUTHOR = 'will-vinton';
export const SITE_AUTHOR_NAME = 'Will Vinton';

/** Square logo under public/, used for the Organization in schema. */
export const LOGO_PATH = '/logo.png';

/**
 * Hosts the site is meant to be indexed on. A build for any other `site` (local builds,
 * Cloudflare Pages previews on *.pages.dev) is marked noindex, so a copy of the site can
 * never compete with the real one in search. Add springspot.ai here when it goes live.
 */
export const PRODUCTION_HOSTS = ['www.willvinton.com', 'springspot.ai', 'www.springspot.ai'];

export function isProductionSite(site: URL | undefined): boolean {
  return !!site && PRODUCTION_HOSTS.includes(site.hostname);
}

/** Robots directives for indexable pages: allow large image previews and full snippets. */
export const ROBOTS_INDEX =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
