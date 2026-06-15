/**
 * Split repository files into commits of max ~900 lines each.
 * Usage: node scripts/split-commits.mjs
 */
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_LINES = 900;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'agent-transcripts', 'agent-tools', 'mcps', '.cursor'].includes(entry.name)) continue;
      walk(full, files);
    } else {
      files.push(rel);
    }
  }
  return files;
}

function countLines(filePath) {
  try {
    return readFileSync(join(ROOT, filePath), 'utf8').split('\n').length;
  } catch {
    return 0;
  }
}

function isIgnored(file) {
  const ignored = [
    /^node_modules\//,
    /^\.next\//,
    /^\.env$/,
    /^\.env\./,
    /\.db$/,
    /\.tsbuildinfo$/,
    /^sentinal\/node_modules\//,
    /^sentinal\/\.next\//,
    /^sentinal\/\.env$/,
    /^sentinal\/lib\/chain\/chain\//,
    /^sentinal\/lib\/db\/db\//,
    /^sentinal\/lib\/metamask\/metamask\//,
    /^sentinal\/lib\/oneshot\/oneshot\//,
    /^sentinal\/lib\/venice\/venice\//,
    /^sentinal\/lib\/x402\/x402\//,
    /^sentinal\/next-env\.d\.ts$/,
  ];
  if (file === '.env.example') return false;
  return ignored.some((p) => p.test(file));
}

// Init git if needed
try {
  execSync('git rev-parse --git-dir', { cwd: ROOT, stdio: 'pipe' });
} catch {
  execSync('git init -b main', { cwd: ROOT });
  execSync('git remote add origin https://github.com/SamuelDharshi/Sentinal.git', { cwd: ROOT });
}

const allFiles = walk(ROOT).filter((f) => !isIgnored(f)).sort();

// Priority order: gitignore first, then docs, then sentinal app
const priority = (f) => {
  if (f === '.gitignore' || f === '.env.example') return 0;
  if (f.endsWith('.md')) return 1;
  if (f.startsWith('tests/') || f.startsWith('scripts/')) return 2;
  if (f.startsWith('sentinal/')) return 3;
  return 4;
};
allFiles.sort((a, b) => priority(a) - priority(b) || a.localeCompare(b));

const batches = [];
let current = { files: [], lines: 0, label: '' };

for (const file of allFiles) {
  const lines = countLines(file);
  if (current.lines + lines > MAX_LINES && current.files.length > 0) {
    batches.push(current);
    current = { files: [], lines: 0, label: '' };
  }
  current.files.push(file);
  current.lines += lines;
}
if (current.files.length > 0) batches.push(current);

const labels = [
  'chore: add gitignore and env template',
  'docs: add PRD and README',
  'test: add module test suite',
  'feat: integrate SENTINEL backend into sentinal app',
  'feat: add agent pipeline and API routes',
  'feat: add lib modules for chain, x402, and Venice',
  'feat: add Mission Control dashboard and setup wizard',
  'feat: add landing page and UI components',
];

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  const msg = labels[i] || `feat: add SENTINEL files (part ${i + 1})`;
  console.log(`\nCommit ${i + 1}/${batches.length}: ${msg} (${batch.lines} lines, ${batch.files.length} files)`);

  for (const f of batch.files) {
    try {
      execSync(`git add "${f.replace(/"/g, '\\"')}"`, { cwd: ROOT, stdio: 'pipe' });
    } catch {
      console.log(`  skipped (ignored): ${f}`);
    }
  }

  const staged = execSync('git diff --cached --name-only', { cwd: ROOT, encoding: 'utf8' }).trim();
  if (!staged) {
    console.log('  nothing to commit, skipping');
    continue;
  }

  const body = `${msg}\n\nFiles: ${batch.files.length}, lines: ~${batch.lines}`;
  execSync(`git commit -m "${msg.replace(/"/g, '\\"')}" -m "Files: ${batch.files.length}, lines: ~${batch.lines}"`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

console.log(`\nDone: ${batches.length} commits created.`);
