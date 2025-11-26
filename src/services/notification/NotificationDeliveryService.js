import { 
  EmailProvider,
  PushProvider,
  SMSProvider 
} from '../../utils/notification/providers/index.js';
import { NotificationChannel } from '../../utils/notification/constants.js';

/**
 * Handles the delivery of notifications through different channels
 */
export class NotificationDeliveryService {
  constructor() {
    this.providers = {
      [NotificationChannel.EMAIL]: new EmailProvider(),
      [NotificationChannel.PUSH]: new PushProvider(),
      [NotificationChannel.SMS]: new SMSProvider()
    };
  }

  /**
   * Deliver a notification through the specified channel
   * @param {Object} params Delivery parameters
   * @param {Object} params.user User contact information
   * @param {string} params.channel Delivery channel
   * @param {string} params.content Notification content
   * @returns {Promise<Object>} Delivery result
   */
  async deliver({ user, channel, content }) {
    const provider = this.providers[channel];
    if (!provider) {
      throw new Error(`Unsupported notification channel: ${channel}`);
    }

    return await provider.send({
      recipient: this.getRecipientForChannel(user, channel),
      content
    });
  }

  /**
   * Get the appropriate recipient information for the channel
   * @private
   */
  getRecipientForChannel(user, channel) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return user.email;
      case NotificationChannel.PUSH:
        return user.device_tokens;
      case NotificationChannel.SMS:
        return user.phone;
      default:
        throw new Error(`Invalid channel: ${channel}`);
    }
  }
}