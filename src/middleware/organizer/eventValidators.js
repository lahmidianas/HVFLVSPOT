import { body, param } from 'express-validator';
import { validateRequest } from '../validateRequest.js';

export const validateCreateEvent = [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),

  body('description')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),

  body('location')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Location is required'),

  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),

  body('end_date')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),

  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),

  body('tickets')
    .optional()
    .isArray()
    .withMessage('Tickets must be an array'),

  body('tickets.*.type')
    .if(body('tickets').exists())
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Ticket type is required'),

  body('tickets.*.price')
    .if(body('tickets').exists())
    .isFloat({ min: 0 })
    .withMessage('Ticket price must be a positive number'),

  body('tickets.*.quantity')
    .if(body('tickets').exists())
    .isInt({ min: 1 })
    .withMessage('Ticket quantity must be a positive integer'),

  validateRequest
];

export const validateUpdateEvent = [
  param('eventId')
    .isUUID()
    .withMessage('Event ID must be a valid UUID'),

  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),

  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),

  body('location')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty'),

  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),

  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),

  validateRequest
];

export const validateEventStats = [
  param('eventId')
    .isUUID()
    .withMessage('Invalid event ID'),
  validateRequest
];