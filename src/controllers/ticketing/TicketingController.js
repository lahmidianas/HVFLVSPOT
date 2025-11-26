import { TicketingService } from '../../services/ticketing/TicketingService.js';

export class TicketingController {
  constructor() {
    this.ticketingService = new TicketingService();
  }

  async purchaseTicket(req, res, next) {
    try {
      const { eventId, ticketId, quantity } = req.body;
      const userId = req.user.id;

      const booking = await this.ticketingService.purchaseTicket({
        userId,
        eventId,
        ticketId,
        quantity
      });

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async getUserTickets(req, res, next) {
    try {
      const userId = req.user.id;
      const tickets = await this.ticketingService.getUserTickets(userId);
      res.json(tickets);
    } catch (error) {
      next(error);
    }
  }

  async validateTicket(req, res, next) {
    try {
      const { qrCode } = req.body;
      const result = await this.ticketingService.validateTicket(qrCode);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}