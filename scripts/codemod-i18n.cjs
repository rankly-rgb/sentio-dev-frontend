#!/usr/bin/env node
// Codemod: replace static `fr` import with reactive `useT()` hook
// Usage: node scripts/codemod-i18n.js <files...>

const fs = require('fs');

const IMPORT_OLD = "import { fr } from '@/i18n/fr';";
const IMPORT_NEW = "import { useT } from '@/lib/i18n/useT';";
const HOOK_CALL  = '  const fr = useT();';

// Patterns that mark the start of a component or hook function body
const FUNC_OPEN = /^(export default function|export function|function use)\b/;

function transform(src) {
  if (!src.includes(IMPORT_OLD)) return null;

  const lines = src.split('\n');
  let importReplaced = false;
  let hookInserted  = false;
  // Track whether we're inside the first qualifying function
  let inFunc = false;
  let braceDepth = 0;

  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Replace the import line
    if (!importReplaced && line.trim() === IMPORT_OLD) {
      out.push(IMPORT_NEW);
      importReplaced = true;
      continue;
    }

    // 2. Detect entry into the first qualifying function
    if (!hookInserted && !inFunc && FUNC_OPEN.test(line.trim())) {
      inFunc = true;
    }

    out.push(line);

    // 3. Once inside the first function, find the opening `{` that starts its body.
    //    We count braces to handle multi-line signatures correctly.
    if (inFunc && !hookInserted) {
      const opens  = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;
      braceDepth += opens - closes;

      // braceDepth === 1 means we just opened the outermost function body
      if (braceDepth === 1) {
        out.push(HOOK_CALL);
        hookInserted = true;
        inFunc = false;
      }
    }
  }

  if (!importReplaced || !hookInserted) return null; // nothing to do / couldn't insert safely
  return out.join('\n');
}

const files = process.argv.slice(2);
let changed = 0;
let skipped = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const result = transform(src);
  if (result === null) {
    skipped++;
    continue;
  }
  fs.writeFileSync(file, result, 'utf8');
  changed++;
  console.log(`  ✓ ${file}`);
}

console.log(`\nDone: ${changed} transformed, ${skipped} skipped.`);
