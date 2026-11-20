import type { ImageMetadata } from 'astro';

// Per-post social cards, rendered by scripts/social-cards.mjs into src/assets/og/blog/.
// Imported through Vite so they ship with a content hash, under the site's base path.
const cards = import.meta.glob<{ default: ImageMetadata }>('../assets/og/blog/*.png', {
  eager: true,
});

/** The social card for a blog post, or undefined if it hasn't been rendered yet. */
export function postCard(slug: string): ImageMetadata | undefined {
  return cards[`../assets/og/blog/${slug}.png`]?.default;
}
