import { cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const publicRoot = resolve(root, 'public');
const publicAssets = resolve(publicRoot, 'assets');

await mkdir(publicAssets, { recursive: true });

for (const dir of ['images', 'audio']) {
  const source = resolve(root, 'assets', dir);
  const target = resolve(publicAssets, dir);
  if (existsSync(source)) {
    await cp(source, target, { recursive: true, force: true });
  }
}

await writeFile(resolve(publicRoot, '.nojekyll'), '', 'utf8');
