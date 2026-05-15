import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';

/**
 * Basic email validator using regex
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
  return re.test(String(email).toLowerCase());
};

/**
 * Generate a JWT token for the authenticated user
 * @param {string} userId - The user's MongoDB ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    // Don't throw raw error — return null so callers can handle consistently
    return null;
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * User Signup Controller
 * POST /auth/signup
 */
export const registerController = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password with salt rounds of 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await userModel.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword });

    // Generate JWT token
    const token = generateToken(newUser._id.toString());
    if (!token) {
      console.error('JWT_SECRET missing');
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' });
    }

    // Return success response (exclude password)
    return res.status(201).json({
      message: 'User created successfully',
      user: { _id: newUser._id, name: newUser.name, email: newUser.email, createdAt: newUser.createdAt },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle duplicate key error (race condition)
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    return res.status(500).json({ message: 'Internal server error during signup' });
  }
};

/**
 * User Login Controller
 * POST /auth/login
 */
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Find user by email
    const user = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare provided password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());
    if (!token) {
      console.error('JWT_SECRET missing');
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' });
    }

    // Return success response (exclude password)
    return res.status(200).json({ user: { _id: user._id, name: user.name, email: user.email, createdAt: user.createdAt }, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
};
