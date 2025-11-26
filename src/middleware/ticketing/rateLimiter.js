import { rateLimit } from 'express-rate-limit';

// Rate limiter for ticket validation
export const ticketValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 validation requests per window
  message: {
    error: 'Too many validation attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});