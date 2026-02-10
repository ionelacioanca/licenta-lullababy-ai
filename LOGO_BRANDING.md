# Logo & Branding Guide - Lullababy

## Overview

This document describes the logo assets and branding for the Lullababy AI mobile application.

## Logo Design

**Concept**: Sleeping baby on a crescent moon with AI sparkles

**Visual Elements**:
- 🌙 **Crescent Moon**: Soft yellow/cream (`#FFE8A8`) - represents lullaby, peaceful sleep
- 👶 **Baby Outline**: Teal/sage green (`#5A9B8A`) - sleeping peacefully on the moon
- ✨ **AI Sparkles**: Colorful particles (pink `#FFB8D4`, peach `#FFD4B8`, yellow `#FFF4D6`, white) - subtle AI technology
- 📐 **Background Gradient**: Mint green (`#B8E6D5`) → Pastel yellow (`#FFE8A8`)

**Style**:
- Modern, friendly, clean
- Rounded shapes (no sharp corners)
- Flat design with subtle depth/glow
- Gender-neutral pastel colors

## Required Asset Files

### 1. App Icon (`icon.png`)

**Location**: `frontend/assets/images/icon.png`

**Specifications**:
- **Size**: 1024x1024px (required by both iOS and Android)
- **Format**: PNG with transparency
- **Content**: Full logo with moon, baby, sparkles
- **Background**: Include the gradient background (not transparent)

**Safe Zones**:
- Keep critical elements (moon + baby) in center 80% (820x820px)
- Sparkles can extend to edges but avoid small detail at very edge

---

### 2. Android Adaptive Icon (`adaptive-icon.png`)

**Location**: `frontend/assets/images/adaptive-icon.png`

**Specifications**:
- **Size**: 1024x1024px
- **Format**: PNG with transparency
- **Foreground Layer**: Moon + baby + sparkles (transparent background)
- **Background Color**: `#B8E6D5` (mint green) - set in `app.json`

**Safe Zone**:
- Android masks icons to various shapes (circle, squircle, square)
- Keep critical elements (moon + baby face) within center **66%** circle (radius ~340px from center)
- Sparkles can be in outer area but will be cropped on circular icons

**Testing**:
- Test with Android Studio's Icon Preview tool
- Verify visibility in: Circle, Squircle, Rounded Square, Teardrop

---

### 3. Splash Screen (`splash-icon.png`)

**Location**: `frontend/assets/images/splash-icon.png`

**Specifications**:
- **Size**: 1284x2778px (iPhone 13 Pro Max resolution)
- **Format**: PNG
- **Content**: 
  - Logo centered: ~1200x1200px area
  - Background: Mint green to yellow gradient (matches logo theme)
- **Text** (optional): "Lullababy" below logo in rounded font

**Configuration** (in `app.json`):
```json
{
  "expo": {
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#B8E6D5"
    }
  }
}
```

**Alternative (Simpler)**:
- Use just the logo icon (600x600px) centered
- Set `imageWidth: 200` in `app.json` to scale appropriately
- Solid mint green background

---

### 4. Favicon (`favicon.png`)

**Location**: `frontend/assets/images/favicon.png`

**Specifications**:
- **Size**: 48x48px (web browser tab icon)
- **Format**: PNG
- **Content**: Simplified logo (just moon + baby silhouette)
- **Background**: Solid mint green or transparent

---

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Mint Green | `#B8E6D5` | `rgb(184, 230, 213)` | Primary background, Android adaptive icon |
| Sage Green | `#9FD8C3` | `rgb(159, 216, 195)` | Secondary green, gradients |
| Teal Dark | `#5A9B8A` | `rgb(90, 155, 138)` | Baby outline, dark accents |
| Pastel Yellow | `#FFE8A8` | `rgb(255, 232, 168)` | Moon, gradient bottom |
| Cream Yellow | `#FFF4D6` | `rgb(255, 244, 214)` | Light yellow, highlights |

### Accent Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Peach | `#FFD4B8` | `rgb(255, 212, 184)` | Sparkle particles |
| Pink Soft | `#FFB8D4` | `rgb(255, 184, 212)` | Sparkle particles |
| White | `#FFFFFF` | `rgb(255, 255, 255)` | Sparkle highlights |

---

## Typography

### App Name Display

**Font Recommendations**:
- **Primary**: Quicksand (Medium/Bold) - rounded, friendly
- **Alternative 1**: Nunito (SemiBold) - slightly more serious
- **Alternative 2**: Comfortaa (Bold) - very rounded, playful

**Display Text**: "Lullababy" (capital L, lowercase rest)

**Not**: ~~"LullaBaby"~~ or ~~"LULLABABY"~~

---

## Asset Checklist

Before building for production, ensure you have:

- [ ] `icon.png` (1024x1024px) - App icon for both platforms
- [ ] `adaptive-icon.png` (1024x1024px) - Android adaptive foreground
- [ ] `splash-icon.png` (1284x2778px) - Splash screen full image
- [ ] `favicon.png` (48x48px) - Web favicon
- [ ] All colors match the palette above
- [ ] Safe zones respected for Android adaptive icon
- [ ] Logo tested on both light and dark device themes

---

## Current Implementation

### Logo Display in Build

When running `npm start`, `npm run android`, or build commands, a beautiful ASCII logo is displayed in the terminal:

```
        ╭───────────────────────────────────╮
        │                                   │
        │          🌙  Lullababy  ✨        │
        │                                   │
        │      AI-Powered Baby Monitor      │
        │                                   │
        ╰───────────────────────────────────╯

    Building with love for parents 💚
```

This is handled by `frontend/scripts/show-logo.js`.

---

## Design Notes

### Why This Color Palette?

**Mint Green + Pastel Yellow**:
- ✅ **Warm & Welcoming**: Not cold/corporate like blue/purple
- ✅ **Baby-Appropriate**: Common in nursery products
- ✅ **Gender-Neutral**: Avoids pink/blue stereotypes
- ✅ **Calming**: Psychological association with nature, growth, health
- ✅ **Differentiates**: Most baby monitor apps use blue - we stand out

### Competitor Analysis

| App | Primary Colors | Feel |
|-----|---------------|------|
| Nanit | Blue, White | Tech-focused, clinical |
| Owlet | Blue, Teal | Medical, professional |
| Hatch Baby | Green, White | Natural but minimal |
| **Lullababy** | **Mint Green, Yellow** | **Warm, nurturing, innovative** |

---

## Future Enhancements

### Animated Splash Screen (Optional)

For a delightful user experience, consider animating the splash screen:

1. **Moon glow pulse**: Subtle yellow glow animation
2. **Sparkles twinkle**: Particles fade in/out
3. **Baby breathing**: Slight up/down motion (subtle)

**Implementation**: Use Lottie animation file (JSON) with `expo-splash-screen`

### App Store Assets

When publishing to stores, you'll also need:

**Google Play Store**:
- Feature Graphic: 1024x500px (logo + tagline)
- Screenshots: 1080x1920px (6+ images)
- Promo Video: 30 seconds (optional)

**Apple App Store**:
- Screenshots: Various iPhone sizes
- App Preview Video: 15-30 seconds (optional)

---

## Credits

**Design**: Ionela Cioancă  
**Date**: February 2026  
**Version**: 1.0

---

## Contact

For questions about logo usage or branding guidelines, contact the development team.
