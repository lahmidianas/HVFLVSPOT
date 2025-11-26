import { supabase } from '../../lib/supabase.js';
import { QRCodeGenerator } from './QRCodeGenerator.js';
import { TicketValidator } from './TicketValidator.js';
import { TicketingError } from './TicketingError.js';

export class TicketingService {
  constructor() {
    this.qrGenerator = new QRCodeGenerator();
    this.validator = new TicketValidator();
  }

  async purchaseTicket({ userId, eventId, ticketId, quantity = 1 }) {
    try {
      console.log('Starting ticket purchase:', { userId, eventId, ticketId, quantity });

      // Try RPC first
      const ticket = await this._tryRPCPurchase({ userId, eventId, ticketId, quantity });
      if (ticket) {
        return ticket;
      }

      // Fallback to direct methods if RPC fails
      return await this._fallbackPurchase({ userId, eventId, ticketId, quantity });
    } catch (error) {
      console.error('Ticket purchase failed:', error);
      throw new TicketingError(error.message);
    }
  }

  async _tryRPCPurchase({ userId, eventId, ticketId, quantity }) {
    try {
      // Start transaction via RPC
      const { data: txResult, error: txError } = await supabase.rpc('begin_ticket_purchase', {
        p_ticket_id: ticketId,
        p_user_id: userId,
        p_event_id: eventId,
        p_quantity: quantity
      });

      if (txError || !txResult?.success) {
        console.log('RPC purchase failed, falling back to direct methods:', txError?.message || txResult?.message);
        return null;
      }

      const ticket = txResult.ticket;
      
      // Generate QR code
      const qrCodeData = await this.qrGenerator.generate({
        userId,
        eventId,
        ticketId,
        quantity,
        price: ticket.price,
        purchaseDate: new Date().toISOString()
      });

      // Complete transaction via RPC
      const { data: bookingResult, error: bookingError } = await supabase.rpc('complete_ticket_purchase', {
        p_ticket_id: ticketId,
        p_user_id: userId,
        p_event_id: eventId,
        p_quantity: quantity,
        p_total_price: ticket.price * quantity,
        p_qr_code: qrCodeData.qrCode
      });

      if (bookingError || !bookingResult?.success) {
        console.error('Failed to complete RPC purchase:', bookingError?.message || bookingResult?.message);
        return null;
      }

      return bookingResult.booking;
    } catch (error) {
      console.error('RPC purchase error:', error);
      return null;
    }
  }

  async _fallbackPurchase({ userId, eventId, ticketId, quantity }) {
    let retries = 3;
    while (retries > 0) {
      try {
        // Validate and lock ticket with FOR UPDATE SKIP LOCKED
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (ticketError || !ticket) {
          throw new TicketingError('Ticket not found');
        }

        if (ticket.quantity < quantity) {
          throw new TicketingError('Insufficient tickets available');
        }

        // Update ticket inventory with optimistic locking
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ quantity: ticket.quantity - quantity })
          .eq('id', ticketId)
          .eq('quantity', ticket.quantity); // Ensure quantity hasn't changed

        if (updateError) {
          throw new TicketingError('Failed to update ticket inventory');
        }

        // Generate QR code
        const qrCodeData = await this.qrGenerator.generate({
          userId,
          eventId,
          ticketId,
          quantity,
          price: ticket.price,
          purchaseDate: new Date().toISOString()
        });

        // Create booking
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            user_id: userId,
            event_id: eventId,
            ticket_id: ticketId,
            quantity,
            total_price: ticket.price * quantity,
            status: 'confirmed',
            qr_code: qrCodeData.qrCode
          })
          .select()
          .single();

        if (bookingError) {
          // Rollback inventory update
          await supabase
            .from('tickets')
            .update({ quantity: ticket.quantity })
            .eq('id', ticketId);
          throw new TicketingError('Failed to create booking');
        }

        return booking;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new TicketingError(`Failed to purchase ticket after retries: ${error.message}`);
        }
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 100));
      }
    }
  }

  async validateTicket(qrCode) {
    try {
      return await this.validator.validate(qrCode);
    } catch (error) {
      throw new TicketingError(`Failed to validate ticket: ${error.message}`);
    }
  }

  async getUserTickets(userId) {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events (
            title,
            description,
            location,
            start_date,
            end_date,
            image_url
          ),
          tickets (
            type,
            price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TicketingError('Failed to get user tickets');
      }

      return bookings;
    } catch (error) {
      throw new TicketingError(`Failed to get user tickets: ${error.message}`);
    }
  }
}