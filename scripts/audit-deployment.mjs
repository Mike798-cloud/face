import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

function fail(message) {
  throw new Error(`[deploy-audit] ${message}`);
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { fail(`Cannot parse ${path}: ${String(error)}`); }
}

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const workflowPath = '.github/workflows/deploy.yml';
const vitePath = 'vite.config.ts';
const gitignorePath = '.gitignore';

if (lock.lockfileVersion !== 3) fail(`package-lock.json must use lockfileVersion 3, got ${String(lock.lockfileVersion)}`);
if (!lock.packages || typeof lock.packages !== 'object') fail('package-lock.json has no packages map');

const entries = Object.keys(lock.packages);
if (entries.length < 20) {
  fail(`package-lock.json is incomplete (${entries.length} package entries). Regenerate it with npm install before pushing.`);
}

const root = lock.packages[''];
if (!root) fail('package-lock.json is missing the root package entry');
if (root.name !== pkg.name || root.version !== pkg.version) {
  fail(`package-lock root metadata (${String(root.name)}@${String(root.version)}) does not match package.json (${String(pkg.name)}@${String(pkg.version)})`);
}

for (const section of ['dependencies', 'devDependencies']) {
  const expected = pkg[section] ?? {};
  const lockedRoot = root[section] ?? {};
  for (const [name, version] of Object.entries(expected)) {
    if (lockedRoot[name] !== version) fail(`${section}.${name} is ${String(version)} in package.json but ${String(lockedRoot[name])} in package-lock.json`);
    const entry = lock.packages[`node_modules/${name}`];
    if (!entry) fail(`package-lock.json is missing node_modules/${name}`);
    if (entry.version !== version) fail(`node_modules/${name} is locked to ${String(entry.version)}, expected ${String(version)}`);
    if (!entry.resolved || !entry.integrity) fail(`node_modules/${name} is missing resolved/integrity metadata`);
  }
}

// These are required by Vite 6 on the Linux GitHub-hosted runner. Their absence is a
// common symptom of a hand-trimmed Windows lockfile and causes npm ci/build failures.
for (const name of [
  'node_modules/esbuild',
  'node_modules/rollup',
  'node_modules/@esbuild/linux-x64',
  'node_modules/@rollup/rollup-linux-x64-gnu',
]) {
  const entry = lock.packages[name];
  if (!entry?.resolved || !entry?.integrity) fail(`package-lock.json is missing CI build dependency ${name}`);
}

if (!existsSync(workflowPath)) fail(`${workflowPath} is missing`);
const workflow = readFileSync(workflowPath, 'utf8');
const workflowGuards = [
  ['actions: read', /\bactions:\s*read\b/],
  ['checkout v7', /actions\/checkout@v7\b/],
  ['setup-node v7', /actions\/setup-node@v7\b/],
  ['legacy cleanup', /run:\s*node scripts\/cleanup-legacy\.mjs\b/],
  ['npm ci', /run:\s*npm ci\b/],
  ['typecheck', /run:\s*npm run typecheck\b/],
  ['logic regression', /run:\s*npm run test:logic\b/],
  ['production build', /run:\s*npm run build\b/],
  ['dist audit', /run:\s*npm run audit:dist\b/],
  ['configure-pages v6', /actions\/configure-pages@v6\b/],
  ['upload-pages-artifact v5', /actions\/upload-pages-artifact@v5\b/],
  ['deploy-pages v5', /actions\/deploy-pages@v5\b/],
  ['dist artifact', /path:\s*\.\/dist\b/],
];
for (const [label, pattern] of workflowGuards) if (!pattern.test(workflow)) fail(`deploy.yml is missing ${label}`);

const cleanupStep = workflow.indexOf('run: node scripts/cleanup-legacy.mjs');
const manifestAuditStep = workflow.indexOf('run: node scripts/audit-deployment.mjs');
const installStep = workflow.indexOf('run: npm ci');
if (cleanupStep < 0 || manifestAuditStep <= cleanupStep || installStep <= manifestAuditStep) {
  fail('deploy.yml must clean the legacy runtime before manifest audit, then run npm ci');
}

const testScript = String(pkg.scripts?.['test:logic'] ?? '');
const testRefs = [...testScript.matchAll(/tests\/([A-Za-z0-9._-]+\.test\.ts)/g)].map((m) => `tests/${m[1]}`);
if (!testRefs.length) fail('package.json test:logic does not reference any regression tests');
for (const file of testRefs) if (!existsSync(file)) fail(`test:logic references missing file ${file}`);

const vite = readFileSync(vitePath, 'utf8');
if (!/base:\s*['"]\/face\/['"]/.test(vite)) fail('vite.config.ts base must be /face/ for Mike798-cloud/face GitHub Pages');


if (!existsSync('public/.nojekyll')) fail('public/.nojekyll is missing');
for (const legacy of ['assets', 'scripts/sync-static-assets.mjs']) {
  if (existsSync(legacy)) fail(`legacy runtime path must be deleted before deployment: ${legacy}`);
}
if (String(pkg.scripts?.['audit:dist'] ?? '') !== 'node scripts/audit-dist.mjs') fail('package.json audit:dist script is missing or unexpected');

const gitignore = readFileSync(gitignorePath, 'utf8');
for (const ignored of ['node_modules/', 'dist/']) if (!gitignore.split(/\r?\n/).includes(ignored)) fail(`.gitignore must contain ${ignored}`);

if (existsSync('.git')) {
  try {
    const tracked = execFileSync('git', ['ls-files', 'node_modules', 'dist'], { encoding: 'utf8' }).trim();
    if (tracked) fail(`generated files are tracked by Git:\n${tracked}`);
  } catch (error) {
    if (String(error).includes('[deploy-audit]')) throw error;
    fail(`could not inspect tracked generated files: ${String(error)}`);
  }
}

console.log(`deploy-audit: lockfile complete (${entries.length} package entries), Linux Vite build dependencies locked, ${testRefs.length} regression tests present, Pages workflow/base/permissions validated.`);
