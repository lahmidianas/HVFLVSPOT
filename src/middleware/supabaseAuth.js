import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client for JWT verification
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Middleware to verify Supabase JWT tokens
 */
export const verifySupabaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        code: 'UNAUTHORIZED'
      });
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Get additional user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role, metadata')
      .eq('id', user.id)
      .single();

    if (userError) {
      // If user doesn't exist in our users table, create them
      if (userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            role: 'User',
            metadata: {}
          })
          .select()
          .single();

        if (createError) {
          return res.status(500).json({
            message: 'Failed to create user profile',
            code: 'USER_CREATION_FAILED'
          });
        }

        req.user = {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          metadata: newUser.metadata,
          supabaseUser: user
        };
      } else {
        return res.status(500).json({
          message: 'Failed to fetch user data',
          code: 'USER_FETCH_FAILED'
        });
      }
    } else {
      req.user = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        metadata: userData.metadata,
        supabaseUser: user
      };
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      message: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

/**
 * Middleware to authorize specific roles
 */
export const authorizeSupabaseRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * Middleware to get user ID for API operations
 */
export const getUserId = (req) => {
  return req.user?.id;
};

/**
 * Middleware to check if user is organizer
 */
export const requireOrganizer = (req, res, next) => {
  if (!req.user || req.user.role !== 'Organizer') {
    return res.status(403).json({
      message: 'Organizer role required',
      code: 'ORGANIZER_REQUIRED'
    });
  }
  next();
};