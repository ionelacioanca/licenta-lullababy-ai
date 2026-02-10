# Quick Fix: Adding Your Logo

## Problem
The app.json references `./assets/images/icon.png`, but this file doesn't exist.

## Solution

You need to save your logo image (the one with the sleeping baby on the moon) as these files:

### Required Files:

1. **icon.png** (1024x1024px)
   - Location: `frontend/assets/images/icon.png`
   - Your full logo with the mint green → yellow gradient background
   - This is the main app icon

2. **adaptive-icon.png** (1024x1024px) 
   - Location: `frontend/assets/images/adaptive-icon.png`
   - Same logo but ensure the baby and moon stay in the center 66% safe zone
   - Android will crop this to different shapes (circle, square, etc.)

3. **splash-icon.png** (already exists, but update it)
   - Location: `frontend/assets/images/splash-icon.png`
   - Can be 1284x2778px (full screen) or smaller (will be centered)
   - Your logo centered on the mint green background

### Steps:

1. **Export your logo** from your design software as PNG
2. **Resize to 1024x1024px** (you can use online tools like https://squoosh.app/)
3. **Save as**:
   - `icon.png` (with gradient background)
   - `adaptive-icon.png` (same as icon.png, ensure safe zone)
4. **Place both files** in: `frontend/assets/images/`

### After adding the files:

```bash
cd frontend
npm start
```

Press `r` to reload the app, and your splash screen should show the logo!

### Temporary Fix (if you need to test now):

You can temporarily use an existing image. Update app.json:

```json
"icon": "./assets/images/splash-icon.png",
```

But this is NOT recommended for production - create the proper icon files!
