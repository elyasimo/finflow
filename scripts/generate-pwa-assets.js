const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
const splashDir = path.join(__dirname, '../public/splash');

// Ensure directories exist
if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

// Icon sizes needed
const iconSizes = [32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Base SVG for icon
const createIconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.21)}" fill="url(#grad)"/>
  <text x="${size/2}" y="${size * 0.66}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${Math.round(size * 0.55)}" 
        font-weight="700" 
        fill="white" 
        text-anchor="middle">F</text>
</svg>`;

// Splash screen template
const createSplashSvg = (width, height) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#0a0a0a"/>
  <g transform="translate(${width/2}, ${height/2 - 50})">
    <rect x="-60" y="-60" width="120" height="120" rx="25" fill="#10b981"/>
    <text x="0" y="30" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="70" 
          font-weight="700" 
          fill="white" 
          text-anchor="middle">F</text>
  </g>
  <text x="${width/2}" y="${height/2 + 100}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="36" 
        font-weight="600" 
        fill="white" 
        text-anchor="middle">FinFlow</text>
</svg>`;

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Generate icon PNGs
  for (const size of iconSizes) {
    const svg = Buffer.from(createIconSvg(size));
    const filename = size === 180 ? 'apple-touch-icon.png' : `icon-${size}x${size}.png`;
    
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, filename));
    
    console.log(`✅ Generated ${filename}`);
  }

  // Generate splash screens for iOS
  const splashScreens = [
    { width: 1170, height: 2532, name: 'splash-1170x2532.png' }, // iPhone 14/13/12
    { width: 1125, height: 2436, name: 'splash-1125x2436.png' }, // iPhone X/XS/11 Pro
    { width: 1284, height: 2778, name: 'splash-1284x2778.png' }, // iPhone Pro Max
    { width: 1179, height: 2556, name: 'splash-1179x2556.png' }, // iPhone 14 Pro
    { width: 1290, height: 2796, name: 'splash-1290x2796.png' }, // iPhone 14 Pro Max
  ];

  console.log('\n📱 Generating splash screens...\n');

  for (const screen of splashScreens) {
    const svg = Buffer.from(createSplashSvg(screen.width, screen.height));
    
    await sharp(svg)
      .resize(screen.width, screen.height)
      .png()
      .toFile(path.join(splashDir, screen.name));
    
    console.log(`✅ Generated ${screen.name}`);
  }

  // Generate OG image
  console.log('\n🖼️  Generating OG image...\n');
  
  const ogSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <rect width="1200" height="630" fill="#0a0a0a"/>
    <g transform="translate(100, 200)">
      <rect width="120" height="120" rx="25" fill="#10b981"/>
      <text x="60" y="85" 
            font-family="Arial, Helvetica, sans-serif" 
            font-size="70" 
            font-weight="700" 
            fill="white" 
            text-anchor="middle">F</text>
    </g>
    <text x="250" y="290" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="72" 
          font-weight="700" 
          fill="white">FinFlow</text>
    <text x="100" y="380" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="32" 
          fill="#a1a1aa">Smart Finance Manager</text>
    <text x="100" y="450" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="24" 
          fill="#71717a">Manage finances • Track investments • Monitor crypto</text>
  </svg>`);

  await sharp(ogSvg)
    .resize(1200, 630)
    .png()
    .toFile(path.join(__dirname, '../public/og-image.png'));
  
  console.log('✅ Generated og-image.png');

  // Generate favicon.ico (32x32)
  const faviconSvg = Buffer.from(createIconSvg(32));
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.png'));
  
  console.log('✅ Generated favicon.png');

  console.log('\n🎉 All PWA assets generated successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Test on iPhone: Open finflowapp.ch → Share → Add to Home Screen');
  console.log('   2. Check PWA score: https://web.dev/measure/');
}

generateIcons().catch(console.error);
