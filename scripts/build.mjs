import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, writeFile, copyFile } from 'node:fs/promises';

await build({ entryPoints: ['src/main.ts'], bundle: true, outfile: 'dist/bundle.js' });
await copyFile('styles.css', 'dist/styles.css');

// A changed asset gets a fresh URL, avoiding stale phone/CDN caches after deploys.
let html = await readFile('index.html', 'utf8');
for (const asset of ['styles.css', 'bundle.js']) {
  const content = await readFile(`dist/${asset}`);
  const version = createHash('sha256').update(content).digest('hex').slice(0, 12);
  html = html.replace(`"${asset}"`, `"${asset}?v=${version}"`);
}
await writeFile('dist/index.html', html);
