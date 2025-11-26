#!/bin/bash
# Automated ESLint Fixer - systematically fixes all TypeScript/ESLint errors

set -e

echo "🚀 Starting Automated ESLint Fixer"
echo "============================================================"

# Get list of all files with errors
FILES=$(npm run lint 2>&1 | grep "^\./" | sort | uniq)

if [ -z "$FILES" ]; then
    echo "✅ No ESLint errors found!"
    exit 0
fi

echo "📁 Files with errors:"
echo "$FILES"
echo ""

# Fix unused imports/variables using sed
fix_unused_imports() {
    local file="$1"
    echo "  🗑️  Removing unused imports from $file..."
    
    # Get list of unused variables for this file
    UNUSED=$(npm run lint 2>&1 | grep "$file" -A 100 | grep "is defined but never used" | sed -E "s/.*'([^']+)'.*/\1/" | sort | uniq)
    
    if [ -z "$UNUSED" ]; then
        return
    fi
    
    # For each unused item, remove from imports
    for item in $UNUSED; do
        # Remove from multi-import: import { A, unused, B } -> import { A, B }
        sed -i.bak -E "s/import \{ ([^}]*), $item,/import { \1,/g" "$file"
        sed -i.bak -E "s/import \{ $item, ([^}]*)\}/import { \1 }/g" "$file"
        sed -i.bak -E "s/import \{ ([^}]*), $item \}/import { \1 }/g" "$file"
        
        # Remove entire line if it's a single import
        sed -i.bak -E "/^import.*\{ $item \}.*$/d" "$file"
        sed -i.bak -E "/^import $item .*$/d" "$file"
        
        # Comment out const/let/var declarations
        sed -i.bak -E "s/^(\s*)(const|let|var) $item =/\1\/\/ \2 $item =/g" "$file"
    done
    
    rm -f "${file}.bak"
}

# Fix explicit any types
fix_explicit_any() {
    local file="$1"
    echo "  🔧 Fixing 'any' types in $file..."
    
    # Replace common any patterns with proper types
    sed -i.bak -E '
        s/: any\b([^[])/: unknown\1/g
        s/: any\[\]/: unknown[]/g
        s/err: unknown/err: unknown/g
        s/error: unknown/error: unknown/g
        s/e: unknown/e: unknown/g
    ' "$file"
    
    rm -f "${file}.bak"
}

# Process each file
for file in $FILES; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    echo "🔧 Processing $file..."
    
    # Fix unused imports
    fix_unused_imports "$file"
    
    # Fix explicit any
    if npm run lint 2>&1 | grep "$file" | grep -q "Unexpected any"; then
        fix_explicit_any "$file"
    fi
    
    echo "  ✅ Done"
done

echo ""
echo "============================================================"
echo "🔍 Running ESLint again to verify..."
echo ""

# Count remaining errors
ERROR_COUNT=$(npm run lint 2>&1 | grep -c "Error:" || true)

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "🎉 All ESLint errors fixed!"
else
    echo "⚠️  $ERROR_COUNT errors remaining"
    echo ""
    echo "📋 Remaining errors:"
    npm run lint 2>&1 | grep "Error:" | head -20
fi
