# Sound Library Backend - API Documentation

## Models

### Sound Model
- `title` (String, required): Sound name
- `artist` (String): Artist/creator name
- `category` (String, enum): lullaby | white-noise | nature | music-box | classical
- `duration` (Number): Duration in seconds
- `audioUrl` (String, required): URL to audio file
- `thumbnailUrl` (String): Thumbnail image URL
- `isDefault` (Boolean): Whether it's a pre-seeded sound
- `description` (String): Sound description
- `timestamps`: Auto-generated createdAt/updatedAt

## API Endpoints

All endpoints require authentication (JWT token in Authorization header)

### GET /api/sounds
Get all available sounds
- Response: Array of sound objects

### GET /api/sounds/default
Get only default (pre-seeded) sounds
- Response: Array of default sound objects

### GET /api/sounds/category/:category
Get sounds filtered by category
- Params: category (lullaby | white-noise | nature | music-box | classical)
- Response: Array of sound objects

### GET /api/sounds/:id
Get a specific sound by ID
- Params: id (MongoDB ObjectId)
- Response: Single sound object

### POST /api/sounds
Create a new sound (for future custom uploads)
- Body: Sound object (title, category, duration, audioUrl, etc.)
- Response: { message, sound }

## Seed Database

To populate the database with default sounds:

```bash
cd backend
node utils/seedSounds.js
```

This will:
- Clear existing default sounds
- Insert 13 default sounds across 5 categories
- Display summary of seeded sounds

## Categories & Default Sounds

### Lullaby (3 sounds)
- Brahms' Lullaby
- Twinkle Twinkle Little Star
- Rock-a-bye Baby

### White Noise (3 sounds)
- White Noise
- Pink Noise
- Brown Noise

### Nature (3 sounds)
- Rain Sounds
- Ocean Waves
- Forest Birds

### Music Box (2 sounds)
- Music Box Lullaby
- Classical Music Box

### Classical (2 sounds)
- Mozart for Babies
- Bach Lullaby

## Note on Audio URLs

Currently using placeholder URLs (soundhelix.com).
For production, replace with:
- Actual royalty-free audio files
- Cloud storage URLs (AWS S3, Firebase Storage, etc.)
- Or implement YouTube download feature

## Next Steps (Frontend)

1. Create `soundService.ts` in frontend/src/services
2. Create `SoundPlayer` component
3. Integrate with Dashboard below BabyMonitorStream
4. Add AsyncStorage for "last played" sound persistence
