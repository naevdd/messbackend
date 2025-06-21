const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Stud=require('../models/Stud')
require('dotenv').config();

router.post('/register', async (req, res) => {
  try {
    const { studentname, hostelname, address, email, phone, password } = req.body;
    console.log(req.body);
    if (!studentname || !hostelname || !address || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await Stud.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newHost = new Stud({ studentname, hostelname, address, email, phone, password: hashedPassword });

    const savedHost = await newHost.save();
    res.status(201).json(savedHost);
  } catch (error) {
    res.status(500).json({ error: `Failed to save host: ${error.message}` });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Stud.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const studtoken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ studtoken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/protected', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing or malformed' });
  }

  const studtoken = authHeader.split(' ')[1];

  try { 
    const decoded = jwt.verify(studtoken, process.env.JWT_SECRET);
    res.json({ message: 'Access granted', user: decoded });
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;