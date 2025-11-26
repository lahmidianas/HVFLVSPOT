import { query } from 'express-validator';
import { validateRequest } from '../validateRequest.js';

export const validateSearchRequest = [
  query('keywords')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Keywords must be at least 2 characters long'),

  query('category')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),

  query('location')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && value < req.query.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .custom((value, { req }) => {
      const minPrice = req.query.minPrice;
      if (minPrice && parseFloat(value) <= parseFloat(minPrice)) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be greater than 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  validateRequest
];