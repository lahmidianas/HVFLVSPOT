import { supabase } from './supabase';

/**
 * API client for making authenticated requests to the backend
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_BASE || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the current user's access token
   */
  private async getAccessToken(): Promise<string | null> {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Make an authenticated request to the backend
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    return response;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  // Event API methods
  async searchEvents(params: {
    keywords?: string;
    category?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await this.makeRequest(`/events/search?${searchParams}`);
    return this.handleResponse(response);
  }

  async getEventDetails(eventId: string) {
    const response = await this.makeRequest(`/events/${eventId}`);
    return this.handleResponse(response);
  }

  async getEventTickets(eventId: string) {
    const response = await this.makeRequest(`/events/${eventId}/tickets`);
    return this.handleResponse(response);
  }

  async getRecommendedEvents(params: { limit?: number; offset?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await this.makeRequest(`/events/recommended?${searchParams}`);
    return this.handleResponse(response);
  }

  // Ticket API methods (backend – some are unused now but kept for later)
  async purchaseTicket(data: { eventId: string; ticketId: string; quantity?: number }) {
    const response = await this.makeRequest('/tickets/purchase', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async validateTicket(qrCode: string) {
    const response = await this.makeRequest('/tickets/validate', {
      method: 'POST',
      body: JSON.stringify({ qrCode })
    });
    return this.handleResponse(response);
  }

  async getUserTickets() {
    // OLD backend endpoint – not used anymore by the frontend wallet
    const response = await this.makeRequest('/tickets/view');
    return this.handleResponse(response);
  }

  // Payment API methods (legacy)
  async processPayment(data: { eventId: string; ticketId: string; amount: number }) {
    const response = await this.makeRequest('/payment/process', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async processRefund(transactionId: string) {
    const response = await this.makeRequest('/payment/refund', {
      method: 'POST',
      body: JSON.stringify({ transactionId })
    });
    return this.handleResponse(response);
  }

  async getTransactionHistory(params: {
    type?: 'user' | 'organizer';
    page?: number;
    limit?: number;
    status?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await this.makeRequest(`/payment/history?${searchParams}`);
    return this.handleResponse(response);
  }

  // Notification API methods
  async sendNotification(data: {
    userId: string;
    type: string;
    content: string;
    channel: string;
  }) {
    const response = await this.makeRequest('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getNotificationPreferences() {
    const response = await this.makeRequest('/notifications/preferences');
    return this.handleResponse(response);
  }

  async updateNotificationPreferences(preferences: {
    booking_enabled?: boolean;
    payment_enabled?: boolean;
    marketing_enabled?: boolean;
    reminder_enabled?: boolean;
    preferred_channel?: string;
  }) {
    const response = await this.makeRequest('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
    return this.handleResponse(response);
  }

  // Organizer API methods
  async createEvent(eventData: {
    title: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    category_id?: string;
    price: number;
    capacity: number;
    image_url?: string;
    tickets?: Array<{
      type: string;
      price: number;
      quantity: number;
    }>;
  }) {
    const response = await this.makeRequest('/organizer/events/create', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    return this.handleResponse(response);
  }

  async updateEvent(
    eventId: string,
    eventData: Partial<{
      title: string;
      description: string;
      location: string;
      start_date: string;
      end_date: string;
      category_id: string;
      price: number;
      capacity: number;
      image_url: string;
      tickets: Array<{
        type: string;
        price: number;
        quantity: number;
      }>;
    }>
  ) {
    const response = await this.makeRequest(`/organizer/events/${eventId}/update`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
    return this.handleResponse(response);
  }

  async getEventStats(eventId: string) {
    const response = await this.makeRequest(`/organizer/events/${eventId}/stats`);
    return this.handleResponse(response);
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

/**
 * Direct Supabase implementation for user tickets.
 * This is what the wallet page & Refresh button will use.
 */
async function getUserTicketsFromSupabase() {
  // 1) Get current session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('[ticketApi] getSession error', sessionError.message);
    const err: any = new Error('Unable to get session');
    err.status = 401;
    throw err;
  }

  const session = sessionData.session;
  if (!session) {
    const err: any = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }

  const userId = session.user.id;

  // 2) Load bookings + related event + ticket
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      quantity,
      total_price,
      status,
      created_at,
      events:events (
        id,
        title,
        description,
        start_date,
        location,
        image_url
      ),
      tickets:tickets (
        id,
        type,
        price
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ticketApi] failed to load user tickets', error.message);
    const err: any = new Error('Unable to load tickets');
    err.status = 500;
    throw err;
  }

  return data ?? [];
}

// Export individual API functions for convenience
export const eventApi = {
  search: (params: Parameters<ApiClient['searchEvents']>[0]) =>
    apiClient.searchEvents(params),
  getRecommended: (params?: Parameters<ApiClient['getRecommendedEvents']>[0]) =>
    apiClient.getRecommendedEvents(params),
  getDetails: (eventId: string) => apiClient.getEventDetails(eventId),
  getTickets: (eventId: string) => apiClient.getEventTickets(eventId)
};

export const ticketApi = {
  purchase: (data: Parameters<ApiClient['purchaseTicket']>[0]) =>
    apiClient.purchaseTicket(data),
  validate: (qrCode: string) => apiClient.validateTicket(qrCode),
  // 🔥 IMPORTANT: Wallet uses this – it now reads directly from Supabase 'bookings'
  getUserTickets: () => getUserTicketsFromSupabase()
};

export const paymentApi = {
  process: (data: Parameters<ApiClient['processPayment']>[0]) =>
    apiClient.processPayment(data),
  refund: (transactionId: string) => apiClient.processRefund(transactionId),
  getHistory: (params?: Parameters<ApiClient['getTransactionHistory']>[0]) =>
    apiClient.getTransactionHistory(params)
};

export const notificationApi = {
  send: (data: Parameters<ApiClient['sendNotification']>[0]) =>
    apiClient.sendNotification(data),
  getPreferences: () => apiClient.getNotificationPreferences(),
  updatePreferences: (preferences: Parameters<ApiClient['updateNotificationPreferences']>[0]) =>
    apiClient.updateNotificationPreferences(preferences)
};

export const organizerApi = {
  createEvent: (eventData: Parameters<ApiClient['createEvent']>[0]) =>
    apiClient.createEvent(eventData),
  updateEvent: (eventId: string, eventData: Parameters<ApiClient['updateEvent']>[1]) =>
    apiClient.updateEvent(eventId, eventData),
  getEventStats: (eventId: string) => apiClient.getEventStats(eventId)
};
