import { existsSync, rmSync } from 'node:fs';

const obsolete = [
  'assets',
  'scripts/sync-static-assets.mjs',
];

const removed = [];
for (const path of obsolete) {
  if (!existsSync(path)) continue;
  rmSync(path, { recursive: true, force: true });
  if (existsSync(path)) throw new Error(`[cleanup] could not remove legacy path: ${path}`);
  removed.push(path);
}

console.log(removed.length
  ? `[cleanup] removed legacy pre-Vite paths: ${removed.join(', ')}`
  : '[cleanup] legacy pre-Vite runtime already absent');
