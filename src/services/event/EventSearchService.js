import { supabase } from '../../lib/supabase.js';

export class EventSearchService {
  async searchEvents({
    keywords,
    category,
    location,
    startDate,
    endDate,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10
  }) {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `, { count: 'exact' });

      // Full-text search if keywords provided
      if (keywords) {
        query = query.textSearch('search_vector', keywords, {
          type: 'websearch',
          config: 'english'
        });
      }

      // Apply filters
      if (category) {
        query = query.eq('category_id', category);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      if (startDate) {
        query = query.gte('start_date', startDate);
      }

      if (endDate) {
        query = query.lte('end_date', endDate);
      }

      if (minPrice !== undefined) {
        query = query.gte('price', minPrice);
      }

      if (maxPrice !== undefined) {
        query = query.lte('price', maxPrice);
      }

      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Execute query with pagination
      const { data, error, count } = await query
        .order('start_date', { ascending: true })
        .range(from, to);

      if (error) throw error;

      return {
        events: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to search events: ${error.message}`);
    }
  }
}