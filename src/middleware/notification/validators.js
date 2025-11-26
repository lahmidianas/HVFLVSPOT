import { body } from 'express-validator';
import { validateRequest } from '../validateRequest.js';
import { 
  NotificationType, 
  NotificationChannel 
} from '../../utils/notification/constants.js';

/**
 * Validate notification send request
 */
export const validateNotificationRequest = [
  body('type')
    .isIn(Object.values(NotificationType))
    .withMessage('Invalid notification type'),
  body('content')
    .isString()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 1000 })
    .withMessage('Content too long'),
  body('channel')
    .isIn(Object.values(NotificationChannel))
    .withMessage('Invalid notification channel'),
  validateRequest
];

/**
 * Validate preferences update request
 */
export const validatePreferencesRequest = [
  body('booking_enabled')
    .optional()
    .isBoolean()
    .withMessage('Booking enabled must be boolean'),
  body('payment_enabled')
    .optional()
    .isBoolean()
    .withMessage('Payment enabled must be boolean'),
  body('marketing_enabled')
    .optional()
    .isBoolean()
    .withMessage('Marketing enabled must be boolean'),
  body('reminder_enabled')
    .optional()
    .isBoolean()
    .withMessage('Reminder enabled must be boolean'),
  body('preferred_channel')
    .optional()
    .isIn(Object.values(NotificationChannel))
    .withMessage('Invalid preferred channel'),
  validateRequest
];