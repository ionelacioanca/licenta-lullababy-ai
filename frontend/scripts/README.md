# Build Scripts

This folder contains utility scripts for the Lullababy project.

## show-logo.js

Displays a beautiful ASCII art logo in the terminal when running build or development commands.

### Usage

Automatically runs before these commands (configured in `package.json`):

- `npm start` - Shows logo before starting Expo dev server
- `npm run android` - Shows logo before building Android app
- `npm run ios` - Shows logo before building iOS app
- `npm run web` - Shows logo before starting web version
- `npm run build:android` - Shows logo before EAS build
- `npm run build:ios` - Shows logo before EAS build

### Manual Usage

You can also run it directly:

```bash
node ./scripts/show-logo.js
```

### Features

- 🎨 **Colorful ASCII art** - Uses ANSI color codes for terminal styling
- 🌙 **Moon & baby theme** - Matches the app's visual identity
- 📊 **Environment detection** - Shows whether running in development or production
- 🧹 **Clean output** - Clears terminal for a fresh start

### Customization

To modify the logo or colors, edit `show-logo.js`:

```javascript
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',   // Change these codes
  cyan: '\x1b[36m',    // for different colors
  yellow: '\x1b[33m',
  // ...
};
```

### Output Example

```
        ╭───────────────────────────────────╮
        │                                   │
        │          🌙  Lullababy  ✨        │
        │                                   │
        │      AI-Powered Baby Monitor      │
        │                                   │
        ╰───────────────────────────────────╯

    Building with love for parents 💚

    Environment: development
```

## reset-project.js

Original Expo script for resetting the project to initial state.

See Expo documentation for usage.
