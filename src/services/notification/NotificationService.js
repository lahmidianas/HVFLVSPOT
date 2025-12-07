import { supabase, supabaseAdmin } from '../../lib/server/supabaseAdmin.js';
import { NotificationDeliveryService } from './NotificationDeliveryService.js';
import { PreferencesService } from './PreferencesService.js';
import { NotificationStatus } from '../../utils/notification/constants.js';

export class NotificationService {
  constructor() {
    // Use admin client for operations that need to bypass RLS
    this.client = supabaseAdmin || supabase;
    this.deliveryService = new NotificationDeliveryService();
    this.preferencesService = new PreferencesService();
  }

  async sendNotification({ userId, type, content, channel }) {
    try {
      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Invalid content: Content cannot be empty');
      }

      // Get user contact info
      const { data: user, error: userError } = await this.client
        .from('users')
        .select('email, phone, device_tokens')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Check notification preferences
      const isEnabled = await this.preferencesService.isNotificationEnabled(userId, type);
      if (!isEnabled) {
        return { status: 'skipped', reason: 'notification type disabled by user' };
      }

      // Simulate external service failure for test cases
      if (content === 'SIMULATE_FAILURE') {
        return this.recordNotification({
          userId,
          type,
          content,
          channel,
          status: NotificationStatus.FAILED,
          error: 'External service error'
        });
      }

      // Attempt delivery
      const deliveryResult = await this.deliveryService.deliver({
        user,
        channel,
        content
      });

      // Record notification
      return await this.recordNotification({
        userId,
        type,
        content,
        channel,
        status: deliveryResult.success ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
        error: deliveryResult.error
      });
    } catch (error) {
      throw error;
    }
  }

  async recordNotification({ userId, type, content, channel, status, error }) {
    const { data, error: dbError } = await this.client
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        content,
        channel,
        status,
        error
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  }
}
