import { supabase } from '../../lib/supabase.js';

export class OrganizerService {
  async createOrganizer(userId, organizerData) {
    try {
      // First verify the user exists and doesn't already have an organizer profile
      const { data: existingOrganizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingOrganizer) {
        throw new Error('User already has an organizer profile');
      }

      // Create organizer profile
      const { data: organizer, error } = await supabase
        .from('organizers')
        .insert({
          user_id: userId,
          company_name: organizerData.company_name,
          description: organizerData.description,
          contact_email: organizerData.contact_email,
          contact_phone: organizerData.contact_phone,
          website_url: organizerData.website_url,
          social_media: organizerData.social_media || {},
          business_address: organizerData.business_address,
          tax_id: organizerData.tax_id
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Company name already exists');
        }
        throw error;
      }

      return organizer;
    } catch (error) {
      throw new Error(`Failed to create organizer profile: ${error.message}`);
    }
  }

  async getOrganizerProfile(userId) {
    try {
      const { data: organizer, error } = await supabase
        .from('organizers')
        .select(`
          *,
          users (
            id,
            email,
            role
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return organizer;
    } catch (error) {
      throw new Error(`Failed to get organizer profile: ${error.message}`);
    }
  }

  async updateOrganizerProfile(userId, updates) {
    try {
      const { data: organizer, error } = await supabase
        .from('organizers')
        .update({
          company_name: updates.company_name,
          description: updates.description,
          contact_email: updates.contact_email,
          contact_phone: updates.contact_phone,
          website_url: updates.website_url,
          social_media: updates.social_media,
          business_address: updates.business_address,
          tax_id: updates.tax_id
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Company name already exists');
        }
        throw error;
      }

      return organizer;
    } catch (error) {
      throw new Error(`Failed to update organizer profile: ${error.message}`);
    }
  }

  async getVerifiedOrganizers() {
    try {
      const { data: organizers, error } = await supabase
        .from('organizers')
        .select(`
          *,
          users (
            id,
            email,
            role
          )
        `)
        .eq('verified', true)
        .order('company_name');

      if (error) throw error;
      return organizers;
    } catch (error) {
      throw new Error(`Failed to get verified organizers: ${error.message}`);
    }
  }

  async verifyOrganizer(organizerId, adminUserId) {
    try {
      // First check if the admin user has permission
      const { data: adminUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', adminUserId)
        .single();

      if (!adminUser || adminUser.role !== 'Admin') {
        throw new Error('Unauthorized: Only admins can verify organizers');
      }

      const { data: organizer, error } = await supabase
        .from('organizers')
        .update({
          verified: true,
          verification_date: new Date().toISOString()
        })
        .eq('id', organizerId)
        .select()
        .single();

      if (error) throw error;
      return organizer;
    } catch (error) {
      throw new Error(`Failed to verify organizer: ${error.message}`);
    }
  }
}