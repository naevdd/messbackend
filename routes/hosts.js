const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Host = require('../models/Host');;
const upload = require('../upload')
require('dotenv').config();

router.post('/register',upload.single('image'), async (req, res) => {
  try {
    const { ownername, messname, location, email, phone, workinghours, password } = req.body;

    const image = req.file ? req.file.filename : null;

    if (!ownername || !messname || !location || !email || !phone || !workinghours || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await Host.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const emptyMenu = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ].map(day => ({
      day,
      meals: [
        { type: 'Breakfast', items: [] },
        { type: 'Lunch', items: [] },
        { type: 'Dinner', items: [] }
      ]
    }));

    const hashedPassword = await bcrypt.hash(password, 10);
    const newHost = new Host({
      ownername,
      messname,
      location,
      email,
      phone,
      workinghours,
      password: hashedPassword,
      image,
      weeklyMenu: emptyMenu
    });

    const savedHost = await newHost.save();

    res.status(201).json({ message: 'Host registered successfully!', host: savedHost });
  } catch (error) {
    res.status(500).json({ error: `Failed to save host: ${error.message}` });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Host.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const hostId = user._id

    const messtoken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ messtoken, hostId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/protected', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing or malformed' });
  }

  const messtoken = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(messtoken, process.env.JWT_SECRET);
    res.json({ message: 'Access granted', user: decoded });
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
