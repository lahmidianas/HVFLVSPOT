import express from 'express';
import { verifySupabaseToken } from '../../middleware/supabaseAuth.js';
import { TicketingController } from '../../controllers/ticketing/TicketingController.js';
import { validatePurchaseRequest, validateTicketValidation } from '../../middleware/ticketing/validators.js';
import { ticketValidationLimiter } from '../../middleware/ticketing/rateLimiter.js';

const router = express.Router();
const controller = new TicketingController();

// Bind controller methods to maintain 'this' context
const purchaseTicket = controller.purchaseTicket.bind(controller);
const getUserTickets = controller.getUserTickets.bind(controller);
const validateTicket = controller.validateTicket.bind(controller);

// Purchase ticket
router.post('/purchase', 
  verifySupabaseToken,
  validatePurchaseRequest,
  purchaseTicket
);

// Get user's tickets
router.get('/view',
  verifySupabaseToken,
  getUserTickets
);

// Validate ticket
router.post('/validate',
  verifySupabaseToken,
  ticketValidationLimiter,
  validateTicketValidation,
  validateTicket
);

export default router;