import { supabase } from '../lib/supabase.js';
import { hashPassword, comparePasswords } from '../utils/auth.js';
import crypto from 'crypto';

export class AuthService {
  async createUser(email, password, name, role) {
    const hashedPassword = await hashPassword(password);
    
    // Generate UUID for the user
    const id = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id,
        email,
        password: hashedPassword,
        full_name: name,
        role
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async validateCredentials(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await comparePasswords(password, user.password);
    return isValid ? user : null;
  }

  async validateSystemApiKey(apiKey) {
    // Get all system accounts since we need to compare hashed values
    const { data: accounts, error } = await supabase
      .from('system_accounts')
      .select('*');

    if (error) throw error;
    if (!accounts || accounts.length === 0) {
      throw new Error('No system accounts found');
    }

    // Find the account with matching API key
    for (const account of accounts) {
      if (apiKey === account.api_key) {
        return account;
      }
    }

    throw new Error('Invalid API key');
  }
}