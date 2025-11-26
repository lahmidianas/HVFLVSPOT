import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../src/utils/auth.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = process.env.PUBLIC_API_BASE || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Realistic organizer data
const organizerData = [
  {
    company_name: 'Stellar Events Co.',
    description: 'Premium event planning and management for corporate and private events',
    business_address: '123 Broadway, New York, NY 10001',
    contact_email: 'contact@stellarevents.com',
    website_url: 'https://stellarevents.com',
    manager: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@stellarevents.com'
    }
  },
  {
    company_name: 'Metro Music Productions',
    description: 'Live music events, concerts, and festival production across the metro area',
    business_address: '456 Music Row, Nashville, TN 37203',
    contact_email: 'info@metromusicprod.com',
    website_url: 'https://metromusicproductions.com',
    manager: {
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@metromusicprod.com'
    }
  },
  {
    company_name: 'Urban Festival Group',
    description: 'Street festivals, food events, and community celebrations in urban settings',
    business_address: '789 Festival Ave, Austin, TX 78701',
    contact_email: 'hello@urbanfestival.com',
    website_url: 'https://urbanfestivalgroup.com',
    manager: {
      name: 'Jessica Chen',
      email: 'jessica.chen@urbanfestival.com'
    }
  },
  {
    company_name: 'Coastal Concert Series',
    description: 'Beachside concerts and outdoor music experiences along the coast',
    business_address: '321 Ocean Drive, Miami, FL 33139',
    contact_email: 'bookings@coastalconcerts.com',
    website_url: 'https://coastalconcertseries.com',
    manager: {
      name: 'David Thompson',
      email: 'david.thompson@coastalconcerts.com'
    }
  },
  {
    company_name: 'Elite Sports Events',
    description: 'Professional sports events, tournaments, and athletic competitions',
    business_address: '654 Stadium Blvd, Chicago, IL 60601',
    contact_email: 'events@elitesports.com',
    website_url: 'https://elitesportsevents.com',
    manager: {
      name: 'Amanda Wilson',
      email: 'amanda.wilson@elitesports.com'
    }
  },
  {
    company_name: 'Artisan Market Collective',
    description: 'Curated artisan markets, craft fairs, and maker showcases',
    business_address: '987 Craft Lane, Portland, OR 97201',
    contact_email: 'curators@artisanmarket.com',
    website_url: 'https://artisanmarketcollective.com',
    manager: {
      name: 'Robert Kim',
      email: 'robert.kim@artisanmarket.com'
    }
  },
  {
    company_name: 'Nightlife Entertainment',
    description: 'Club events, DJ nights, and late-night entertainment experiences',
    business_address: '147 Club Street, Las Vegas, NV 89101',
    contact_email: 'bookings@nightlifeent.com',
    website_url: 'https://nightlifeentertainment.com',
    manager: {
      name: 'Lisa Martinez',
      email: 'lisa.martinez@nightlifeent.com'
    }
  },
  {
    company_name: 'Heritage Cultural Events',
    description: 'Cultural festivals, heritage celebrations, and community cultural events',
    business_address: '258 Heritage Plaza, San Francisco, CA 94102',
    contact_email: 'info@heritageculture.com',
    website_url: 'https://heritageculturalvents.com',
    manager: {
      name: 'Carlos Gonzalez',
      email: 'carlos.gonzalez@heritageculture.com'
    }
  }
];

// Health check function
async function checkBackendHealth(allowSupabaseOnly = true) {
  console.log('🔍 BACKEND HEALTH CHECK');
  console.log('━'.repeat(60));
  
  // Check if backend URL is configured
  if (!process.env.PUBLIC_API_BASE) {
    if (allowSupabaseOnly) {
      console.log('⚠️  BACKEND URL NOT CONFIGURED');
      console.log('━'.repeat(60));
      console.log('🚨 PUBLIC_API_BASE environment variable is missing');
      console.log('');
      console.log('🔄 Switching to SUPABASE-ONLY MODE');
      console.log('   - Organizers will be created in Supabase database');
      console.log('   - Manager users will be created in Supabase Auth');
      console.log('   - No backend API calls will be made');
      console.log('   - Login verification will use Supabase directly');
      console.log('');
      console.log('💡 To enable full backend integration later:');
      console.log('   Add to your .env file: PUBLIC_API_BASE=http://localhost:3000');
      console.log('━'.repeat(60) + '\n');
      return { mode: 'supabase-only', reason: 'missing-url' };
    } else {
      console.error('❌ BACKEND HEALTH CHECK FAILED');
      console.error('━'.repeat(50));
      console.error('🚨 PUBLIC_API_BASE environment variable is missing');
      console.error('');
      console.error('Please add the following to your .env file:');
      console.error('PUBLIC_API_BASE=http://localhost:3000');
      console.error('');
      console.error('Or set it to your backend server URL if running elsewhere.');
      console.error('━'.repeat(50));
      process.exit(1);
    }
  }
  
  console.log(`🌐 Backend URL: ${backendUrl}`);
  
  // Validate URL format
  try {
    new URL(backendUrl);
  } catch (urlError) {
    if (allowSupabaseOnly) {
      console.log('⚠️  INVALID BACKEND URL FORMAT');
      console.log('━'.repeat(60));
      console.log('🚨 Invalid backend URL format');
      console.log(`   URL: ${backendUrl}`);
      console.log('');
      console.log('🔄 Switching to SUPABASE-ONLY MODE');
      console.log('   - Organizers will be created in Supabase database');
      console.log('   - Backend connectivity will be skipped');
      console.log('');
      console.log('💡 To fix the URL format:');
      console.log('   Update PUBLIC_API_BASE to a valid URL like: http://localhost:3000');
      console.log('━'.repeat(60) + '\n');
      return { mode: 'supabase-only', reason: 'invalid-url' };
    } else {
      console.error('❌ BACKEND HEALTH CHECK FAILED');
      console.error('━'.repeat(50));
      console.error('🚨 Invalid backend URL format');
      console.error(`   URL: ${backendUrl}`);
      console.error('');
      console.error('Please check your PUBLIC_API_BASE environment variable.');
      console.error('It should be a valid URL like: http://localhost:3000');
      console.error('━'.repeat(50));
      process.exit(1);
    }
  }
  
  // Test connectivity
  try {
    console.log('🔗 Testing connection...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const healthData = await response.json().catch(() => ({}));
      console.log('✅ Backend is reachable');
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      if (healthData.status) {
        console.log(`🏥 Health: ${healthData.status}`);
      }
      console.log('');
      return { mode: 'full-backend', status: 'healthy' };
    } else {
      if (allowSupabaseOnly) {
        console.log('⚠️  BACKEND SERVER ERROR');
        console.log('━'.repeat(60));
        console.log('🚨 Backend server responded with error');
        console.log(`   URL: ${backendUrl}/health`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log('');
        console.log('🔄 Switching to SUPABASE-ONLY MODE');
        console.log('   - Organizers will be created in Supabase database');
        console.log('   - Backend integration will be skipped');
        console.log('');
        console.log('💡 To enable backend integration:');
        console.log('   1. Start your backend server: npm run dev');
        console.log('   2. Verify the server is running on the correct port');
        console.log('   3. Check that PUBLIC_API_BASE URL is correct');
        console.log('━'.repeat(60) + '\n');
        return { mode: 'supabase-only', reason: 'server-error' };
      } else {
        console.error('❌ BACKEND HEALTH CHECK FAILED');
        console.error('━'.repeat(50));
        console.error('🚨 Backend server responded with error');
        console.error(`   URL: ${backendUrl}/health`);
        console.error(`   Status: ${response.status} ${response.statusText}`);
        console.error('');
        console.error('Possible solutions:');
        console.error('1. Start your backend server: npm run dev (in backend directory)');
        console.error('2. Check if the server is running on the correct port');
        console.error('3. Verify the PUBLIC_API_BASE URL is correct');
        console.error('━'.repeat(50));
        process.exit(1);
      }
    }
  } catch (fetchError) {
    if (allowSupabaseOnly) {
      console.log('⚠️  BACKEND CONNECTION FAILED');
      console.log('━'.repeat(60));
      
      if (fetchError.name === 'AbortError') {
        console.log('🚨 Connection timeout (10 seconds)');
        console.log(`   URL: ${backendUrl}`);
        console.log('   The backend server is not responding.');
      } else if (fetchError.code === 'ECONNREFUSED') {
        console.log('🚨 Connection refused');
        console.log(`   URL: ${backendUrl}`);
        console.log('   The backend server is not running or not accepting connections.');
      } else if (fetchError.code === 'ENOTFOUND') {
        console.log('🚨 Host not found');
        console.log(`   URL: ${backendUrl}`);
        console.log('   The hostname cannot be resolved.');
      } else if (fetchError.code === 'ECONNRESET') {
        console.log('🚨 Connection reset');
        console.log(`   URL: ${backendUrl}`);
        console.log('   The connection was reset by the server.');
      } else {
        console.log('🚨 Network error');
        console.log(`   URL: ${backendUrl}`);
        console.log(`   Error: ${fetchError.message}`);
        console.log(`   Code: ${fetchError.code || 'Unknown'}`);
      }
      
      console.log('');
      console.log('🔄 Switching to SUPABASE-ONLY MODE');
      console.log('   - Organizers will be created in Supabase database');
      console.log('   - Backend connectivity will be skipped');
      console.log('   - Login verification will use Supabase directly');
      console.log('');
      console.log('💡 To enable backend integration:');
      console.log('   1. Start the backend server: npm run dev');
      console.log('   2. Check the server is running on the correct port');
      console.log('   3. Verify firewall/network settings');
      console.log('   4. Update PUBLIC_API_BASE if using a different URL');
      console.log('━'.repeat(60) + '\n');
      return { mode: 'supabase-only', reason: 'connection-failed' };
    } else {
      console.error('❌ BACKEND HEALTH CHECK FAILED');
      console.error('━'.repeat(50));
      
      if (fetchError.name === 'AbortError') {
        console.error('🚨 Connection timeout (10 seconds)');
        console.error(`   URL: ${backendUrl}`);
        console.error('');
        console.error('The backend server is not responding.');
      } else if (fetchError.code === 'ECONNREFUSED') {
        console.error('🚨 Connection refused');
        console.error(`   URL: ${backendUrl}`);
        console.error('');
        console.error('The backend server is not running or not accepting connections.');
      } else if (fetchError.code === 'ENOTFOUND') {
        console.error('🚨 Host not found');
        console.error(`   URL: ${backendUrl}`);
        console.error('');
        console.error('The hostname cannot be resolved.');
      } else if (fetchError.code === 'ECONNRESET') {
        console.error('🚨 Connection reset');
        console.error(`   URL: ${backendUrl}`);
        console.error('');
        console.error('The connection was reset by the server.');
      } else {
        console.error('🚨 Network error');
        console.error(`   URL: ${backendUrl}`);
        console.error(`   Error: ${fetchError.message}`);
        console.error(`   Code: ${fetchError.code || 'Unknown'}`);
      }
      
      console.error('');
      console.error('Common solutions:');
      console.error('1. Start the backend server: npm run dev');
      console.error('2. Check the server is running on the correct port');
      console.error('3. Verify firewall/network settings');
      console.error('4. Update PUBLIC_API_BASE if using a different URL');
      console.error('━'.repeat(50));
      process.exit(1);
    }
  }
}

async function createOrganizerAccounts() {
  console.log('🏢 HVFLVSPOT ORGANIZER ACCOUNT CREATION');
  console.log('━'.repeat(60));
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  console.log(`📊 Creating ${organizerData.length} organizer accounts`);
  console.log('━'.repeat(60) + '\n');
  
  const createdOrganizers = [];
  const createdManagers = [];
  const failedCreations = [];
  
  for (let i = 0; i < organizerData.length; i++) {
    const orgData = organizerData[i];
    const orgNumber = i + 1;
    
    try {
      console.log(`[${orgNumber}/8] Creating organizer: ${orgData.company_name}`);
      console.log(`   Manager: ${orgData.manager.name} (${orgData.manager.email})`);
      
      // Create manager user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: orgData.manager.email,
        password: 'OrgManager123!',
        email_confirm: true,
        user_metadata: {
          full_name: orgData.manager.name,
          role: 'Organizer'
        }
      });
      
      if (authError) {
        console.log(`❌ Manager auth creation failed: ${authError.message}`);
        failedCreations.push({ ...orgData, error: authError.message });
        continue;
      }
      
      // Create manager profile in users table
      const { data: managerProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: orgData.manager.email,
          password: '', // Not needed for Supabase auth users
          full_name: orgData.manager.name,
          role: 'Organizer',
          metadata: {
            organizer_manager: true,
            company_name: orgData.company_name
          }
        })
        .select()
        .single();
      
      if (profileError) {
        console.log(`❌ Manager profile creation failed: ${profileError.message}`);
        // Clean up auth user
        await supabase.auth.admin.deleteUser(authUser.user.id);
        failedCreations.push({ ...orgData, error: profileError.message });
        continue;
      }
      
      // Create organizer profile
      const { data: organizerProfile, error: organizerError } = await supabase
        .from('organizers')
        .insert({
          user_id: authUser.user.id,
          company_name: orgData.company_name,
          description: orgData.description,
          contact_email: orgData.contact_email,
          contact_phone: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
          website_url: orgData.website_url,
          business_address: orgData.business_address,
          verified: true, // Auto-verify for testing
          verification_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (organizerError) {
        console.log(`❌ Organizer profile creation failed: ${organizerError.message}`);
        // Clean up user records
        await supabase.auth.admin.deleteUser(authUser.user.id);
        await supabase.from('users').delete().eq('id', authUser.user.id);
        failedCreations.push({ ...orgData, error: organizerError.message });
        continue;
      }
      
      console.log(`✅ Organizer created successfully: ${orgData.company_name}`);
      console.log(`   Manager ID: ${authUser.user.id}`);
      console.log(`   Organizer ID: ${organizerProfile.id}`);
      console.log(`   Verified: ${organizerProfile.verified}`);
      
      createdOrganizers.push({
        ...orgData,
        id: organizerProfile.id,
        manager_id: authUser.user.id,
        verified: organizerProfile.verified
      });
      
      createdManagers.push({
        id: authUser.user.id,
        email: orgData.manager.email,
        name: orgData.manager.name,
        company: orgData.company_name
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
      failedCreations.push({ ...orgData, error: error.message });
    }
  }
  
  return { createdOrganizers, createdManagers, failedCreations };
}

async function createOrganizersSupabaseOnly() {
  console.log('🚀 Starting SUPABASE-ONLY organizer creation...\n');
  console.log('🔧 MODE: Supabase Database + Auth Only');
  console.log('🚫 Backend API calls will be skipped\n');
  
  const createdOrganizers = [];
  const createdManagers = [];
  const failedCreations = [];
  
  console.log(`📝 Creating ${organizerData.length} organizer accounts`);
  console.log(`🏢 Each organizer will get a manager user account\n`);
  
  // Create organizer accounts
  for (let i = 0; i < organizerData.length; i++) {
    const orgData = organizerData[i];
    const orgNumber = i + 1;
    
    try {
      console.log(`[${orgNumber}/8] Creating organizer: ${orgData.company_name}`);
      console.log(`   Manager: ${orgData.manager.name} (${orgData.manager.email})`);
      
      // Create manager user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: orgData.manager.email,
        password: 'OrgManager123!',
        email_confirm: true,
        user_metadata: {
          full_name: orgData.manager.name,
          role: 'Organizer'
        }
      });
      
      if (authError) {
        console.log(`❌ Manager auth creation failed: ${authError.message}`);
        failedCreations.push({ ...orgData, error: authError.message });
        continue;
      }
      
      // Create manager profile in users table
      const { data: managerProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: orgData.manager.email,
          password: '', // Not needed for Supabase auth users
          full_name: orgData.manager.name,
          role: 'Organizer',
          metadata: {
            organizer_manager: true,
            company_name: orgData.company_name
          }
        })
        .select()
        .single();
      
      if (profileError) {
        console.log(`❌ Manager profile creation failed: ${profileError.message}`);
        // Clean up auth user
        await supabase.auth.admin.deleteUser(authUser.user.id);
        failedCreations.push({ ...orgData, error: profileError.message });
        continue;
      }
      
      // Create organizer profile
      const { data: organizerProfile, error: organizerError } = await supabase
        .from('organizers')
        .insert({
          user_id: authUser.user.id,
          company_name: orgData.company_name,
          description: orgData.description,
          contact_email: orgData.contact_email,
          contact_phone: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
          website_url: orgData.website_url,
          business_address: orgData.business_address,
          verified: true, // Auto-verify for testing
          verification_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (organizerError) {
        console.log(`❌ Organizer profile creation failed: ${organizerError.message}`);
        // Clean up user records
        await supabase.auth.admin.deleteUser(authUser.user.id);
        await supabase.from('users').delete().eq('id', authUser.user.id);
        failedCreations.push({ ...orgData, error: organizerError.message });
        continue;
      }
      
      console.log(`✅ Organizer created successfully: ${orgData.company_name}`);
      console.log(`   Manager ID: ${authUser.user.id}`);
      console.log(`   Organizer ID: ${organizerProfile.id}`);
      console.log(`   Verified: ${organizerProfile.verified}`);
      
      createdOrganizers.push({
        ...orgData,
        id: organizerProfile.id,
        manager_id: authUser.user.id,
        verified: organizerProfile.verified
      });
      
      createdManagers.push({
        id: authUser.user.id,
        email: orgData.manager.email,
        name: orgData.manager.name,
        company: orgData.company_name
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
      failedCreations.push({ ...orgData, error: error.message });
    }
  }
  
  return { createdOrganizers, createdManagers, failedCreations };
}

async function verifyOrganizerList() {
  console.log('📋 VERIFYING ORGANIZER LIST...\n');
  
  try {
    const { data: organizers, error } = await supabase
      .from('organizers')
      .select(`
        *,
        users (
          full_name,
          email,
          role
        )
      `)
      .eq('verified', true)
      .order('company_name');
    
    if (error) {
      console.log(`❌ Failed to fetch organizer list: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Found ${organizers.length} verified organizers in database:`);
    console.log('━'.repeat(60));
    
    organizers.forEach((org, index) => {
      console.log(`${index + 1}. ${org.company_name}`);
      console.log(`   Manager: ${org.users.full_name} (${org.users.email})`);
      console.log(`   Contact: ${org.contact_email}`);
      console.log(`   Address: ${org.business_address}`);
      console.log(`   Verified: ${org.verified ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    return organizers.length >= 8;
  } catch (error) {
    console.log(`❌ Error verifying organizer list: ${error.message}`);
    return false;
  }
}

async function testManagerLogin(manager) {
  try {
    console.log(`🔍 Testing login for manager: ${manager.email}`);
    console.log(`🏢 Company: ${manager.company}`);
    
    // Test login through Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: manager.email,
      password: 'OrgManager123!'
    });
    
    if (loginError) {
      console.log(`❌ Login failed: ${loginError.message}`);
      return false;
    }
    
    if (!loginData.user) {
      console.log(`❌ Login failed: No user data returned`);
      return false;
    }
    
    console.log(`✅ Login successful!`);
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log(`   Access Token: ${loginData.session.access_token.substring(0, 20)}...`);
    
    // Verify organizer profile exists
    const { data: organizerProfile, error: profileError } = await supabase
      .from('organizers')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single();
    
    if (profileError) {
      console.log(`⚠️  Organizer profile fetch failed: ${profileError.message}`);
    } else {
      console.log(`✅ Organizer profile verified:`);
      console.log(`   Company: ${organizerProfile.company_name}`);
      console.log(`   Verified: ${organizerProfile.verified}`);
      console.log(`   Contact: ${organizerProfile.contact_email}`);
    }
    
    // Sign out after test
    await supabase.auth.signOut();
    console.log(`🚪 Signed out successfully`);
    
    return true;
  } catch (error) {
    console.log(`❌ Login test error: ${error.message}`);
    return false;
  }
}

async function testSupabaseManagerLogin(manager) {
  try {
    console.log(`🔍 Testing Supabase login for manager: ${manager.email}`);
    console.log(`🏢 Company: ${manager.company}`);
    console.log(`🌐 Supabase URL: ${supabaseUrl}`);
    
    // Test login through Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: manager.email,
      password: 'OrgManager123!'
    });
    
    if (loginError) {
      console.log(`❌ Supabase login failed: ${loginError.message}`);
      return false;
    }
    
    if (!loginData.user) {
      console.log(`❌ Supabase login failed: No user data returned`);
      return false;
    }
    
    console.log(`✅ Supabase login successful!`);
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log(`   Access Token: ${loginData.session.access_token.substring(0, 20)}...`);
    console.log(`   Token Expires: ${new Date(loginData.session.expires_at * 1000).toISOString()}`);
    
    // Verify organizer profile exists
    const { data: organizerProfile, error: profileError } = await supabase
      .from('organizers')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single();
    
    if (profileError) {
      console.log(`⚠️  Organizer profile fetch failed: ${profileError.message}`);
    } else {
      console.log(`✅ Organizer profile verified from database:`);
      console.log(`   Company: ${organizerProfile.company_name}`);
      console.log(`   Verified: ${organizerProfile.verified}`);
      console.log(`   Contact: ${organizerProfile.contact_email}`);
      console.log(`   Created: ${organizerProfile.created_at}`);
    }
    
    // Sign out after test
    await supabase.auth.signOut();
    console.log(`🚪 Signed out successfully from Supabase`);
    
    return true;
  } catch (error) {
    console.log(`❌ Supabase login test error: ${error.message}`);
    return false;
  }
}

async function testAllManagerLogins(managers) {
  console.log('🔐 TESTING MANAGER LOGINS...\n');
  
  const loginResults = [];
  
  for (const manager of managers) {
    const success = await testManagerLogin(manager);
    loginResults.push({ manager, success });
    console.log(''); // Add spacing between tests
    
    // Small delay between login tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const successfulLogins = loginResults.filter(r => r.success).length;
  const failedLogins = loginResults.filter(r => !r.success);
  
  console.log('━'.repeat(60));
  console.log('🔐 MANAGER LOGIN TEST SUMMARY');
  console.log('━'.repeat(60));
  console.log(`✅ Successful logins: ${successfulLogins}/${managers.length}`);
  console.log(`❌ Failed logins: ${failedLogins.length}/${managers.length}`);
  
  if (failedLogins.length > 0) {
    console.log('\n❌ FAILED LOGINS:');
    failedLogins.forEach(({ manager }, index) => {
      console.log(`${index + 1}. ${manager.email} (${manager.company})`);
    });
  }
  
  console.log('━'.repeat(60) + '\n');
  
  return successfulLogins === managers.length;
}

async function testAllSupabaseManagerLogins(managers) {
  console.log('🔐 TESTING SUPABASE MANAGER LOGINS...\n');
  
  const loginResults = [];
  
  for (const manager of managers) {
    const success = await testSupabaseManagerLogin(manager);
    loginResults.push({ manager, success });
    console.log(''); // Add spacing between tests
    
    // Small delay between login tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const successfulLogins = loginResults.filter(r => r.success).length;
  const failedLogins = loginResults.filter(r => !r.success);
  
  console.log('━'.repeat(60));
  console.log('🔐 SUPABASE MANAGER LOGIN TEST SUMMARY');
  console.log('━'.repeat(60));
  console.log(`✅ Successful logins: ${successfulLogins}/${managers.length}`);
  console.log(`❌ Failed logins: ${failedLogins.length}/${managers.length}`);
  
  if (failedLogins.length > 0) {
    console.log('\n❌ FAILED LOGINS:');
    failedLogins.forEach(({ manager }, index) => {
      console.log(`${index + 1}. ${manager.email} (${manager.company})`);
    });
  }
  
  console.log('━'.repeat(60) + '\n');
  
  return successfulLogins === managers.length;
}

async function main() {
  console.log('🏢 HVFLVSPOT ORGANIZER ACCOUNT CREATION SCRIPT');
  console.log('━'.repeat(60));
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  console.log(`🔧 Backend URL: ${process.env.PUBLIC_API_BASE || 'Not configured'}`);
  console.log('━'.repeat(60) + '\n');
  
  // Run health check first
  const healthResult = await checkBackendHealth(true);
  
  if (healthResult.mode === 'supabase-only') {
    console.log('🔄 RUNNING IN SUPABASE-ONLY MODE\n');
    
    // Create organizer accounts in Supabase-only mode
    const { createdOrganizers, createdManagers, failedCreations } = await createOrganizersSupabaseOnly();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUPABASE-ONLY ORGANIZER CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${createdOrganizers.length}/8 organizers`);
    console.log(`👥 Manager accounts: ${createdManagers.length}/8 managers`);
    console.log(`❌ Failed: ${failedCreations.length}/8 accounts`);
    console.log(`🔧 Mode: Supabase database + auth only`);
    console.log('='.repeat(60) + '\n');
    
    if (failedCreations.length > 0) {
      console.log('❌ FAILED CREATIONS:');
      failedCreations.forEach((org, index) => {
        console.log(`${index + 1}. ${org.company_name} - ${org.error}`);
      });
      console.log('');
    }
    
    if (createdOrganizers.length > 0) {
      // Verify organizer list
      console.log('📋 VERIFYING ORGANIZER DATABASE...\n');
      const listVerified = await verifyOrganizerList();
      
      if (listVerified) {
        console.log('✅ All organizers appear in the database\n');
      } else {
        console.log('⚠️  Some organizers may not appear in the database\n');
      }
      
      // Test manager logins with Supabase
      const loginsSuccessful = await testAllSupabaseManagerLogins(createdManagers);
      
      // Final summary
      console.log('🏁 FINAL SUMMARY');
      console.log('━'.repeat(60));
      console.log(`✅ Organizers created: ${createdOrganizers.length}/8`);
      console.log(`✅ Managers created: ${createdManagers.length}/8`);
      console.log(`✅ Database verification: ${listVerified ? 'Passed' : 'Failed'}`);
      console.log(`✅ Login verification: ${loginsSuccessful ? 'All passed' : 'Some failed'}`);
      console.log(`🔧 Mode: Supabase-only (no backend calls)`);
      console.log(`🌐 Auth URL: ${supabaseUrl}`);
      console.log('');
      console.log('📧 ALL MANAGER EMAILS:');
      console.log('━'.repeat(40));
      createdManagers.forEach((manager, index) => {
        console.log(`${index + 1}. ${manager.email} (${manager.company})`);
      });
      console.log('━'.repeat(40));
      console.log('');
      console.log('🔑 Manager Password: OrgManager123!');
      console.log('');
      console.log('💡 WHAT TO DO NEXT:');
      console.log('1. Test frontend login with any manager email above');
      console.log('2. Verify organizer dashboard functionality');
      console.log('3. Start backend server for full functionality');
      console.log('4. Add PUBLIC_API_BASE=http://localhost:3000 to .env');
      console.log('5. Re-run script to verify backend integration');
      console.log('━'.repeat(60));
      
      if (createdOrganizers.length === 8 && loginsSuccessful && listVerified) {
        console.log('\n🎉 ALL ORGANIZER ACCOUNTS CREATED SUCCESSFULLY IN SUPABASE-ONLY MODE!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some issues occurred during creation. Check the logs above.');
        process.exit(1);
      }
    } else {
      console.log('❌ No organizers were created successfully.');
      process.exit(1);
    }
  } else {
    console.log('🔄 RUNNING IN FULL-BACKEND MODE\n');
    
    // Create organizer accounts with full backend integration
    const { createdOrganizers, createdManagers, failedCreations } = await createOrganizerAccounts();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FULL-BACKEND ORGANIZER CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${createdOrganizers.length}/8 organizers`);
    console.log(`👥 Manager accounts: ${createdManagers.length}/8 managers`);
    console.log(`❌ Failed: ${failedCreations.length}/8 accounts`);
    console.log(`🔧 Mode: Full backend integration`);
    console.log(`🌐 Auth URL: ${supabaseUrl}`);
    console.log(`🔗 Backend URL: ${backendUrl}`);
    console.log('='.repeat(60) + '\n');
    
    if (failedCreations.length > 0) {
      console.log('❌ FAILED CREATIONS:');
      failedCreations.forEach((org, index) => {
        console.log(`${index + 1}. ${org.company_name} - ${org.error}`);
      });
      console.log('');
    }
    
    if (createdOrganizers.length > 0) {
      // Verify organizer list
      console.log('📋 VERIFYING ORGANIZER DATABASE...\n');
      const listVerified = await verifyOrganizerList();
      
      if (listVerified) {
        console.log('✅ All organizers appear in the database\n');
      } else {
        console.log('⚠️  Some organizers may not appear in the database\n');
      }
      
      // Test manager logins
      const loginsSuccessful = await testAllManagerLogins(createdManagers);
      
      // Final summary
      console.log('🏁 FINAL SUMMARY');
      console.log('━'.repeat(60));
      console.log(`✅ Organizers created: ${createdOrganizers.length}/8`);
      console.log(`✅ Managers created: ${createdManagers.length}/8`);
      console.log(`✅ Database verification: ${listVerified ? 'Passed' : 'Failed'}`);
      console.log(`✅ Login verification: ${loginsSuccessful ? 'All passed' : 'Some failed'}`);
      console.log(`🔧 Mode: Full backend integration`);
      console.log(`🌐 Auth URL: ${supabaseUrl}`);
      console.log(`🔗 Backend URL: ${backendUrl}`);
      console.log('');
      console.log('📧 ALL MANAGER EMAILS:');
      console.log('━'.repeat(40));
      createdManagers.forEach((manager, index) => {
        console.log(`${index + 1}. ${manager.email} (${manager.company})`);
      });
      console.log('━'.repeat(40));
      console.log('');
      console.log('🔑 Manager Password: OrgManager123!');
      console.log('');
      console.log('💡 WHAT TO DO NEXT:');
      console.log('1. Test frontend login with any manager email above');
      console.log('2. Verify organizer dashboard functionality');
      console.log('3. Test event creation capabilities');
      console.log('4. Check organizer profile management');
      console.log('━'.repeat(60));
      
      if (createdOrganizers.length === 8 && loginsSuccessful && listVerified) {
        console.log('\n🎉 ALL ORGANIZER ACCOUNTS CREATED SUCCESSFULLY!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some issues occurred during creation. Check the logs above.');
        process.exit(1);
      }
    } else {
      console.log('❌ No organizers were created successfully.');
      process.exit(1);
    }
  }
}

main().catch(console.error);