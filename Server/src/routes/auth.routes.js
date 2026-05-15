import express from 'express';
import { registerController, loginController } from '../controllers/auth.controller.js';

const authRouter = express.Router();

/**
 * POST /auth/signup
 * Register a new user
 * 
 * Request body:
 * {
 *   "name": "string (required)",
 *   "email": "string (required, unique)",
 *   "password": "string (required, min 6 chars recommended)"
 * }
 * 
 * Response (201):
 * {
 *   "message": "User created successfully",
 *   "user": { "_id", "name", "email", "createdAt" },
 *   "token": "JWT token"
 * }
 * 
 * Error responses:
 * 400: "Name, email, and password are required" or "Email already registered"
 * 500: "Internal server error during signup"
 */
authRouter.post('/signup', registerController);

/**
 * POST /auth/login
 * Authenticate an existing user
 * 
 * Request body:
 * {
 *   "email": "string (required)",
 *   "password": "string (required)"
 * }
 * 
 * Response (200):
 * {
 *   "message": "Login successful",
 *   "user": { "_id", "name", "email", "createdAt" },
 *   "token": "JWT token"
 * }
 * 
 * Error responses:
 * 400: "Email and password are required"
 * 401: "Invalid credentials"
 * 500: "Internal server error during login"
 */
authRouter.post('/login', loginController);

export default authRouter;
