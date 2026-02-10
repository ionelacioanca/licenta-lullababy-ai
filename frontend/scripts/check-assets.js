#!/usr/bin/env node

/**
 * Logo Asset Checker for Lullababy
 * Verifies if all required logo files exist
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const assetsPath = path.join(__dirname, '..', 'assets', 'images');

const requiredAssets = [
  {
    name: 'icon.png',
    size: '1024x1024px',
    description: 'Main app icon (iOS & Android)',
    critical: true
  },
  {
    name: 'adaptive-icon.png',
    size: '1024x1024px',
    description: 'Android adaptive icon foreground',
    critical: true
  },
  {
    name: 'splash-icon.png',
    size: '1284x2778px or smaller',
    description: 'Splash screen image',
    critical: true
  },
  {
    name: 'favicon.png',
    size: '48x48px',
    description: 'Web favicon',
    critical: false
  }
];

console.log(`\n${colors.cyan}╔════════════════════════════════════════╗`);
console.log(`║  🌙 Lullababy Logo Asset Checker  ✨  ║`);
console.log(`╚════════════════════════════════════════╝${colors.reset}\n`);

let allGood = true;
let missingCritical = [];

requiredAssets.forEach(asset => {
  const assetPath = path.join(assetsPath, asset.name);
  const exists = fs.existsSync(assetPath);
  
  const status = exists 
    ? `${colors.green}✓ FOUND${colors.reset}` 
    : `${colors.red}✗ MISSING${colors.reset}`;
  
  console.log(`${status} - ${asset.name}`);
  console.log(`          ${asset.description}`);
  console.log(`          Required size: ${asset.size}\n`);
  
  if (!exists && asset.critical) {
    allGood = false;
    missingCritical.push(asset.name);
  }
});

if (!allGood) {
  console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}⚠️  MISSING CRITICAL ASSETS${colors.reset}\n`);
  console.log(`The following files are required but missing:`);
  missingCritical.forEach(file => {
    console.log(`   • ${file}`);
  });
  console.log(`\n${colors.cyan}📌 Next steps:${colors.reset}`);
  console.log(`   1. Export your logo from your design tool`);
  console.log(`   2. Resize to the required dimensions`);
  console.log(`   3. Save as PNG in: frontend/assets/images/`);
  console.log(`   4. Run this checker again: node scripts/check-assets.js`);
  console.log(`\n${colors.yellow}See LOGO_BRANDING.md for detailed specifications.${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}✅ All critical logo assets are present!${colors.reset}\n`);
  console.log(`You're ready to build your app! 🚀\n`);
  process.exit(0);
}
