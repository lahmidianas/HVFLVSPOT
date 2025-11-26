import { supabase,supabaseAdmin } from '../../lib/supabase.js';

export class EventStatisticsService {
  async getEventStats(organizerId, eventId) {
    try {
      // First verify event ownership
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('organizer_id', organizerId)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found or unauthorized');
      }

      // Get ticket sales statistics
      const { data: tickets, error: ticketsError } = await supabaseAdmin
        .from('tickets')
        .select(`
          id,
          type,
          price,
          quantity,
          bookings (
            quantity,
            total_price,
            status,
            created_at
          )
        `)
        .eq('event_id', eventId);

      if (ticketsError) throw ticketsError;

      // Calculate statistics
      const stats = this.calculateEventStats(tickets);

      // Get recent bookings
      const { data: recentBookings, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select(`
          id,
          quantity,
          total_price,
          status,
          created_at,
          tickets (
            type
          ),
          users (
            full_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bookingsError) throw bookingsError;

      return {
        event: {
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          capacity: event.capacity
        },
        ticketsSold: stats.totalSold,
        ticketsAvailable: stats.totalAvailable,
        revenue: stats.totalRevenue,
        ticketTypes: stats.ticketTypes,
        salesByDay: stats.salesByDay,
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          ticketType: booking.tickets.type,
          quantity: booking.quantity,
          amount: booking.total_price,
          customerName: booking.users.full_name,
          customerEmail: booking.users.email,
          status: booking.status,
          purchaseDate: booking.created_at
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get event statistics: ${error.message}`);
    }
  }

  calculateEventStats(tickets) {
    const stats = {
      totalSold: 0,
      totalAvailable: 0,
      totalRevenue: 0,
      ticketTypes: {},
      salesByDay: {}
    };

    tickets.forEach(ticket => {
      const soldQuantity = ticket.bookings.reduce((sum, booking) => 
        booking.status === 'confirmed' ? sum + booking.quantity : sum, 0);
      
      const revenue = ticket.bookings.reduce((sum, booking) => 
        booking.status === 'confirmed' ? sum + booking.total_price : sum, 0);

      // Update ticket type stats
      stats.ticketTypes[ticket.type] = {
        sold: soldQuantity,
        available: ticket.quantity - soldQuantity,
        revenue: revenue
      };

      // Update totals
      stats.totalSold += soldQuantity;
      stats.totalAvailable += (ticket.quantity - soldQuantity);
      stats.totalRevenue += revenue;

      // Calculate sales by day
      ticket.bookings.forEach(booking => {
        if (booking.status === 'confirmed') {
          const date = new Date(booking.created_at).toISOString().split('T')[0];
          if (!stats.salesByDay[date]) {
            stats.salesByDay[date] = {
              quantity: 0,
              revenue: 0
            };
          }
          stats.salesByDay[date].quantity += booking.quantity;
          stats.salesByDay[date].revenue += booking.total_price;
        }
      });
    });

    // Convert salesByDay to sorted array
    stats.salesByDay = Object.entries(stats.salesByDay)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return stats;
  }
}