// @ts-check
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import stripReviewNotes from './integrations/strip-review-notes.mjs';
import seoOutput from './integrations/seo-output.mjs';
import { rehypeBrandTerms } from './src/lib/brand-terms.ts';

export default defineConfig({
  // Placeholder until the brand and domain are decided (see CLAUDE.md, open decisions).
  // The live build passes --site https://www.willvinton.com --base /springspot. Builds for
  // any host not in PRODUCTION_HOSTS (src/lib/site.ts), this one included, are noindex.
  site: 'https://springspot.pages.dev',
  output: 'static',
  trailingSlash: 'ignore',
  // Bold, colour-coded branded terms (Springspot Score, Stack, Path...) in all Markdown.
  markdown: { rehypePlugins: [rehypeBrandTerms] },
  // seoOutput runs last: it reads the finished pages to write sitemap.xml.
  integrations: [mdx(), stripReviewNotes(), seoOutput()],
  env: {
    schema: {
      // Klaviyo, for the Score's email gate. Both are public by design: the client
      // subscriptions endpoint takes the public site key. Optional: without them the
      // Score skips Klaviyo and still shows the result. See .env.example.
      PUBLIC_KLAVIYO_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_KLAVIYO_LIST_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
});
