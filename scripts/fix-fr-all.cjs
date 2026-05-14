#!/usr/bin/env node
/**
 * Two-pass fix for fr-reference errors:
 * Pass 1: Inject `const fr = useT();` into internal (non-exported) function/component bodies
 *          that use `fr` but don't have the hook call.
 * Pass 2: Move module-level `const X = { ... fr. ... }` declarations inside the
 *          exported component/function, immediately after `const fr = useT();`.
 *
 * Run: node scripts/fix-fr-all.cjs
 */
const fs = require('fs');
const path = require('path');

const TARGET_FILES = [
  'src/components/account-detail/AccountFinancials.tsx',
  'src/components/account-detail/AccountInsights.tsx',
  'src/components/account-detail/AccountScoreCard.tsx',
  'src/components/accounts/AccountNotesSection.tsx',
  'src/components/dashboard/BenchmarkSection.tsx',
  'src/components/dashboard/mrr-chart.tsx',
  'src/components/destinations/DestinationForm.tsx',
  'src/components/destinations/DestinationLogs.tsx',
  'src/components/insights/InsightCard.tsx',
  'src/components/insights/InsightFilters.tsx',
  'src/components/ops/SyncsExtendedTab.tsx',
  'src/components/ops/SystemStatusTab.tsx',
  'src/components/playbooks/ActionEditor.tsx',
  'src/components/playbooks/ExecutionTimeline.tsx',
  'src/components/playbooks/PlaybookPendingApprovals.tsx',
  'src/components/settings/WebhookConfigSection.tsx',
  'src/components/today/TodayPriorityGroup.tsx',
  'src/components/today/TodaySummaryBar.tsx',
  'src/pages/AccountDetail.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Integrations.tsx',
  'src/pages/Playbooks.tsx',
  'src/pages/Syncs.tsx',
  'src/pages/onboarding/Done.tsx',
  'src/pages/onboarding/SyncWait.tsx',
];

const ROOT = path.join(__dirname, '..');

// Returns index of the closing brace matching the opening brace at lines[openLineIdx],
// where the opening brace starts after `charOffset` on that line.
// Returns -1 if not found.
function findClosingBrace(lines, openLineIdx, charOffset) {
  let depth = 0;
  for (let i = openLineIdx; i < lines.length; i++) {
    const line = lines[i];
    const start = i === openLineIdx ? charOffset : 0;
    for (let j = start; j < line.length; j++) {
      if (line[j] === '{') depth++;
      else if (line[j] === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

// Find the first { in a string starting at a given offset, returns char index or -1
function findOpenBrace(str, offset = 0) {
  for (let i = offset; i < str.length; i++) {
    if (str[i] === '{') return i;
  }
  return -1;
}

function processFile(filePath) {
  const abs = path.join(ROOT, filePath);
  let src = fs.readFileSync(abs, 'utf8');
  let lines = src.split('\n');
  let changed = false;

  // -------------------------------------------------------------------------
  // Pass 1: Inject `const fr = useT();` into internal function bodies that
  //         use `fr` but don't already have it.
  // -------------------------------------------------------------------------

  // Patterns that open a function body (must be at line start, possibly with leading spaces):
  //   function Foo(...)   {
  //   export function Foo(...)   {
  //   export default function Foo(...)  {
  //   const Foo = (...) => {
  // We look for the function keyword or const arrow pattern at line-start,
  // skip exported ones (they were already handled by previous codemod),
  // then inject `const fr = useT()` if `fr.` is used inside the body and not already present.

  let i = 0;
  const resultLines = [];

  while (i < lines.length) {
    const line = lines[i];

    // Is this line the start of an INTERNAL (non-exported) function/component?
    // We handle: `function Foo(` and `const Foo = (` — not starting with export/export default
    const isInternalFunctionDef =
      /^function\s+\w/.test(line.trimStart()) &&
      !/^export/.test(line.trimStart());

    if (isInternalFunctionDef) {
      // Find the opening brace of the function body
      let bodyOpenLineIdx = -1;
      let bodyOpenCharIdx = -1;
      let parenDepth = 0;
      let foundParen = false;

      outer:
      for (let k = i; k < Math.min(i + 20, lines.length); k++) {
        const l = lines[k];
        for (let ci = 0; ci < l.length; ci++) {
          const ch = l[ci];
          if (ch === '(') { parenDepth++; foundParen = true; }
          else if (ch === ')') { parenDepth--; }
          else if (ch === '{' && foundParen && parenDepth === 0) {
            bodyOpenLineIdx = k;
            bodyOpenCharIdx = ci;
            break outer;
          }
        }
      }

      if (bodyOpenLineIdx >= 0) {
        // Find closing brace
        const bodyCloseLineIdx = findClosingBrace(lines, bodyOpenLineIdx, bodyOpenCharIdx);

        if (bodyCloseLineIdx > bodyOpenLineIdx) {
          // Extract body content
          const bodyLines = lines.slice(bodyOpenLineIdx + 1, bodyCloseLineIdx);
          const bodyText = bodyLines.join('\n');

          // Check if uses `fr.` and doesn't already have the hook
          if (/\bfr\./.test(bodyText) && !bodyText.includes('const fr = useT()')) {
            // Determine indent from first non-empty body line
            const firstBodyLine = bodyLines.find(l => l.trim().length > 0) || '  ';
            const indent = firstBodyLine.match(/^(\s*)/)[1] || '  ';

            // Emit lines up to and including the opening brace line
            for (let k = i; k <= bodyOpenLineIdx; k++) {
              resultLines.push(lines[k]);
            }
            resultLines.push(`${indent}const fr = useT();`);
            i = bodyOpenLineIdx + 1;
            changed = true;
            continue;
          }
        }
      }
    }

    resultLines.push(line);
    i++;
  }

  if (changed) {
    lines = resultLines;
    src = lines.join('\n');
  }

  // -------------------------------------------------------------------------
  // Pass 2: Move module-level `const X = { ... }` or `const X = [...]` blocks
  //         that contain `fr.` references into the exported component body
  //         (immediately after `const fr = useT();`).
  // -------------------------------------------------------------------------

  // Find all module-level const declarations that reference `fr.`
  // Strategy: scan for lines matching `^const \w+ =` that are at module level
  // (i.e., not inside any function/class body).
  // We detect module level by tracking brace depth from the top.

  lines = src.split('\n');
  const moduleLevelConsts = []; // { startLine, endLine, text }

  let braceDepth = 0;
  let inConst = false;
  let constStart = -1;
  let constBraceDepth = -1;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];

    if (braceDepth === 0 && /^const\s+\w+/.test(line.trimStart())) {
      // This might be a module-level const
      // Check if it contains `fr.` directly or will in subsequent lines
      // We need to find the full extent of this const declaration
      let hasOpenBrace = false;
      let hasOpenBracket = false;
      const firstBraceIdx = line.indexOf('{');
      const firstBracketIdx = line.indexOf('[');

      if (firstBraceIdx >= 0 || firstBracketIdx >= 0) {
        const openDelim = (firstBraceIdx >= 0 && (firstBracketIdx < 0 || firstBraceIdx < firstBracketIdx)) ? '{' : '[';
        const closeDelim = openDelim === '{' ? '}' : ']';
        const openIdx = openDelim === '{' ? firstBraceIdx : firstBracketIdx;

        // Find the end of this const declaration
        let depth = 0;
        let endLine = -1;
        for (let k = li; k < lines.length; k++) {
          const l = lines[k];
          const startChar = k === li ? openIdx : 0;
          for (let ci = startChar; ci < l.length; ci++) {
            if (l[ci] === openDelim) depth++;
            else if (l[ci] === closeDelim) {
              depth--;
              if (depth === 0) {
                // Check if the line ends with `;` after the close
                endLine = k;
                break;
              }
            }
          }
          if (endLine >= 0) break;
        }

        if (endLine >= 0) {
          const constText = lines.slice(li, endLine + 1).join('\n');
          if (/\bfr\./.test(constText)) {
            moduleLevelConsts.push({ startLine: li, endLine, text: constText });
          }
          // Skip past this const
          li = endLine;
        }
      } else if (/;\s*$/.test(line)) {
        // Single-line const
        if (/\bfr\./.test(line)) {
          moduleLevelConsts.push({ startLine: li, endLine: li, text: line });
        }
      }
    } else {
      // Track brace depth for non-const lines
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
      }
    }
  }

  if (moduleLevelConsts.length > 0) {
    // Remove those const declarations from their current positions
    // and insert them after `const fr = useT();` in the exported component

    // First, mark which lines to remove
    const linesToRemove = new Set();
    for (const { startLine, endLine } of moduleLevelConsts) {
      for (let li = startLine; li <= endLine; li++) {
        linesToRemove.add(li);
      }
      // Also remove blank lines immediately before the const
      // (to clean up whitespace)
    }

    // Find where to insert: look for `const fr = useT();` line
    let insertAfterLine = -1;
    for (let li = 0; li < lines.length; li++) {
      if (lines[li].includes('const fr = useT()')) {
        insertAfterLine = li;
        break;
      }
    }

    if (insertAfterLine >= 0) {
      const indent = lines[insertAfterLine].match(/^(\s*)/)[1] || '  ';

      // Build the text to insert
      const insertLines = [];
      for (const { text } of moduleLevelConsts) {
        // Re-indent the text
        const reindented = text.split('\n').map((l, idx) => {
          if (idx === 0) return `${indent}${l.trim()}`;
          // Preserve relative indentation for subsequent lines
          return l.length === 0 ? '' : `${indent}${l}`;
        }).join('\n');
        insertLines.push(reindented);
      }

      // Build the new file
      const newLines = [];
      for (let li = 0; li < lines.length; li++) {
        if (linesToRemove.has(li)) continue;
        newLines.push(lines[li]);
        if (li === insertAfterLine) {
          for (const block of insertLines) {
            newLines.push(block);
          }
        }
      }

      src = newLines.join('\n');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(abs, src, 'utf8');
    console.log(`  Fixed: ${filePath}`);
  } else {
    console.log(`  No changes: ${filePath}`);
  }
}

console.log('Fixing fr references in all affected files...\n');
for (const f of TARGET_FILES) {
  try {
    processFile(f);
  } catch (e) {
    console.error(`  ERROR in ${f}: ${e.message}`);
    console.error(e.stack);
  }
}
console.log('\nDone.');
