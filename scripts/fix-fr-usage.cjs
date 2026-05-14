#!/usr/bin/env node
/**
 * Injects `const fr = useT();` into all non-exported function/component bodies
 * that reference `fr` but don't already have the hook call.
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

function processFile(filePath) {
  const abs = path.join(ROOT, filePath);
  let src = fs.readFileSync(abs, 'utf8');
  const lines = src.split('\n');
  const result = [];
  let i = 0;
  let changed = false;

  while (i < lines.length) {
    const line = lines[i];

    // Match any function definition (exported or not, named or arrow assigned)
    // Patterns:
    //   function Foo(   or   function Foo (
    //   export function Foo(
    //   export default function Foo(
    //   const Foo = (   or   const Foo = ({
    // We look for the opening brace of the function body
    const isFunctionDef =
      /^(?:export\s+(?:default\s+)?)?function\s+\w/.test(line) ||
      /^(?:export\s+)?const\s+\w+\s*=\s*(?:async\s*)?\(/.test(line);

    if (isFunctionDef) {
      // Collect the function signature (may span multiple lines) until we find the opening {
      let sigLines = [line];
      let j = i;
      let braceDepth = 0;
      let bodyStartLine = -1;

      // Walk forward to find the '{' that opens the function body
      // We need to track parens to skip param lists
      let parenDepth = 0;
      let foundBody = false;

      for (let k = i; k < Math.min(i + 20, lines.length); k++) {
        const l = lines[k];
        for (let ci = 0; ci < l.length; ci++) {
          const ch = l[ci];
          if (ch === '(') parenDepth++;
          else if (ch === ')') {
            parenDepth--;
          } else if (ch === '{' && parenDepth === 0) {
            bodyStartLine = k;
            foundBody = true;
            break;
          }
        }
        if (foundBody) break;
      }

      if (!foundBody || bodyStartLine < 0) {
        result.push(line);
        i++;
        continue;
      }

      // Emit all lines up to and including bodyStartLine
      for (let k = i; k <= bodyStartLine; k++) {
        result.push(lines[k]);
      }

      // The next line is the first line of the function body
      // Check if the next few lines already have `const fr = useT()`
      const nextLineIdx = bodyStartLine + 1;
      const nextFewLines = lines.slice(nextLineIdx, nextLineIdx + 10).join('\n');

      if (!nextFewLines.includes('const fr = useT()')) {
        // Check if this function actually uses `fr` (look ahead)
        // Find closing brace of this function
        let depth = 1;
        let usesFr = false;
        for (let k = nextLineIdx; k < lines.length && depth > 0; k++) {
          const l = lines[k];
          for (const ch of l) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
          }
          if (depth > 0 && /\bfr\./.test(l)) {
            usesFr = true;
          }
        }

        if (usesFr) {
          // Determine indentation from next line or from opening brace line
          const bodyLine = lines[nextLineIdx] || '';
          const indentMatch = bodyLine.match(/^(\s*)/);
          const indent = indentMatch ? indentMatch[1] : '  ';
          result.push(`${indent}const fr = useT();`);
          changed = true;
        }
      }

      i = bodyStartLine + 1;
      continue;
    }

    result.push(line);
    i++;
  }

  if (changed) {
    fs.writeFileSync(abs, result.join('\n'), 'utf8');
    console.log(`  Fixed: ${filePath}`);
  }
}

console.log('Injecting const fr = useT() into internal functions...');
for (const f of TARGET_FILES) {
  try {
    processFile(f);
  } catch (e) {
    console.error(`  Error processing ${f}: ${e.message}`);
  }
}
console.log('Done.');
