/** Commit only remaining untracked files in ~900-line batches */
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_LINES = 900;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      walk(full, files);
    } else {
      files.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return files;
}

function countLines(f) {
  try { return readFileSync(join(ROOT, f), 'utf8').split('\n').length; } catch { return 0; }
}

const untracked = execSync('git ls-files --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

const batches = [];
let cur = { files: [], lines: 0 };

for (const f of untracked.sort()) {
  const lines = countLines(f);
  if (cur.lines + lines > MAX_LINES && cur.files.length) {
    batches.push(cur);
    cur = { files: [], lines: 0 };
  }
  cur.files.push(f);
  cur.lines += lines;
}
if (cur.files.length) batches.push(cur);

let n = 0;
for (const batch of batches) {
  n++;
  const msg = `feat: add remaining SENTINEL files (part ${n})`;
  for (const f of batch.files) {
    try { execSync(`git add "${f}"`, { cwd: ROOT, stdio: 'pipe' }); } catch {}
  }
  const staged = execSync('git diff --cached --name-only', { cwd: ROOT, encoding: 'utf8' }).trim();
  if (!staged) continue;
  console.log(`${msg} — ${batch.lines} lines, ${batch.files.length} files`);
  execSync(`git commit -m "${msg}" -m "Lines: ~${batch.lines}, files: ${batch.files.length}"`, { cwd: ROOT, stdio: 'inherit' });
}
console.log(`Finished ${n} commits.`);
