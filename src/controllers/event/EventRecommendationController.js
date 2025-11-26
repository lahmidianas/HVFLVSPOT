import { EventRecommendationService } from '../../services/event/EventRecommendationService.js';

import { verifySupabaseToken } from '../../middleware/supabaseAuth.js';
import { validateRecommendationRequest } from '../../middleware/event/recommendationValidators.js';

export class EventRecommendationController {
  constructor() {
    this.recommendationService = new EventRecommendationService();
  }

  getRecommendedEvents = async (req, res, next) => {
    try {
      // Apply authentication middleware
      await new Promise((resolve, reject) => {
        verifySupabaseToken(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Apply validation middleware
      await new Promise((resolve, reject) => {
        validateRecommendationRequest[validateRecommendationRequest.length - 1](req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      const userId = req.user.id;
      const { limit, offset } = req.query;

      const recommendations = await this.recommendationService.getRecommendedEvents(
        userId,
        {
          limit: parseInt(limit) || 10,
          offset: parseInt(offset) || 0
        }
      );

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  };
}