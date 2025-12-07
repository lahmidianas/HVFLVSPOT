import { supabase } from '../../lib/server/supabaseAdmin.js';
import { supabaseAdmin } from '../../lib/server/supabaseAdmin.js';
import { generateSlug } from '../../utils/eventUtils.js';

export class EventManagementService {
  constructor() {
    // Use admin client for operations that need to bypass RLS
    this.client = supabaseAdmin || supabase;
  }

  async createEvent(userId, eventData) {
    try {
      // First verify the user has an organizer profile
      const { data: organizer, error: organizerError } = await this.client
        .from('organizers')
        .select('id, verified')
        .eq('user_id', userId)
        .single();

      if (organizerError || !organizer) {
        throw new Error('User does not have an organizer profile');
      }

      if (!organizer.verified) {
        throw new Error('Organizer profile must be verified to create events');
      }

      // Generate slug from title
      const slug = await generateSlug(eventData.title);

      // Create event
      const { data: event, error } = await this.client
        .from('events')
        .insert({
          title: eventData.title,
          slug,
          description: eventData.description,
          location: eventData.location,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          category_id: eventData.category_id,
          organizer_id: userId,
          price: eventData.price,
          capacity: eventData.capacity,
          image_url: eventData.image_url
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create event: ${error.message}`);
      }

      // Fetch related data separately
      const [categoryData, organizerData] = await Promise.all([
        eventData.category_id ? this.client
          .from('categories')
          .select('name, slug')
          .eq('id', eventData.category_id)
          .single() : { data: null },
        this.client
          .from('organizers')
          .select('company_name, contact_email, website_url')
          .eq('user_id', userId)
          .single()
      ]);

      // Combine the data
      const enrichedEvent = {
        ...event,
        categories: categoryData.data,
        organizer: organizerData.data
      };

      // Create ticket types if provided
      if (eventData.tickets && Array.isArray(eventData.tickets)) {
        const { error: ticketError } = await this.client
          .from('tickets')
          .insert(
            eventData.tickets.map(ticket => ({
              event_id: event.id,
              type: ticket.type,
              price: ticket.price,
              quantity: ticket.quantity
            }))
          );

        if (ticketError) {
          // Rollback event creation
          await this.client
            .from('events')
            .delete()
            .eq('id', event.id);
          throw new Error(`Failed to create ticket types: ${ticketError.message}`);
        }
      }

      return enrichedEvent;
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  async updateEvent(userId, eventId, eventData) {
    try {
      // First verify event ownership
      const { data: event, error: eventError } = await this.client
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('organizer_id', userId)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found or unauthorized');
      }

      // Update event
      const { data: updatedEvent, error: updateError } = await this.client
        .from('events')
        .update({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          category_id: eventData.category_id,
          price: eventData.price,
          capacity: eventData.capacity,
          image_url: eventData.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select('*')
        .single();

      if (updateError) {
        throw new Error(`Failed to update event: ${updateError.message}`);
      }

      // Update ticket types if provided
      if (eventData.tickets && Array.isArray(eventData.tickets)) {
        // Delete existing tickets
        await this.client
          .from('tickets')
          .delete()
          .eq('event_id', eventId);

        // Create new tickets
        const { error: ticketError } = await this.client
          .from('tickets')
          .insert(
            eventData.tickets.map(ticket => ({
              event_id: eventId,
              type: ticket.type,
              price: ticket.price,
              quantity: ticket.quantity
            }))
          );

        if (ticketError) {
          throw new Error(`Failed to update ticket types: ${ticketError.message}`);
        }
      }

      return updatedEvent;
    } catch (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }
  // ... rest of the service methods remain the same
}
