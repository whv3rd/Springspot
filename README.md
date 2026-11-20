# Springspot

Education-first site (blog, docs and paid library) for Springspot — the point where one operator or a small team can run an ecommerce business on AI-connected design, platform and marketing systems. See `CLAUDE.md` and `docs/` for the concept and plan.

Built with [Astro](https://astro.build) + TypeScript as a static site, deployed on Cloudflare Pages.

## Local development

Requires Node 22.22+ (see `.nvmrc`).

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command                | What it does                                        |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start the dev server                                |
| `npm run build`        | Type-check (`astro check`) and build to `dist/`     |
| `npm run preview`      | Serve the built site locally                        |
| `npm run check`        | Type-check `.astro`/`.ts` files and content schemas |
| `npm run lint`         | ESLint                                              |
| `npm test`             | Score and Klaviyo tests (Node's built-in runner)    |
| `npm run format`       | Prettier (write)                                    |
| `npm run format:check` | Prettier (check only)                               |

## Content

All content is Markdown or MDX in `src/content/`, validated by the schemas in `src/content.config.ts`. A frontmatter mistake fails the build.

| Collection | Location                             | Key frontmatter                                                                 |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| `blog`     | `src/content/blog/<slug>.md`         | `title`, `description`, `date`, `pillar`, `draft`, `author`, `takeaways`, `faq` |
| `authors`  | `src/content/authors/<slug>.md`      | `name`, `role`, `bio`, `image`, `links`                                         |
| `path`     | `src/content/path/<track>/<part>.md` | `title`, `description`, `track`, `part`, `order`, `access`, `teaser`            |
| `pages`    | `src/content/pages/<slug>.md`        | `title`, `description`                                                          |

- `pillar`: `diary` | `teardown` | `playbook` | `shift`
- `track`: `start-here` | `design-system` | `ai-design` | `platform-mcp` | `marketing-mcp` | `processes`
- `part`: `overview` | `requirements` | `build-guide` | `templates` | `workflows` | `checklist`
- `access`: `free` | `paid` — paid parts render `teaser` plus a paywall linking to `/pricing`.
- `author`: an `authors` slug; defaults to `will-vinton`. Each author gets a page at `/authors/<slug>` listing their posts.
- `takeaways`: optional list of short sentences, shown as a "Key takeaways" box under the title. Lead with the answer.
- `faq`: optional list of `question` / `answer` pairs, shown after the post. Answers should stand on their own, since search and AI tools quote them out of context.

## Search and sharing

Every page gets its search and social metadata from `src/layouts/BaseLayout.astro`; pages only pass what's specific to them (`breadcrumbs`, `pageType`, `schema`, `image`, `article`, `noindex`).

- **Metadata:** title, description, canonical (always with a trailing slash), robots, Open Graph and Twitter card tags, plus `article:*` tags on posts.
- **Structured data:** one JSON-LD `@graph` per page from `src/lib/schema.ts`: `Organization` and `WebSite` on every page, a `WebPage` node (or `CollectionPage`, `AboutPage`, `ProfilePage`), a `BreadcrumbList` when the page passes `breadcrumbs`, and the page's own nodes: `BlogPosting`, `Person` and `FAQPage` on posts, `Blog` on the blog index, `TechArticle` on free Path parts. Validate a page at https://validator.schema.org or https://search.google.com/test/rich-results.
- **Social cards:** `src/assets/og/default.png` for every page, and `src/assets/og/blog/<slug>.png` for each post. After adding a post or changing a title, run `npx -y -p playwright@1 node scripts/social-cards.mjs` (add `--force` to redraw them all). A post without a card falls back to the site card. The same script draws `public/logo.png` and `public/apple-touch-icon.png`.
- **Indexing:** only builds whose `site` is in `PRODUCTION_HOSTS` (`src/lib/site.ts`) are indexable; everything else (local builds, Cloudflare previews on `*.pages.dev`) is `noindex, nofollow`. Paid Path parts are `noindex, follow` while they're a teaser and a paywall. Add `springspot.ai` hosts there before moving domains.
- **Sitemap and feed:** `integrations/seo-output.mjs` writes `sitemap.xml` after the build from the finished pages (every indexable page, by canonical URL, with `lastmod` on posts) and adds trailing slashes to internal links. `src/pages/rss.xml.ts` is the blog's RSS feed. `robots.txt` lives at the domain root, in the willvinton.com repo.
- **Internal links:** each post ends with three related posts (same pillar first), so nothing sits more than a couple of clicks from the blog index.

Paywall rule: anything that explains _what_ or _why_ is free; anything you could follow step by step to _build_ it is paid. Default access per part lives in `src/lib/path.ts`.

## Deploying to Cloudflare Pages

The site is fully static, so no adapter is needed. One-time setup in the Cloudflare dashboard:

1. **Workers & Pages → Create → Pages → Connect to Git**, and pick `whv3rd/springboard`.
2. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Production branch: `main`
3. Environment variables (Production and Preview): `NODE_VERSION` = `22`, plus `PUBLIC_KLAVIYO_SITE_KEY` and `PUBLIC_KLAVIYO_LIST_ID` for the Score's email gate (see `.env.example`). Without the Klaviyo keys the Score still works but sends nothing to Klaviyo. They are read at build time, so redeploy after changing them.
4. Save and deploy.

After that, every push to `main` deploys to production, and every PR gets a preview deployment with its own URL, posted on the PR.

The `site` URL in `astro.config.mjs` is a placeholder (`https://springspot.pages.dev`) until the domain is decided. Update it when a custom domain is attached in Pages → Custom domains, and add the domain to `PRODUCTION_HOSTS` in `src/lib/site.ts`: until then a Cloudflare build is `noindex`, so it can't compete in search with the live copy at willvinton.com/springspot.
