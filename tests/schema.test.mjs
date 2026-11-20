// JSON-LD helper tests. Run with `npm test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  absoluteUrl,
  blogPostingSchema,
  blogSchema,
  breadcrumbSchema,
  faqSchema,
  graph,
  guideSchema,
  organizationSchema,
  pageUrl,
  personSchema,
  serializeJsonLd,
  webPageSchema,
  websiteSchema,
} from '../src/lib/schema.ts';

const author = {
  url: 'https://willvinton.com/springspot/authors/will-vinton',
  name: 'Will Vinton',
  role: 'Ecommerce operator',
  bio: 'Bio.',
  image: 'https://willvinton.com/springspot/authors/will-vinton.jpg',
  sameAs: ['https://www.linkedin.com/in/will-vinton'],
};

test('absoluteUrl respects the base path', () => {
  const site = 'https://willvinton.com';
  assert.equal(absoluteUrl('/blog', site, '/springspot'), 'https://willvinton.com/springspot/blog');
  assert.equal(
    absoluteUrl('/blog', site, '/springspot/'),
    'https://willvinton.com/springspot/blog',
  );
  assert.equal(absoluteUrl('blog', site, '/springspot'), 'https://willvinton.com/springspot/blog');
  assert.equal(absoluteUrl('/', site, '/springspot'), 'https://willvinton.com/springspot/');
  assert.equal(absoluteUrl('/blog', site), 'https://willvinton.com/blog');
  assert.equal(
    absoluteUrl('/blog', new URL('https://example.com'), '/'),
    'https://example.com/blog',
  );
});

test('pageUrl ends page URLs in a slash, but not file URLs', () => {
  const site = 'https://willvinton.com';
  assert.equal(pageUrl('/blog', site, '/springspot'), 'https://willvinton.com/springspot/blog/');
  assert.equal(pageUrl('/blog/', site, '/springspot'), 'https://willvinton.com/springspot/blog/');
  assert.equal(pageUrl('/', site, '/springspot'), 'https://willvinton.com/springspot/');
  assert.equal(
    pageUrl('/rss.xml', site, '/springspot'),
    'https://willvinton.com/springspot/rss.xml',
  );
});

test('person has a stable @id and its profiles', () => {
  const person = personSchema(author);
  assert.equal(person['@type'], 'Person');
  assert.equal(person['@id'], `${author.url}#person`);
  assert.deepEqual(person.sameAs, author.sameAs);
});

const site = {
  url: 'https://x.test/springspot/',
  name: 'Springspot AI',
  description: 'D',
  logo: 'https://x.test/springspot/logo.png',
  founder: { id: `${author.url}#person`, name: author.name, url: author.url },
};

test('organization, website and page link up by @id', () => {
  const org = organizationSchema(site);
  const web = websiteSchema(site);
  const page = webPageSchema({
    url: 'https://x.test/springspot/about/',
    name: 'About',
    description: 'D',
    siteUrl: site.url,
    type: 'AboutPage',
    hasBreadcrumb: true,
  });
  assert.equal(org['@id'], 'https://x.test/springspot/#organization');
  assert.equal(org.logo.url, site.logo);
  assert.equal(org.founder.name, 'Will Vinton');
  assert.equal(web.publisher['@id'], org['@id']);
  assert.equal(page['@type'], 'AboutPage');
  assert.equal(page.isPartOf['@id'], web['@id']);
  assert.equal(page.breadcrumb['@id'], 'https://x.test/springspot/about/#breadcrumb');
  assert.equal('image' in page, false);
});

test('blog lists its posts by the same @id each post uses', () => {
  const blog = blogSchema({
    url: 'https://x.test/springspot/blog/',
    name: 'Blog',
    description: 'D',
    siteUrl: site.url,
    posts: [{ url: 'https://x.test/springspot/blog/p/', title: 'P', date: new Date(0) }],
  });
  assert.equal(blog['@type'], 'Blog');
  assert.equal(blog.blogPost[0]['@id'], 'https://x.test/springspot/blog/p/#article');
});

test('free guides are TechArticles marked free to read', () => {
  const guide = guideSchema({
    url: 'https://x.test/springspot/path/a/overview/',
    title: 'Overview',
    description: 'D',
    siteUrl: site.url,
    section: 'The Path',
    author,
  });
  assert.equal(guide['@type'], 'TechArticle');
  assert.equal(guide.isAccessibleForFree, true);
  assert.equal(guide.publisher['@id'], 'https://x.test/springspot/#organization');
});

test('person omits empty optional fields', () => {
  const person = personSchema({ ...author, image: undefined, sameAs: [] });
  assert.equal('image' in person, false);
  assert.equal('sameAs' in person, false);
});

test('blog posting links to the author and falls back to the publish date', () => {
  const post = blogPostingSchema({
    url: 'https://willvinton.com/springspot/blog/x',
    title: 'T',
    description: 'D',
    date: new Date('2026-09-01T00:00:00Z'),
    section: 'The shift',
    author,
    siteUrl: 'https://willvinton.com/springspot/',
  });
  assert.equal(post['@type'], 'BlogPosting');
  assert.equal(post.datePublished, '2026-09-01T00:00:00.000Z');
  assert.equal(post.dateModified, post.datePublished);
  assert.equal(post.author['@id'], `${author.url}#person`);
  assert.equal(post.author.name, 'Will Vinton');
  assert.equal(post.articleSection, 'The shift');
  assert.equal(post.publisher['@id'], 'https://willvinton.com/springspot/#organization');
  assert.equal(post.mainEntityOfPage['@id'], 'https://willvinton.com/springspot/blog/x#webpage');
  // Without a card, the author photo stands in as the image.
  assert.equal(post.image, author.image);
});

test('blog posting prefers its social card as the image', () => {
  const post = blogPostingSchema({
    url: 'https://willvinton.com/springspot/blog/x/',
    title: 'T',
    description: 'D',
    date: new Date('2026-09-01T00:00:00Z'),
    author,
    siteUrl: 'https://willvinton.com/springspot/',
    images: ['https://willvinton.com/springspot/_astro/x.png'],
    wordCount: 900,
  });
  assert.deepEqual(post.image, ['https://willvinton.com/springspot/_astro/x.png']);
  assert.equal(post.wordCount, 900);
});

test('faq maps each item to a Question with an accepted Answer', () => {
  const faq = faqSchema([{ question: 'Q?', answer: 'A.' }], 'https://x.test/p');
  assert.equal(faq['@type'], 'FAQPage');
  assert.deepEqual(faq.mainEntity, [
    { '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } },
  ]);
});

test('breadcrumbs are numbered from 1 and identified by the current page', () => {
  const crumbs = breadcrumbSchema([
    { name: 'Blog', url: 'https://x.test/blog' },
    { name: 'Post', url: 'https://x.test/blog/p' },
  ]);
  assert.deepEqual(
    crumbs.itemListElement.map((c) => [c.position, c.name]),
    [
      [1, 'Blog'],
      [2, 'Post'],
    ],
  );
  assert.equal(crumbs['@id'], 'https://x.test/blog/p#breadcrumb');
});

test('serialized JSON-LD cannot close its script tag', () => {
  const json = serializeJsonLd(graph([{ '@type': 'Thing', name: '</script><b>' }]));
  assert.equal(json.includes('</script>'), false);
  assert.equal(JSON.parse(json)['@graph'][0].name, '</script><b>');
  assert.equal(JSON.parse(json)['@context'], 'https://schema.org');
});
