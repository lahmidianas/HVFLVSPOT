import { body, query } from 'express-validator';
import { validateRequest } from './validateRequest.js';

export const validatePaymentRequest = [
  body('eventId')
    .isUUID()
    .withMessage('Invalid event ID'),
  body('ticketId')
    .isUUID()
    .withMessage('Invalid ticket ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  validateRequest
];

export const validateRefundRequest = [
  body('transactionId')
    .isUUID()
    .withMessage('Invalid transaction ID'),
  validateRequest
];

export const validateHistoryRequest = [
  query('type')
    .optional()
    .isIn(['user', 'organizer'])
    .withMessage('Invalid type'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be greater than 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid status'),
  query('transactionType')
    .optional()
    .isIn(['payment', 'refund', 'payout'])
    .withMessage('Invalid transaction type'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  validateRequest
];