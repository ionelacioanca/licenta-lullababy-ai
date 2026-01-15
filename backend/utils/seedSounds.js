// Seed script for default sounds
// Run with: node backend/utils/seedSounds.js

import Sound from '../models/Sound.js';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultSounds = [
  // Lullabies
  {
    title: "Brahms' Lullaby",
    artist: "Classical",
    category: "lullaby",
    duration: 180,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/brahms-lullaby.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/FFB6C1/000000?text=Lullaby",
    description: "Classic soothing lullaby for peaceful sleep",
    isDefault: true
  },
  {
    title: "Twinkle Twinkle Little Star",
    artist: "Traditional",
    category: "lullaby",
    duration: 120,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/twinkle-star.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/FFB6C1/000000?text=Lullaby",
    description: "Gentle melody to calm your baby",
    isDefault: true
  },
  {
    title: "Rock-a-bye Baby",
    artist: "Traditional",
    category: "lullaby",
    duration: 150,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/rock-a-bye.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/FFB6C1/000000?text=Lullaby",
    description: "Traditional lullaby for bedtime",
    isDefault: true
  },

  // White Noise
  {
    title: "White Noise",
    artist: "Ambient",
    category: "white-noise",
    duration: 300,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/white-noise.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/D3D3D3/000000?text=White+Noise",
    description: "Continuous white noise for better sleep",
    isDefault: true
  },
  {
    title: "Pink Noise",
    artist: "Ambient",
    category: "white-noise",
    duration: 300,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/pink-noise.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/D3D3D3/000000?text=Pink+Noise",
    description: "Softer than white noise, deeper frequencies",
    isDefault: true
  },
  {
    title: "Brown Noise",
    artist: "Ambient",
    category: "white-noise",
    duration: 300,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/brown-noise.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/D3D3D3/000000?text=Brown+Noise",
    description: "Deep rumbling sound for relaxation",
    isDefault: true
  },

  // Nature Sounds
  {
    title: "Rain Sounds",
    artist: "Nature",
    category: "nature",
    duration: 240,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/rain.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/87CEEB/000000?text=Rain",
    description: "Gentle rain for peaceful sleep",
    isDefault: true
  },
  {
    title: "Ocean Waves",
    artist: "Nature",
    category: "nature",
    duration: 240,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/ocean-waves.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/87CEEB/000000?text=Ocean",
    description: "Calming ocean waves",
    isDefault: true
  },
  {
    title: "Forest Birds",
    artist: "Nature",
    category: "nature",
    duration: 180,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/forest-birds.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/90EE90/000000?text=Birds",
    description: "Peaceful forest ambience",
    isDefault: true
  },

  // Music Box
  {
    title: "Music Box Lullaby",
    artist: "Instrumental",
    category: "music-box",
    duration: 120,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/music-box-lullaby.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/F0E68C/000000?text=Music+Box",
    description: "Gentle music box melody",
    isDefault: true
  },
  {
    title: "Classical Music Box",
    artist: "Instrumental",
    category: "music-box",
    duration: 150,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/classical-music-box.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/F0E68C/000000?text=Music+Box",
    description: "Soothing music box tunes",
    isDefault: true
  },

  // Classical
  {
    title: "Mozart for Babies",
    artist: "Mozart",
    category: "classical",
    duration: 200,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/mozart-babies.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/DDA0DD/000000?text=Classical",
    description: "Classical music for infant development",
    isDefault: true
  },
  {
    title: "Bach Lullaby",
    artist: "Bach",
    category: "classical",
    duration: 180,
    audioUrl: "https://pub-c738f1b82f0048ceb0de07385edc702f.r2.dev/bach-lullaby.mp3",
    thumbnailUrl: "https://via.placeholder.com/150/DDA0DD/000000?text=Classical",
    description: "Gentle Bach composition for sleep",
    isDefault: true
  }
];

async function seedSounds() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing default sounds
    await Sound.deleteMany({ isDefault: true });
    console.log('Cleared existing default sounds');

    // Insert new default sounds
    const inserted = await Sound.insertMany(defaultSounds);
    console.log(`✅ Successfully seeded ${inserted.length} sounds`);

    console.log('\nSounds by category:');
    const categories = ['lullaby', 'white-noise', 'nature', 'music-box', 'classical'];
    for (const category of categories) {
      const count = await Sound.countDocuments({ category, isDefault: true });
      console.log(`  - ${category}: ${count} sounds`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sounds:', error);
    process.exit(1);
  }
}

seedSounds();
