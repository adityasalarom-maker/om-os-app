#!/usr/bin/env node
/** Audit React JSX data-ag-id attributes without counting prose or selector strings. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(process.cwd(), 'src');
if (!fs.existsSync(root)) {
  console.error('Run this command from om_os_app: node scripts/audit_ui_ids.mjs');
  process.exit(2);
}

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.tsx$/i.test(entry.name) ? [file] : [];
  });
}

const literals = new Map();
const dynamic = new Map();
const unsupported = [];
for (const file of sourceFiles(root)) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'data-ag-id' && node.initializer) {
      const loc = `${path.relative(process.cwd(), file).replaceAll('\\', '/')}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
      const init = node.initializer;
      if (ts.isStringLiteral(init)) {
        const entries = literals.get(init.text) ?? [];
        entries.push(loc);
        literals.set(init.text, entries);
      } else if (ts.isJsxExpression(init) && init.expression) {
        const expr = init.expression;
        const isTemplate = ts.isTemplateExpression(expr) || ts.isNoSubstitutionTemplateLiteral(expr);
        const key = isTemplate ? expr.getText(sf) : `expression: ${expr.getText(sf)}`;
        const entries = dynamic.get(key) ?? [];
        entries.push(loc);
        dynamic.set(key, entries);
        if (!isTemplate) unsupported.push(`${loc}: ${key}`);
      } else {
        unsupported.push(`${loc}: unsupported initializer ${init.getText(sf)}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const duplicateLiterals = [...literals.entries()].filter(([, locations]) => locations.length > 1);
const duplicateDynamic = [...dynamic.entries()].filter(([, locations]) => locations.length > 1);
console.log(`JSX data-ag-id audit: ${literals.size} static values, ${dynamic.size} dynamic expressions.`);
for (const [id, locations] of duplicateLiterals) console.error(`Duplicate static ID ${JSON.stringify(id)}: ${locations.join(', ')}`);
for (const [expr, locations] of duplicateDynamic) console.error(`Duplicate dynamic template ${expr}: ${locations.join(', ')}`);
for (const item of unsupported) console.warn(`Review dynamic ID expression: ${item}`);
if (duplicateLiterals.length || duplicateDynamic.length) process.exitCode = 1;
else console.log('No duplicate static values or repeated dynamic templates found. Runtime uniqueness of interpolated data still needs data-level validation.');
