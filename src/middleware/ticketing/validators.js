import { body } from 'express-validator';
import { validateRequest } from '../validateRequest.js';

export const validatePurchaseRequest = [
  body('eventId')
    .isUUID()
    .withMessage('Invalid event ID'),
  
  body('ticketId')
    .isUUID()
    .withMessage('Invalid ticket ID'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  
  validateRequest
];

export const validateTicketValidation = [
  body('qrCode')
    .notEmpty()
    .withMessage('QR code is required')
    .isString()
    .withMessage('QR code must be a string')
    .isBase64()
    .withMessage('Invalid QR code format')
    .isLength({ max: 10000 })
    .withMessage('QR code too large'),
  
  validateRequest
];