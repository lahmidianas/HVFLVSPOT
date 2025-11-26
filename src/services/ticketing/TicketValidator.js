import { supabase } from '../../lib/supabase.js';
import crypto from 'crypto';

export class TicketValidator {
  async validate(qrCode) {
    try {
      console.log('Starting ticket validation');
      
      if (!qrCode) {
        return {
          isValid: false,
          reason: 'No QR code provided'
        };
      }

      // Extract and decode QR data
      const qrData = await this.parseQRCode(qrCode);
      console.log('Parsed QR data:', {
        ticketId: qrData.tid,
        userId: qrData.uid,
        eventId: qrData.eid,
        signature: qrData.sig.substring(0, 8) + '...' // Log only part of the signature
      });

      // Verify signature
      if (!this.verifySignature(qrData)) {
        console.log('Signature verification failed');
        return {
          isValid: false,
          reason: 'Invalid ticket signature'
        };
      }

      // Check expiration
      if (this.isExpired(qrData.exp)) {
        console.log('Ticket has expired');
        return {
          isValid: false,
          reason: 'Ticket has expired'
        };
      }

      // Verify booking
      const bookingResult = await this.verifyBooking(qrData);
      console.log('Booking verification result:', bookingResult);
      
      return bookingResult;
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        reason: `Validation failed: ${error.message}`
      };
    }
  }

  async parseQRCode(qrCode) {
    try {
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(qrCode)) {
        throw new Error('Invalid base64 format');
      }

      // Decode base64 to string
      const jsonString = Buffer.from(qrCode, 'base64').toString('utf-8');
      
      // Parse JSON
      const data = JSON.parse(jsonString);
      
      // Validate required fields
      const requiredFields = ['tid', 'uid', 'eid', 'tkid', 'qty', 'price', 'ts', 'exp', 'sig'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate field types
      if (!this.validateFieldTypes(data)) {
        throw new Error('Invalid field types in ticket data');
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to parse QR code: ${error.message}`);
    }
  }

  validateFieldTypes(data) {
    return (
      typeof data.tid === 'string' &&
      typeof data.uid === 'string' &&
      typeof data.eid === 'string' &&
      typeof data.tkid === 'string' &&
      typeof data.qty === 'number' &&
      typeof data.price === 'number' &&
      typeof data.ts === 'string' &&
      typeof data.exp === 'number' &&
      typeof data.sig === 'string'
    );
  }

  verifySignature(qrData) {
    try {
      const { sig, ...payload } = qrData;
      const data = Object.entries(payload)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');

      const expectedSignature = crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(data)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  isExpired(expirationTime) {
    return new Date().getTime() > expirationTime;
  }

  async verifyBooking(qrData) {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        events (
          title,
          start_date
        ),
        tickets (
          type
        )
      `)
      .eq('qr_code', Buffer.from(JSON.stringify({
        tid: qrData.tid,
        uid: qrData.uid,
        eid: qrData.eid,
        tkid: qrData.tkid,
        qty: qrData.qty,
        price: qrData.price,
        ts: qrData.ts,
        exp: qrData.exp,
        sig: qrData.sig
      })).toString('base64'))
      .single();

    if (error || !booking) {
      return {
        isValid: false,
        reason: 'Ticket not found in database'
      };
    }

    return {
      isValid: booking.status === 'confirmed',
      booking: {
        id: booking.id,
        eventTitle: booking.events.title,
        eventDate: booking.events.start_date,
        ticketType: booking.tickets.type,
        quantity: booking.quantity,
        status: booking.status
      }
    };
  }
}