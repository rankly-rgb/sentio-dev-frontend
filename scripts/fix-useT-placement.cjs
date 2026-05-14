#!/usr/bin/env node
// Fix `const fr = useT();` that was injected inside destructured function params.
// Pattern to fix:
//   export default function X({
//     const fr = useT();   <-- WRONG: inside destructured params
//     param1,
//   }: Type) {
// Should be:
//   export default function X({
//     param1,
//   }: Type) {
//     const fr = useT();  <-- RIGHT: inside function body

const fs = require('fs');

const HOOK = '  const fr = useT();';

function isDestructuredParamLine(line) {
  // Detect lines that look like destructured param names or trailing type
  // e.g. "  destinations," or "  onEdit," or "}: Props) {"
  return /^\s+\w+[,?]?\s*$/.test(line) || /^\s*\}:\s*\w/.test(line);
}

function transform(src) {
  const lines = src.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== HOOK) continue;

    const prev = i > 0 ? lines[i - 1].trim() : '';
    const next = i < lines.length - 1 ? lines[i + 1] : '';

    // Misplaced: previous line ends with `({` (function param destructuring start)
    // or next line looks like a param name (not a statement)
    const prevEndsWithDestructure = prev.endsWith('({') || prev === '{';
    const nextLooksLikeParam = isDestructuredParamLine(next);

    if (prevEndsWithDestructure || nextLooksLikeParam) {
      // Remove the hook line from current position
      lines.splice(i, 1);
      i--; // adjust index

      // Now find the closing `): SomeType) {` or similar line
      // and insert after the `{` that opens the function body
      let depth = 1; // we removed from after `({`, so depth is 1 already
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j];
        const opens = (l.match(/\{/g) || []).length;
        const closes = (l.match(/\}/g) || []).length;
        depth += opens - closes;

        // depth === 0 means we closed the opening `{` from the params
        // then depth goes to 1 when function body opens
        // Actually: we're looking for the line with `): ...Type) {` pattern
        // which has a `{` that OPENS the function body
        if (depth <= 0 && opens > 0) {
          // This line contains the closing `}` of params AND opens function body
          lines.splice(j + 1, 0, HOOK);
          changed = true;
          break;
        }

        // Simpler: look for `) {` pattern after params close
        if (/\)\s*\{/.test(l) && closes > opens) {
          lines.splice(j + 1, 0, HOOK);
          changed = true;
          break;
        }
      }
      break;
    }
  }

  return changed ? lines.join('\n') : null;
}

const files = process.argv.slice(2);
let fixed = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let result = src;
  let anyChange = false;

  // Apply transform repeatedly until no more changes (handles files with multiple functions)
  for (let pass = 0; pass < 5; pass++) {
    const r = transform(result);
    if (r === null) break;
    result = r;
    anyChange = true;
  }

  if (anyChange) {
    fs.writeFileSync(file, result, 'utf8');
    fixed++;
    console.log(`  fixed: ${file}`);
  }
}

console.log(`\nFixed ${fixed} files.`);
