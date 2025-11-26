import { supabase } from '../../lib/supabase.js';

export class EventRecommendationService {
  async getRecommendedEvents(userId, { limit = 10, offset = 0 }) {
    try {
      // Get user's event history and preferences
      const [bookingHistory, preferences] = await Promise.all([
        this.getUserEventHistory(userId),
        this.getUserPreferences(userId)
      ]);

      // Build recommendation query
      let query = supabase
        .from('events')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .gte('start_date', new Date().toISOString())
        .limit(limit)
        .range(offset, offset + limit - 1);

      // Apply category preferences if available
      if (preferences?.preferred_categories?.length > 0) {
        query = query.in('category_id', preferences.preferred_categories);
      }

      // Exclude events user has already booked
      if (bookingHistory.length > 0) {
        query = query.not('id', 'in', bookingHistory);
      }

      // Get results
      const { data: events, error } = await query;
      if (error) throw error;

      // Score and sort events
      const scoredEvents = await this.scoreEvents(events, preferences, bookingHistory);

      return {
        events: scoredEvents,
        metadata: {
          total: scoredEvents.length,
          hasMore: scoredEvents.length === limit
        }
      };
    } catch (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
  }

  async getUserEventHistory(userId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('event_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(booking => booking.event_id);
  }

  async getUserPreferences(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.metadata || {};
  }

  async scoreEvents(events, preferences, history) {
    return events
      .map(event => {
        let score = 0;

        // Base score starts at 1
        score += 1;

        // Boost score based on category match
        if (preferences?.preferred_categories?.includes(event.category_id)) {
          score += 2;
        }

        // Boost score based on location match
        if (preferences?.preferred_locations?.includes(event.location)) {
          score += 1.5;
        }

        // Boost score based on price range match
        if (preferences?.max_price && event.price <= preferences.max_price) {
          score += 1;
        }

        // Boost score for events happening sooner
        const daysUntilEvent = Math.ceil(
          (new Date(event.start_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        score += Math.max(0, (30 - daysUntilEvent) / 30);

        return { ...event, _score: score };
      })
      .sort((a, b) => b._score - a._score);
  }
}