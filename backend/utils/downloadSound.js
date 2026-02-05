import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Downloads a sound file from a URL and saves it locally
 * @param {string} url - The URL of the sound file
 * @param {string} soundId - The ID of the sound (used for filename)
 * @returns {Promise<string>} - The local path to the downloaded file
 */
export const downloadSound = (url, soundId) => {
  return new Promise((resolve, reject) => {
    const uploadsDir = path.join(__dirname, '../uploads/sounds');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate filename from soundId
    const filename = `${soundId}.mp3`;
    const filePath = path.join(uploadsDir, filename);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`Sound already cached: ${filename}`);
      return resolve(`/uploads/sounds/${filename}`);
    }

    // Determine protocol
    const protocol = url.startsWith('https') ? https : http;

    console.log(`Downloading sound from: ${url}`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://mixkit.co/'
      }
    };
    
    protocol.get(url, options, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadSound(response.headers.location, soundId)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }

      const fileStream = fs.createWriteStream(filePath);
      
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Sound downloaded successfully: ${filename}`);
        resolve(`/uploads/sounds/${filename}`);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Gets the local URL for a sound, downloading it if necessary
 * @param {Object} sound - The sound object from database
 * @returns {Promise<string>} - The full local URL
 */
export const getLocalSoundUrl = async (sound) => {
  const baseUrl = process.env.BASE_URL || 'http://192.168.1.20:5000';
  
  // If already a local URL, return as is
  if (sound.audioUrl.startsWith('/uploads/')) {
    return `${baseUrl}${sound.audioUrl}`;
  }

  // If external URL, download it first
  if (sound.audioUrl.startsWith('http://') || sound.audioUrl.startsWith('https://')) {
    try {
      const localPath = await downloadSound(sound.audioUrl, sound._id);
      return `${baseUrl}${localPath}`;
    } catch (error) {
      console.error('Error downloading sound:', error);
      throw error;
    }
  }

  // If relative path, just prepend base URL
  return `${baseUrl}${sound.audioUrl}`;
};
