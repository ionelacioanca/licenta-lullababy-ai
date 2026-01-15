// List all sounds in database
import Sound from '../models/Sound.js';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function listSounds() {
  try {
    await connectDB();
    console.log('Connected to database\n');

    const sounds = await Sound.find({});
    console.log(`Found ${sounds.length} sounds:\n`);

    sounds.forEach(sound => {
      console.log(`ID: ${sound._id}`);
      console.log(`Title: ${sound.title}`);
      console.log(`Category: ${sound.category}`);
      console.log(`Audio URL: ${sound.audioUrl}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listSounds();
