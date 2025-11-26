import { query } from 'express-validator';
import { validateRequest } from '../validateRequest.js';

export const validateRecommendationRequest = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),

  validateRequest
];