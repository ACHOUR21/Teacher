const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.next', '.turbo', 'build', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const roots = process.argv.slice(2);
const files = [];
roots.forEach((r) => walk(r, files));

let errors = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.ESNext, false, f.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.JS);
  // @ts-ignore — parseDiagnostics is internal but reliable for syntax errors
  const diags = sf.parseDiagnostics || [];
  if (diags.length > 0) {
    errors++;
    console.log(`SYNTAX ERRORS in ${f}:`);
    diags.forEach((d) => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      const { line } = sf.getLineAndCharacterOfPosition(d.start);
      console.log(`  line ${line + 1}: ${msg}`);
    });
  }
}
console.log(`\nChecked ${files.length} files, ${errors} with syntax errors.`);
process.exit(errors > 0 ? 1 : 0);
