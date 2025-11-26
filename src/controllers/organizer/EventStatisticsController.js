import { EventStatisticsService } from '../../services/organizer/EventStatisticsService.js';

export class EventStatisticsController {
  constructor() {
    this.statisticsService = new EventStatisticsService();
  }

  async getEventStats(req, res, next) {
    try {
      const organizerId = req.user.id;
      const { eventId } = req.params;

      const stats = await this.statisticsService.getEventStats(organizerId, eventId);
      res.json(stats);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('unauthorized')) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }
}