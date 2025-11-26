import express from 'express';
import { verifySupabaseToken } from '../middleware/supabaseAuth.js';
import { NotificationController } from '../controllers/notification/NotificationController.js';
import {
  validateNotificationRequest,
  validatePreferencesRequest
} from '../middleware/notification/validators.js';

const router = express.Router();
const controller = new NotificationController();

// Bind controller methods to maintain 'this' context
const sendNotification = controller.sendNotification.bind(controller);
const updatePreferences = controller.updatePreferences.bind(controller);
const getPreferences = controller.getPreferences.bind(controller);

router.post('/send', verifySupabaseToken, validateNotificationRequest, sendNotification);
router.put('/preferences', verifySupabaseToken, validatePreferencesRequest, updatePreferences);
router.get('/preferences', verifySupabaseToken, getPreferences);

export default router;