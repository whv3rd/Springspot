import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { getPublishedPosts } from '@/lib/blog';
import { PILLAR_LABELS } from '@/lib/path';
import { pageUrl } from '@/lib/schema';
import { SITE_AUTHOR, SITE_NAME } from '@/lib/site';

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 feed of the blog: feed readers, and a quick discovery signal for new posts. */
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Set `site` for absolute URLs in the feed.');
  const base = import.meta.env.BASE_URL;
  const posts = await getPublishedPosts();
  const author = await getEntry('authors', SITE_AUTHOR);
  const blogUrl = pageUrl('/blog', site, base);
  const feedUrl = new URL(`${base.replace(/\/$/, '')}/rss.xml`, site).href;

  const items = posts
    .map((post) => {
      const url = pageUrl(`/blog/${post.id}`, site, base);
      return `    <item>
      <title>${xml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${xml(post.data.description)}</description>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <category>${xml(PILLAR_LABELS[post.data.pillar])}</category>
      <dc:creator>${xml(author?.data.name ?? SITE_NAME)}</dc:creator>
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(`${SITE_NAME} blog`)}</title>
    <link>${blogUrl}</link>
    <description>Operator diaries, teardowns, free playbooks and opinion on running ecommerce with AI-connected systems.</description>
    <language>en-us</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${posts[0] ? `    <lastBuildDate>${(posts[0].data.updated ?? posts[0].data.date).toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
