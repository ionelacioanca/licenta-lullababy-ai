# Lullababy Image Assets

This folder contains all the visual assets for the Lullababy mobile application.

## Required Files

Place the following logo files in this directory:

### 1. `icon.png` (1024x1024px)
- Main app icon for iOS and Android
- Full logo with gradient background
- Keep critical elements in center 80%

### 2. `adaptive-icon.png` (1024x1024px)
- Android adaptive icon foreground layer
- Transparent background (background color set in app.json)
- Keep critical elements in center 66% circle (safe zone)

### 3. `splash-icon.png` (1284x2778px or smaller centered version)
- Splash screen displayed on app launch
- Full screen image or centered logo
- Gradient background: Mint green (#B8E6D5) → Yellow (#FFE8A8)

### 4. `favicon.png` (48x48px)
- Web browser tab icon
- Simplified logo version

## Logo Design

**Reference the logo you created**: Sleeping baby on crescent moon with sparkles

**Colors**:
- Background gradient: Mint green (#B8E6D5) → Pastel yellow (#FFE8A8)
- Moon: Cream yellow (#FFE8A8)
- Baby outline: Teal/sage green (#5A9B8A)
- Sparkles: Pink (#FFB8D4), Peach (#FFD4B8), Yellow (#FFF4D6), White

## Configuration

These files are referenced in `frontend/app.json`:

```json
{
  "expo": {
    "name": "Lullababy",
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "backgroundColor": "#B8E6D5"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#B8E6D5"
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

## Testing

After adding the logo files:

1. **Test in development**:
   ```bash
   npm start
   ```
   You should see the ASCII logo in terminal, then the splash screen in the app.

2. **Test Android adaptive icon**:
   - Use Android Studio Device Manager
   - Check icon in various shapes (circle, squircle, square)

3. **Test production build**:
   ```bash
   npm run build:android
   ```

## Need Help?

See `LOGO_BRANDING.md` in the project root for detailed specifications and design guidelines.
