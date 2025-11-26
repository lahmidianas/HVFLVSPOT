import { supabase } from '../../lib/supabase.js';
import { supabaseAdmin } from '../../lib/supabase.js';
import { NotificationChannel } from '../../utils/notification/constants.js';

export class PreferencesService {
  constructor() {
    // Use admin client for operations that need to bypass RLS
    this.client = supabaseAdmin || supabase;
  }

  async getPreferences(userId) {
    try {
      const { data, error } = await this.client
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data || await this.createDefaultPreferences(userId);
    } catch (error) {
      throw new Error(`Failed to get preferences: ${error.message}`);
    }
  }

  async updatePreferences(userId, preferences) {
    try {
      // First check if preferences exist
      const existing = await this.getPreferences(userId);
      
      const { data, error } = await this.client
        .from('notification_preferences')
        .upsert({
          id: existing?.id, // Include existing ID if it exists
          user_id: userId,
          ...existing, // Include existing preferences as base
          ...preferences, // Override with new preferences
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }

  async createDefaultPreferences(userId) {
    const defaults = {
      user_id: userId,
      booking_enabled: true,
      payment_enabled: true,
      marketing_enabled: false,
      reminder_enabled: true,
      preferred_channel: NotificationChannel.EMAIL
    };

    const { data, error } = await this.client
      .from('notification_preferences')
      .insert(defaults)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async isNotificationEnabled(userId, type) {
    const prefs = await this.getPreferences(userId);
    return prefs ? prefs[`${type}_enabled`] : false;
  }

  async getPreferredChannel(userId) {
    const prefs = await this.getPreferences(userId);
    return prefs ? prefs.preferred_channel : NotificationChannel.EMAIL;
  }
}