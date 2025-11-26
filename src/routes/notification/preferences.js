import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { PreferencesController } from '../../controllers/notification/PreferencesController.js';
import { validatePreferencesUpdate } from '../../middleware/notification/preferenceValidators.js';

const router = express.Router();
const controller = new PreferencesController();

// Bind controller methods to maintain 'this' context
const getPreferences = controller.getPreferences.bind(controller);
const updatePreferences = controller.updatePreferences.bind(controller);

// Get user preferences
router.get('/', authenticateToken, getPreferences);

// Update user preferences
router.put('/', authenticateToken, validatePreferencesUpdate, updatePreferences);

export default router;