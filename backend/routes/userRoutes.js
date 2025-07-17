import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', async (req, res) => { 
  const { name, email, password, role } = req.body;

  try {
    const newUser = new User({name, email, password, role});
    await newUser.save();
    console.log("newUser:", newUser);
    console.log("newUser._id:", newUser._id);

    res.status(201).json({ 
      message: 'User registered successfully',
      parentId: newUser._id.toString()   
    });
  } catch (error) {
    res.status(400).json({ error: 'User already exists' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      name: user.name,
      parentId: user._id, 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/verify-token', auth, (req, res) => {
  res.json({ message: 'Token valid', user: req.user });
});

export default router;