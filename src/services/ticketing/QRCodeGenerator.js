import QRCode from 'qrcode';
import crypto from 'crypto';

export class QRCodeGenerator {
  async generate(ticketData) {
    try {
      console.log('Generating QR code for ticket:', ticketData);
      
      const ticketUuid = crypto.randomUUID();
      const payload = this.createPayload(ticketUuid, ticketData);
      const signature = this.generateSignature(payload);
      
      // Create the final data object
      const qrData = {
        ...payload,
        sig: signature
      };

      // Convert to JSON and encode to base64
      const jsonData = JSON.stringify(qrData);
      const base64Data = Buffer.from(jsonData).toString('base64');

      console.log('Generated QR payload:', {
        ticketUuid,
        userId: payload.uid,
        eventId: payload.eid,
        signature: signature.substring(0, 8) + '...' // Log only part of the signature
      });

      // Generate QR code with the base64 data directly (no data URL)
      const qrCode = base64Data;

      return { qrCode, signature };
    } catch (error) {
      console.error('QR code generation failed:', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  createPayload(ticketUuid, ticketData) {
    return {
      tid: ticketUuid,
      uid: ticketData.userId,
      eid: ticketData.eventId,
      tkid: ticketData.ticketId,
      qty: ticketData.quantity,
      price: ticketData.price,
      ts: ticketData.purchaseDate,
      exp: new Date(ticketData.purchaseDate).getTime() + (24 * 60 * 60 * 1000)
    };
  }

  generateSignature(payload) {
    const data = Object.entries(payload)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    return crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(data)
      .digest('hex');
  }
}