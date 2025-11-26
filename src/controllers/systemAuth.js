import { AuthService } from '../services/authService.js';
import { generateSystemToken, comparePasswords } from '../utils/auth.js';

const authService = new AuthService();

export const systemLogin = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    const systemAccount = await authService.validateSystemApiKey(apiKey);

    const isValidKey = await comparePasswords(apiKey, systemAccount.api_key);
    if (!isValidKey) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    const token = generateSystemToken(systemAccount.id, systemAccount.permissions);
    res.json({
      token,
      system: {
        id: systemAccount.id,
        name: systemAccount.name,
        permissions: systemAccount.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};