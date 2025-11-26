// Authentication utility functions
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePasswords = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const generateSystemToken = (systemId, permissions) => {
  return jwt.sign(
    { systemId, permissions, type: 'system' },
    process.env.JWT_SYSTEM_SECRET,
    { expiresIn: '30d' }
  );
};