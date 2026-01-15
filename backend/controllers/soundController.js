import soundService from '../services/soundService.js';

// Get all sounds
const getAllSounds = async (req, res) => {
  try {
    const sounds = await soundService.getAllSounds();
    res.status(200).json(sounds);
  } catch (error) {
    console.error('Error in getAllSounds:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get sounds by category
const getSoundsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const sounds = await soundService.getSoundsByCategory(category);
    res.status(200).json(sounds);
  } catch (error) {
    console.error('Error in getSoundsByCategory:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get default sounds only
const getDefaultSounds = async (req, res) => {
  try {
    const sounds = await soundService.getDefaultSounds();
    res.status(200).json(sounds);
  } catch (error) {
    console.error('Error in getDefaultSounds:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get sound by ID
const getSoundById = async (req, res) => {
  try {
    const { id } = req.params;
    const sound = await soundService.getSoundById(id);
    res.status(200).json(sound);
  } catch (error) {
    console.error('Error in getSoundById:', error);
    res.status(404).json({ message: error.message });
  }
};

// Create a new sound (for future use)
const createSound = async (req, res) => {
  try {
    const soundData = req.body;
    const sound = await soundService.createSound(soundData);
    res.status(201).json({ message: 'Sound created successfully', sound });
  } catch (error) {
    console.error('Error in createSound:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get local URL for Raspberry Pi playback (returns Cloudflare R2 URL)
const getLocalUrl = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('getLocalUrl called with ID:', id);
    
    const sound = await soundService.getSoundById(id);
    console.log('Found sound:', sound.title);
    console.log('Sending Cloudflare R2 URL to Raspberry Pi:', sound.audioUrl);
    
    // Return the Cloudflare R2 URL directly
    res.status(200).json({ url: sound.audioUrl });
  } catch (error) {
    console.error('Error in getLocalUrl:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export {
  getAllSounds,
  getSoundsByCategory,
  getDefaultSounds,
  getSoundById,
  createSound,
  getLocalUrl
};
