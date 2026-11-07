// Copies the finished static site into ./public (the folder Vercel/Netlify serve).
// Run with: npm run build   (compiles the CSS first, then runs this script)
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'public');
if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let pages = 0;
for (const f of readdirSync(root)) {
  if (f.endsWith('.html')) { cpSync(join(root, f), join(out, f)); pages++; }
}
cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });
for (const extra of ['robots.txt', 'sitemap.xml']) if (existsSync(join(root, extra))) cpSync(join(root, extra), join(out, extra));
console.log(`public/ ready: ${pages} pages + assets`);
