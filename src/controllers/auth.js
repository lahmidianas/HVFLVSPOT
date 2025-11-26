import { AuthService } from '../services/authService.js';
import { generateTokens } from '../utils/auth.js';
import { supabase } from '../lib/supabase.js';
import jwt from 'jsonwebtoken';

const authService = new AuthService();

export const supabaseCallback = async (req, res, next) => {
  try {
    // User is already verified by verifySupabaseToken middleware
    // Just return the user data
    res.json({
      message: 'User authenticated successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await authService.createUser(email, password, name, role);
    const tokens = generateTokens(user.id, role);

    res.status(201).json({
      ...tokens,
      user: { id: user.id, email, name, role }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await authService.validateCredentials(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens(user.id, user.role);

    res.json({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await authService.getUserProfile(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tokens = generateTokens(decoded.userId, user.role);
    res.json(tokens);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    next(error);
  }
};