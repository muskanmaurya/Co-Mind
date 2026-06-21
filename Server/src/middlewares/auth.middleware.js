import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches decoded user info to req.user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Please authenticate.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId;
    let userEmail = typeof decoded.email === 'string' ? decoded.email.toLowerCase() : null;

    if (!userEmail && userId) {
      const user = await userModel.findById(userId).select('email').lean();
      userEmail = user?.email ? String(user.email).toLowerCase() : null;
    }

    if (!userId || !userEmail) {
      return res.status(401).json({ message: 'Invalid token payload. Please login again.' });
    }

    // Attach user info to request
    req.user = {
      id: userId,
      email: userEmail,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please login again.' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please authenticate.' });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};
