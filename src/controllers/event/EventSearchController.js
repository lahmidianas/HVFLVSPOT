import { EventSearchService } from '../../services/event/EventSearchService.js';

import { verifySupabaseToken } from '../../middleware/supabaseAuth.js';
import { validateSearchRequest } from '../../middleware/event/searchValidators.js';

export class EventSearchController {
  constructor() {
    this.eventSearchService = new EventSearchService();
  }

  searchEvents = async (req, res, next) => {
    try {
      // Apply middleware
      await new Promise((resolve, reject) => {
        validateSearchRequest[validateSearchRequest.length - 1](req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      const {
        keywords,
        category,
        location,
        startDate,
        endDate,
        minPrice,
        maxPrice,
        page,
        limit
      } = req.query;

      const result = await this.eventSearchService.searchEvents({
        keywords,
        category,
        location,
        startDate,
        endDate,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}