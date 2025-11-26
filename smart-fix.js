#!/usr/bin/env node
/**
 * Smart ESLint Fixer - Only removes truly unused imports
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Get ESLint output
const eslintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8' });

// Parse errors
const errors = {};
let currentFile = null;

eslintOutput.split('\n').forEach(line => {
  if (line.startsWith('./')) {
    currentFile = line.trim();
    errors[currentFile] = [];
  } else if (currentFile && /^\s*\d+:\d+\s+Error:/.test(line)) {
    const match = line.match(/Error: '([^']+)' is (?:defined but never used|assigned a value but never used)/);
    if (match) {
      errors[currentFile].push(match[1]);
    }
  }
});

console.log('🔧 Fixing unused imports...\n');

// Process each file
Object.entries(errors).forEach(([file, unused]) => {
  if (unused.length === 0 || !fs.existsSync(file)) return;
  
  console.log(`📝 ${file}: removing ${unused.length} unused items`);
  
  let content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let keep = true;
    
    // Skip lines that import ONLY unused items
    if (line.includes('import') && line.includes('{')) {
      const importMatch = line.match(/import\s+\{([^}]+)\}\s+from/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(s => s.trim());
        const keptImports = imports.filter(imp => !unused.includes(imp));
        
        if (keptImports.length === 0) {
          // All imports are unused, skip line
          keep = false;
        } else if (keptImports.length < imports.length) {
          // Some imports are unused, reconstruct line
          line = line.replace(/\{[^}]+\}/, `{ ${keptImports.join(', ')} }`);
        }
      }
    }
    
    // Skip single unused imports
    for (const unusedItem of unused) {
      if (line.match(new RegExp(`^import\\s+${unusedItem}\\s+from`))) {
        keep = false;
        break;
      }
    }
    
    // Comment out unused const/let/var
    for (const unusedItem of unused) {
      const constMatch = line.match(new RegExp(`^(\\s*)(const|let|var)\\s+${unusedItem}\\s*=`));
      if (constMatch && !line.trim().startsWith('//')) {
        line = `${constMatch[1]}// ${line.trim()}`;
      }
    }
    
    if (keep) {
      newLines.push(line);
    }
  }
  
  fs.writeFileSync(file, newLines.join('\n'));
});

console.log('\n✅ Done! Running ESLint again...\n');
const finalResult = execSync('npm run lint 2>&1 | grep -c "Error:" || echo "0"', { encoding: 'utf-8' });
console.log(`📊 Remaining errors: ${finalResult.trim()}`);
