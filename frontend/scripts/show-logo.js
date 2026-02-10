#!/usr/bin/env node

/**
 * Lullababy Logo Display Script
 * Shows a beautiful ASCII logo when building or starting the app
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

// Logo with moon and baby theme
const logo = `
${colors.cyan}${colors.bright}
        ╭───────────────────────────────────╮
        │                                   │
        │          🌙  ${colors.yellow}Lullababy${colors.cyan}  ✨        │
        │                                   │
        │      ${colors.white}AI-Powered Baby Monitor${colors.cyan}       │
        │                                   │
        ╰───────────────────────────────────╯
${colors.reset}
`;

const subtitle = `${colors.gray}    Building with love for parents 💚${colors.reset}\n`;

// Info based on environment
const env = process.env.NODE_ENV || 'development';
const envColor = env === 'production' ? colors.green : colors.yellow;
const envText = `${colors.gray}    Environment: ${envColor}${env}${colors.reset}`;

// Display the logo
console.clear(); // Clear console for clean output
console.log(logo);
console.log(subtitle);
console.log(envText);
console.log(''); // Empty line for spacing
