import { EventManagementService } from '../../services/organizer/EventManagementService.js';
import { validateEventData } from '../../utils/eventValidation.js';

export class EventManagementController {
  constructor() {
    this.eventManagementService = new EventManagementService();
  }

  async createEvent(req, res, next) {
    try {
      const organizerId = req.user.id;
      const eventData = req.body;

      // Validate event data
      const validationResult = validateEventData(eventData);
      if (!validationResult.isValid) {
        return res.status(400).json({
          message: 'Invalid event data',
          errors: validationResult.errors
        });
      }

      // Validate ticket data if provided
      if (eventData.tickets) {
        if (!Array.isArray(eventData.tickets)) {
          return res.status(400).json({
            message: 'Invalid ticket data',
            errors: [{ field: 'tickets', message: 'Tickets must be an array' }]
          });
        }

        for (const ticket of eventData.tickets) {
          if (!ticket.type || !ticket.price || !ticket.quantity) {
            return res.status(400).json({
              message: 'Invalid ticket data',
              errors: [{ field: 'tickets', message: 'Each ticket must have type, price, and quantity' }]
            });
          }
        }
      }

      const event = await this.eventManagementService.createEvent(organizerId, eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error.message.includes('not have an organizer profile')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('must be verified')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const organizerId = req.user.id;
      const { eventId } = req.params;
      const eventData = req.body;

      // Validate event data
      const validationResult = validateEventData(eventData, true);
      if (!validationResult.isValid) {
        return res.status(400).json({
          message: 'Invalid event data',
          errors: validationResult.errors
        });
      }

      // Validate ticket data if provided
      if (eventData.tickets) {
        if (!Array.isArray(eventData.tickets)) {
          return res.status(400).json({
            message: 'Invalid ticket data',
            errors: [{ field: 'tickets', message: 'Tickets must be an array' }]
          });
        }

        for (const ticket of eventData.tickets) {
          if (!ticket.type || !ticket.price || !ticket.quantity) {
            return res.status(400).json({
              message: 'Invalid ticket data',
              errors: [{ field: 'tickets', message: 'Each ticket must have type, price, and quantity' }]
            });
          }
        }
      }

      const event = await this.eventManagementService.updateEvent(organizerId, eventId, eventData);
      res.json(event);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('unauthorized')) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }
}