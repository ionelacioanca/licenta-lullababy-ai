import Sound from '../models/Sound.js';

class SoundService {
  // Get all sounds
  async getAllSounds() {
    try {
      const sounds = await Sound.find().sort({ category: 1, title: 1 });
      return sounds;
    } catch (error) {
      throw new Error('Error fetching sounds: ' + error.message);
    }
  }

  // Get sounds by category
  async getSoundsByCategory(category) {
    try {
      const sounds = await Sound.find({ category }).sort({ title: 1 });
      return sounds;
    } catch (error) {
      throw new Error('Error fetching sounds by category: ' + error.message);
    }
  }

  // Get default sounds only
  async getDefaultSounds() {
    try {
      const sounds = await Sound.find({ isDefault: true }).sort({ category: 1, title: 1 });
      return sounds;
    } catch (error) {
      throw new Error('Error fetching default sounds: ' + error.message);
    }
  }

  // Add a new sound (for future custom uploads)
  async createSound(soundData) {
    try {
      const sound = new Sound(soundData);
      await sound.save();
      return sound;
    } catch (error) {
      throw new Error('Error creating sound: ' + error.message);
    }
  }

  // Get sound by ID
  async getSoundById(soundId) {
    try {
      const sound = await Sound.findById(soundId);
      if (!sound) {
        throw new Error('Sound not found');
      }
      return sound;
    } catch (error) {
      throw new Error('Error fetching sound: ' + error.message);
    }
  }
}

export default new SoundService();
