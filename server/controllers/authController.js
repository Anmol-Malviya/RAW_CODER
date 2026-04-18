import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// MOCK STORE for testing without DB
const mockUsers = [];
const isMockMode = () => mongoose.connection.readyState !== 1;
import mongoose from 'mongoose';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let user;
    if (isMockMode()) {
      console.log('⚡ Mock Mode: Registering user in-memory');
      const existing = mockUsers.find(u => u.email === email);
      if (existing) return res.status(400).json({ error: 'Email already exists' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      user = { 
        _id: `mock_${Date.now()}`, 
        name, 
        email, 
        password: hashedPassword, 
        role: role === 'admin' ? 'admin' : 'candidate' 
      };
      mockUsers.push(user);
    } else {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        name,
        email,
        password: hashedPassword,
        role: role && role === 'admin' ? 'admin' : 'candidate',
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    if (isMockMode()) {
      console.log('⚡ Mock Mode: Authenticating user in-memory');
      user = mockUsers.find(u => u.email === email);
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, profile } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (profile) user.profile = { ...user.profile, ...profile };
    
    await user.save();
    res.json({ message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email, profile: user.profile } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
