#!/usr/bin/env node
/**
 * Batch-converts every .ts/.tsx file under given root dirs to .js/.jsx,
 * using convert.js's AST transformer, then deletes the original .ts(x) files.
 *
 * Skips .d.ts files (pure type declarations -- deleted, not converted).
 * Usage: node run-batch.js <rootDir> [rootDir2 ...]
 */
const fs = require('fs');
const path = require('path');
const { convertFile } = require('./convert.js');

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next' || entry.name === '.turbo' || entry.name === 'build' || entry.name === 'coverage') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  const roots = process.argv.slice(2);
  if (roots.length === 0) {
    console.error('Usage: node run-batch.js <rootDir> [rootDir2 ...]');
    process.exit(1);
  }

  const allFiles = [];
  for (const root of roots) {
    walk(root, allFiles);
  }

  const tsFiles = allFiles.filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.d.ts'));
  const dtsFiles = allFiles.filter((f) => f.endsWith('.d.ts'));

  let converted = 0;
  let failed = [];

  for (const f of tsFiles) {
    try {
      const out = convertFile(f);
      const newPath = f.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js');
      fs.writeFileSync(newPath, out);
      fs.unlinkSync(f);
      converted++;
    } catch (e) {
      failed.push({ file: f, error: e.message });
    }
  }

  for (const f of dtsFiles) {
    // Pure ambient type declaration files have no JS runtime equivalent; drop them.
    fs.unlinkSync(f);
  }

  console.log(`Converted: ${converted}/${tsFiles.length}`);
  console.log(`Deleted .d.ts (no JS equivalent): ${dtsFiles.length}`);
  if (failed.length) {
    console.log(`FAILED: ${failed.length}`);
    failed.forEach((f) => console.log(`  ${f.file}: ${f.error}`));
    process.exitCode = 1;
  }
}

main();
