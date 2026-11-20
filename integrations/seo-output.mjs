// Not type-checked: astro check has no Node types (no @types/node in the project).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// A root-relative page link without a trailing slash, e.g. href="/score" or "/blog/x#faq".
// Links to files (anything with an extension in the last segment) are left alone.
const PAGE_LINK = /(\shref=["'])(\/(?:[^"'?#.]*\/)*[^"'?#./]+)(?=[?#"'])/g;

const xml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (html, re) => html.match(re)?.[1];

/**
 * Post-build search housekeeping, after every page is written:
 * 1. Internal links get the trailing slash the static host redirects to, so a click (or a
 *    crawl) never costs a redirect, and links match the canonical URLs.
 * 2. sitemap.xml lists every indexable page by its canonical URL. Pages marked noindex
 *    (the styleguide, paywalled parts, any non-production build) are left out, so the
 *    sitemap can't drift from what the pages themselves say. Posts carry a lastmod.
 */
export default function seoOutput() {
  return {
    name: 'seo-output',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await readdir(root, { recursive: true }))
          .map((f) => f.split('\\').join('/'))
          .filter((f) => f.endsWith('.html'))
          .sort();
        const urls = [];
        let relinked = 0;
        for (const file of files) {
          const path = join(root, file);
          const html = await readFile(path, 'utf8');
          const fixed = html.replace(PAGE_LINK, '$1$2/');
          if (fixed !== html) {
            await writeFile(path, fixed);
            relinked++;
          }
          const robots = attr(html, /<meta name="robots" content="([^"]*)"/) ?? '';
          const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
          if (!canonical || /noindex/.test(robots)) continue;
          const modified = attr(html, /<meta property="article:modified_time" content="([^"]*)"/);
          urls.push({ loc: canonical, lastmod: modified?.slice(0, 10) });
        }
        const body = urls
          .map(
            ({ loc, lastmod }) =>
              `  <url><loc>${xml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
          )
          .join('\n');
        await writeFile(
          join(root, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
        );
        logger.info(`Added trailing slashes to links in ${relinked} file(s)`);
        logger.info(`Wrote sitemap.xml with ${urls.length} URL(s)`);
      },
    },
  };
}
