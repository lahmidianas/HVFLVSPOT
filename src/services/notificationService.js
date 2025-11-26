import { supabase } from '../lib/supabase.js';
import { 
  sendEmail, 
  sendPushNotification, 
  sendSMS 
} from '../utils/notificationUtils.js';

export class NotificationService {
  async sendNotification({ userId, type, content, channel }) {
    try {
      // Get user preferences
      const { data: userPrefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefsError) throw prefsError;

      // Check if user has enabled this type of notification
      if (!userPrefs[`${type}_enabled`]) {
        return { status: 'skipped', reason: 'notification type disabled by user' };
      }

      // Get user contact information
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, phone, device_tokens')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      let deliveryResult;

      // Send notification based on channel preference
      switch (channel) {
        case 'email':
          if (user.email) {
            deliveryResult = await sendEmail(user.email, content);
          }
          break;

        case 'push':
          if (user.device_tokens?.length > 0) {
            deliveryResult = await sendPushNotification(user.device_tokens, content);
          }
          break;

        case 'sms':
          if (user.phone) {
            deliveryResult = await sendSMS(user.phone, content);
          }
          break;

        default:
          throw new Error('Invalid notification channel');
      }

      // Record notification
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          content,
          channel,
          status: deliveryResult.success ? 'delivered' : 'failed',
          error: deliveryResult.error
        })
        .select()
        .single();

      if (notifError) throw notifError;

      return notification;
    } catch (error) {
      throw error;
    }
  }

  async updatePreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Return default preferences if none exist
      if (!data) {
        return {
          user_id: userId,
          booking_enabled: true,
          payment_enabled: true,
          marketing_enabled: true,
          reminder_enabled: true,
          preferred_channel: 'email'
        };
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}