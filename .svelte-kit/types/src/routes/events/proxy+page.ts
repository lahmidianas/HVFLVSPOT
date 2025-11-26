// @ts-nocheck
import { eventApi } from '$lib/api';
import { supabase } from '$lib/supabase';
import type { PageLoad } from './$types';

export const load = async ({ url }: Parameters<PageLoad>[0]) => {
  try {
    // Extract search parameters from URL
    const searchParams = {
      keywords: url.searchParams.get('q') || undefined,
      category: url.searchParams.get('category') || undefined,
      location: url.searchParams.get('city') || undefined,
      minPrice: url.searchParams.get('min_price') ? parseFloat(url.searchParams.get('min_price')!) : undefined,
      maxPrice: url.searchParams.get('max_price') ? parseFloat(url.searchParams.get('max_price')!) : undefined,
      startDate: url.searchParams.get('start_date') || undefined,
      endDate: url.searchParams.get('end_date') || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: 12
    };

    // Load categories for filter dropdown (reference data)
    const categoriesPromise = supabase
      .from('categories')
      .select('*')
      .order('name');

    // Search events through backend
    const eventsPromise = eventApi.search(searchParams);

    const [categoriesResult, eventsResult] = await Promise.allSettled([
      categoriesPromise,
      eventsPromise
    ]);

    return {
      events: eventsResult.status === 'fulfilled' ? eventsResult.value.events : [],
      pagination: eventsResult.status === 'fulfilled' ? eventsResult.value.pagination : null,
      categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : [],
      searchParams,
      error: eventsResult.status === 'rejected' ? 'Unable to search events' : null
    };
  } catch (error) {
    return {
      events: [],
      pagination: null,
      categories: [],
      searchParams: {},
      error: 'Unable to load search page'
    };
  }
};