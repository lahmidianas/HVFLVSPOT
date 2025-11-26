import express from 'express';
import { verifySupabaseToken, authorizeSupabaseRoles } from '../../middleware/supabaseAuth.js';
import { EventManagementController } from '../../controllers/organizer/EventManagementController.js';
import { EventStatisticsController } from '../../controllers/organizer/EventStatisticsController.js';
import {
  validateCreateEvent,
  validateUpdateEvent,
  validateEventStats
} from '../../middleware/organizer/eventValidators.js';

const router = express.Router();
const managementController = new EventManagementController();
const statisticsController = new EventStatisticsController();

// Bind controller methods to maintain 'this' context
const createEvent = managementController.createEvent.bind(managementController);
const updateEvent = managementController.updateEvent.bind(managementController);
const getEventStats = statisticsController.getEventStats.bind(statisticsController);

// Apply authentication and authorization middleware
router.use(verifySupabaseToken, authorizeSupabaseRoles('Organizer'));

// Event management routes
router.post('/create', validateCreateEvent, createEvent);
router.put('/:eventId/update', validateUpdateEvent, updateEvent);
router.get('/:eventId/stats', validateEventStats, getEventStats);

export default router;