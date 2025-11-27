const fs = require('fs');
const path = require('path');

// This script generates placeholder PNG icons from the SVG
// In production, use a proper image tool or online converter

const sizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');
const splashDir = path.join(__dirname, '../public/splash');

// Create directories
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

// Generate a simple SVG for each size (these should be converted to PNG)
const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.21)}" fill="url(#grad)"/>
  <text x="${size/2}" y="${size * 0.66}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${Math.round(size * 0.55)}" 
        font-weight="700" 
        fill="white" 
        text-anchor="middle">F</text>
</svg>`;

// Generate SVGs (for now - will need to convert to PNG)
sizes.forEach(size => {
  const svg = svgTemplate(size);
  const filename = size === 180 ? 'apple-touch-icon.svg' : `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Also create 32x32 for favicon
fs.writeFileSync(path.join(iconsDir, 'icon-32x32.svg'), svgTemplate(32));
console.log('Generated icon-32x32.svg');

console.log('\n✅ SVG icons generated!');
console.log('\n⚠️  Note: Convert these SVGs to PNGs using:');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - Or install sharp: npm i -D sharp && run conversion script');
console.log('\n📱 Splash screens needed for iOS:');
console.log('   - 1170x2532 (iPhone 14/13/12 Pro)');
console.log('   - 1125x2436 (iPhone X/XS/11 Pro)');
console.log('   - 1284x2778 (iPhone 14/13/12 Pro Max)');
