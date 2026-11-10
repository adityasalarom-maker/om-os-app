import fs from 'node:fs';
import path from 'node:path';

const componentsDir = 'C:/Users/adity/Ag Folder/om_os_app/src/components';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFiles(componentsDir);
console.log(`Auditing ${files.length} component files...\n`);

const results = [];

for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  const relPath = path.relative('C:/Users/adity/Ag Folder/om_os_app/src', f);

  // Check for zinc usage
  const zincClasses = code.match(/\b(bg|text|border|ring)-zinc-\d+\b/g) || [];
  // Check for slate usage
  const slateClasses = code.match(/\b(bg|text|border|ring)-slate-\d+\b/g) || [];
  // Check for hardcoded hex backgrounds
  const hexBgs = code.match(/bg-\[#([a-fA-F0-9]{3,8})\]/g) || [];
  // Check for hardcoded hex texts
  const hexTexts = code.match(/text-\[#([a-fA-F0-9]{3,8})\]/g) || [];
  // Check for hardcoded hex borders
  const hexBorders = code.match(/border-\[#([a-fA-F0-9]{3,8})\]/g) || [];
  // Hardcoded text-white without dark: or light: qualifiers
  const textWhite = code.match(/(?<!dark:|hover:|focus:)text-white\b/g) || [];
  // Hardcoded text-black
  const textBlack = code.match(/\btext-black\b/g) || [];
  // Hardcoded bg-white
  const bgWhite = code.match(/(?<!dark:|hover:)bg-white\b/g) || [];
  // Font usages
  const fontMonos = code.match(/\bfont-mono\b/g) || [];
  const fontSerifs = code.match(/\bfont-serif\b/g) || [];
  const customFonts = code.match(/font-\[[^\]]+\]/g) || [];

  // Inline styles with raw colors (not var(--...))
  const inlineStylesRaw = [];
  const styleMatches = code.matchAll(/style=\{\{([^}]+)\}\}/g);
  for (const match of styleMatches) {
    const styleBody = match[1];
    if (/(backgroundColor|color|borderColor):\s*['"`](?!var\()([^'"`]+)['"`]/.test(styleBody)) {
      inlineStylesRaw.push(match[0].slice(0, 80));
    }
  }

  results.push({
    file: relPath,
    zincCount: zincClasses.length,
    slateCount: slateClasses.length,
    hexBgs: Array.from(new Set(hexBgs)),
    hexTexts: Array.from(new Set(hexTexts)),
    hexBorders: Array.from(new Set(hexBorders)),
    textWhiteCount: textWhite.length,
    textBlackCount: textBlack.length,
    bgWhiteCount: bgWhite.length,
    fontMonos: fontMonos.length,
    fontSerifs: fontSerifs.length,
    customFonts: customFonts.length,
    inlineStylesRawCount: inlineStylesRaw.length,
  });
}

// Summary
console.log('| Module / File | Zinc | Slate | Hex Bgs | Hex Texts | Hex Borders | White Text | Raw Inline Colors |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of results) {
  const totalIssues = r.zincCount + r.slateCount + r.hexBgs.length + r.inlineStylesRawCount;
  if (totalIssues > 0 || r.textWhiteCount > 5) {
    console.log(`| ${r.file} | ${r.zincCount} | ${r.slateCount} | ${r.hexBgs.length} | ${r.hexTexts.length} | ${r.hexBorders.length} | ${r.textWhiteCount} | ${r.inlineStylesRawCount} |`);
  }
}
