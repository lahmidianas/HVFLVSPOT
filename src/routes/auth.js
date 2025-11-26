import express from 'express';
import { body } from 'express-validator';
import { signup, login, refresh, supabaseCallback } from '../controllers/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { verifySupabaseToken } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Supabase auth callback endpoint for user sync
router.post(
  '/supabase/callback',
  verifySupabaseToken,
  supabaseCallback
);

// Legacy endpoints (kept for backward compatibility)
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['User', 'Organizer']),
    validateRequest
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validateRequest
  ],
  login
);

router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty(),
    validateRequest
  ],
  refresh
);

// Test endpoint to verify Supabase token
router.get(
  '/verify',
  verifySupabaseToken,
  (req, res) => {
    res.json({
      message: 'Token verified successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
);

export default router;