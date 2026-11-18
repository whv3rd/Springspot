// Renders the social share images (Open Graph / Twitter cards) and the logo with a
// headless browser, so they match the site's type and colours:
//   src/assets/og/default.png        site card, used by every page without its own
//   src/assets/og/blog/<slug>.png    one card per blog post (title + pillar)
//   public/logo.png                  512×512 logo for the Organization in schema
//   public/apple-touch-icon.png      180×180 home-screen icon
// Run after adding a post or changing a title:  node scripts/social-cards.mjs [--force]
// Existing post cards are kept unless --force. A post without a card falls back to the
// site card, so a missing one never breaks the build.
// Needs Playwright with Chromium (dev tooling only, not a project dependency):
//   npx -y playwright@1 install chromium   (once), then run with NODE_PATH pointing at it,
//   or simply: npx -y -p playwright@1 node scripts/social-cards.mjs
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const force = process.argv.includes('--force');
const root = new URL('..', import.meta.url).pathname;
const blogDir = join(root, 'src/content/blog');
const ogDir = join(root, 'src/assets/og');

let chromium;
try {
  // require() also finds a globally installed Playwright, which import() doesn't.
  ({ chromium } = createRequire(import.meta.url)('playwright'));
} catch {
  console.error(
    'Playwright is not installed. Run: npx -y -p playwright@1 node scripts/social-cards.mjs',
  );
  process.exit(1);
}

const PILLARS = {
  diary: 'Operator diaries',
  teardown: 'Teardowns',
  playbook: 'Playbooks',
  shift: 'The shift',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Reads a frontmatter scalar (plain, single- or double-quoted). */
function field(source, name) {
  const m = source.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
  if (!m) return undefined;
  const v = m[1].trim();
  if (v.startsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  if (v.startsWith('"')) return JSON.parse(v);
  return v;
}

const mark = (size, bg, fg) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${bg}"/><path d="M8 22h16M11 22l5-12 5 12" stroke="${fg}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const fonts =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=block">';

function card({ eyebrow, title, footer }) {
  const size = title.length > 70 ? 60 : title.length > 45 ? 70 : 82;
  return `<!doctype html><html><head><meta charset="utf-8">${fonts}<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#fbf9f4;color:#1b1814;font-family:'IBM Plex Sans',sans-serif;
    display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;position:relative;overflow:hidden}
  body::before{content:"";position:absolute;inset:0 0 auto 0;height:14px;background:#a6351a}
  .top{display:flex;align-items:center;gap:18px;font-weight:600;font-size:30px}
  .eyebrow{font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:24px;letter-spacing:.1em;text-transform:uppercase;color:#a6351a;margin-bottom:22px}
  h1{font-family:'Newsreader',serif;font-weight:600;font-size:${size}px;line-height:1.06;letter-spacing:-.01em;max-width:1000px}
  .foot{display:flex;justify-content:space-between;align-items:flex-end;font-size:26px;color:#6e665b;border-top:2px solid #e5ded0;padding-top:24px}
  .arc{position:absolute;right:-6px;top:14px;opacity:.9}
</style></head><body>
  <svg class="arc" width="250" height="200" viewBox="0 0 300 240"><path d="M10 220 C 90 220, 120 40, 290 20" stroke="#a6351a" stroke-width="2.5" stroke-dasharray="1 10" stroke-linecap="round" fill="none"/><circle cx="290" cy="20" r="9" fill="#a6351a"/></svg>
  <div class="top">${mark(52, '#1b1814', '#fbf9f4')}<span>Springspot AI</span></div>
  <div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1></div>
  <div class="foot"><span>${esc(footer)}</span><span>willvinton.com/springspot</span></div>
</body></html>`;
}

const icon = (size, pad) => `<!doctype html><html><head><style>
  *{margin:0}body{width:${size}px;height:${size}px;background:#1b1814;display:grid;place-items:center}
</style></head><body>${mark(size - pad * 2, '#1b1814', '#fbf9f4')}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

async function shoot(html, out, width, height) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: 'png' });
  console.log(`wrote ${out.replace(root, '')}`);
}

await mkdir(join(ogDir, 'blog'), { recursive: true });
await shoot(
  card({
    eyebrow: 'Ecommerce, run on connected systems',
    title: 'Run leaner, launch more and scale without adding headcount.',
    footer: 'Blog · The Score · The Path',
  }),
  join(ogDir, 'default.png'),
  1200,
  630,
);
await shoot(icon(512, 64), join(root, 'public/logo.png'), 512, 512);
await shoot(icon(180, 22), join(root, 'public/apple-touch-icon.png'), 180, 180);

for (const file of (await readdir(blogDir)).filter((f) => /\.mdx?$/.test(f)).sort()) {
  const slug = file.replace(/\.mdx?$/, '');
  const out = join(ogDir, 'blog', `${slug}.png`);
  if (existsSync(out) && !force) continue;
  const source = await readFile(join(blogDir, file), 'utf8');
  const title = field(source, 'title');
  const pillar = PILLARS[field(source, 'pillar')] ?? 'Blog';
  await shoot(card({ eyebrow: pillar, title, footer: 'By Will Vinton' }), out, 1200, 630);
}

await browser.close();
