import { body } from 'express-validator';
import { validateRequest } from '../validateRequest.js';
import { NotificationChannel } from '../../utils/notification/constants.js';

export const validatePreferencesUpdate = [
  body('booking_enabled')
    .optional()
    .isBoolean()
    .withMessage('Booking notifications enabled must be a boolean'),
  
  body('payment_enabled')
    .optional()
    .isBoolean()
    .withMessage('Payment notifications enabled must be a boolean'),
  
  body('marketing_enabled')
    .optional()
    .isBoolean()
    .withMessage('Marketing notifications enabled must be a boolean'),
  
  body('reminder_enabled')
    .optional()
    .isBoolean()
    .withMessage('Reminder notifications enabled must be a boolean'),
  
  body('preferred_channel')
    .optional()
    .isIn(Object.values(NotificationChannel))
    .withMessage(`Preferred channel must be one of: ${Object.values(NotificationChannel).join(', ')}`),
  
  validateRequest
];