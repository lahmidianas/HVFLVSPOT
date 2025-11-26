import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = process.env.PUBLIC_API_BASE || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Health check function
async function checkBackendHealth(allowSupabaseOnly = true) {
  console.log('🔍 Checking backend connectivity...\n');
  
  // Check if backend URL is configured
  if (!process.env.PUBLIC_API_BASE) {
    if (allowSupabaseOnly) {
      console.log('⚠️  BACKEND URL NOT CONFIGURED');
      console.log('━'.repeat(60));
      console.log('🚨 PUBLIC_API_BASE environment variable is missing');
      console.log('');
      console.log('🔄 Switching to SUPABASE-ONLY MODE');
      console.log('   - Users will be created in Supabase Auth');
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
      console.log('   - Users will be created in Supabase Auth');
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
        console.log('   - Users will be created in Supabase Auth');
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
      console.log('   - Users will be created in Supabase Auth');
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

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Realistic test data
const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
  'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
  'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Mila', 'Jackson', 'Ella', 'Sebastian',
  'Madison', 'David', 'Scarlett', 'Carter', 'Victoria', 'Wyatt', 'Aria', 'Jayden', 'Grace', 'John',
  'Chloe', 'Owen', 'Camila', 'Dylan', 'Penelope', 'Luke', 'Riley', 'Gabriel', 'Layla', 'Anthony'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const domains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'protonmail.com', 'aol.com', 'live.com', 'msn.com', 'mail.com'
];

// Generate realistic user data
function generateUser(index) {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  // Create email with some variation
  const emailVariations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 99) + 1}`
  ];
  
  const emailPrefix = emailVariations[Math.floor(Math.random() * emailVariations.length)];
  const email = `${emailPrefix}@${domain}`;
  
  // Standard password for all test users
  const password = 'TestUser123!';
  
  // Mark users 1-5 as power users
  const isPowerUser = index < 5;
  
  return {
    email,
    password,
    full_name: `${firstName} ${lastName}`,
    role: 'User',
    metadata: isPowerUser ? {
      power_user: true,
      preferred_categories: [],
      preferred_locations: ['New York', 'Los Angeles', 'Chicago'],
      max_price: 500,
      event_activity_level: 'high'
    } : {
      power_user: false,
      preferred_categories: [],
      preferred_locations: [],
      max_price: 150,
      event_activity_level: 'normal'
    }
  };
}

async function createTestUsers() {
  console.log('🚀 Starting test user creation...\n');
  
  const users = [];
  const createdUsers = [];
  const failedUsers = [];
  
  // Generate 50 users
  for (let i = 0; i < 50; i++) {
    users.push(generateUser(i));
  }
  
  console.log(`📝 Generated ${users.length} test users`);
  console.log(`⭐ Power users: ${users.filter(u => u.metadata.power_user).length}`);
  console.log(`👤 Regular users: ${users.filter(u => !u.metadata.power_user).length}\n`);
  
  // Create users in Supabase Auth
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userNumber = i + 1;
    
    try {
      console.log(`[${userNumber}/50] Creating user: ${user.email}`);
      
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email confirmation for test users
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      });
      
      if (authError) {
        console.log(`❌ Auth creation failed: ${authError.message}`);
        failedUsers.push({ ...user, error: authError.message });
        continue;
      }
      
      // Create user profile in our users table
      const { data: profileUser, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: user.email,
          password: '', // Not needed for Supabase auth users
          full_name: user.full_name,
          role: user.role,
          metadata: user.metadata
        })
        .select()
        .single();
      
      if (profileError) {
        console.log(`❌ Profile creation failed: ${profileError.message}`);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        failedUsers.push({ ...user, error: profileError.message });
        continue;
      }
      
      console.log(`✅ User created successfully: ${user.email} ${user.metadata.power_user ? '(Power User)' : ''}`);
      createdUsers.push({
        ...user,
        id: authUser.user.id,
        auth_id: authUser.user.id
      });
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
      failedUsers.push({ ...user, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 USER CREATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully created: ${createdUsers.length}/50 users`);
  console.log(`❌ Failed: ${failedUsers.length}/50 users`);
  console.log(`⭐ Power users created: ${createdUsers.filter(u => u.metadata.power_user).length}`);
  console.log('='.repeat(60) + '\n');
  
  if (failedUsers.length > 0) {
    console.log('❌ FAILED USERS:');
    failedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.error}`);
    });
    console.log('');
  }
  
  // Test login with first successful user
  if (createdUsers.length > 0) {
    console.log('🔐 TESTING LOGIN WITH SAMPLE USER...\n');
    await testUserLogin(createdUsers[0]);
  }
  
  // Display all created user emails
  console.log('📧 ALL CREATED USER EMAILS:');
  console.log('='.repeat(60));
  createdUsers.forEach((user, index) => {
    const powerUserIndicator = user.metadata.power_user ? ' ⭐ (Power User)' : '';
    console.log(`${index + 1}. ${user.email}${powerUserIndicator}`);
  });
  console.log('='.repeat(60) + '\n');
  
  console.log('🎉 Test user creation completed!');
  console.log(`📝 Password for all users: TestUser123!`);
  console.log(`🔑 You can now log in with any of the created emails using the standard password.`);
  
  return {
    created: createdUsers,
    failed: failedUsers,
    summary: {
      total: 50,
      successful: createdUsers.length,
      failed: failedUsers.length,
      powerUsers: createdUsers.filter(u => u.metadata.power_user).length
    }
  };
}

async function createTestUsersSupabaseOnly() {
  console.log('🚀 Starting SUPABASE-ONLY user creation...\n');
  console.log('🔧 MODE: Supabase Auth + Database Only');
  console.log('🚫 Backend API calls will be skipped\n');
  
  const users = [];
  const createdUsers = [];
  const failedUsers = [];
  
  // Generate 50 users
  for (let i = 0; i < 50; i++) {
    users.push(generateUser(i));
  }
  
  console.log(`📝 Generated ${users.length} test users`);
  console.log(`⭐ Power users: ${users.filter(u => u.metadata.power_user).length}`);
  console.log(`👤 Regular users: ${users.filter(u => !u.metadata.power_user).length}\n`);
  
  // Create users in Supabase Auth
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userNumber = i + 1;
    
    try {
      console.log(`[${userNumber}/50] Creating user: ${user.email}`);
      
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email confirmation for test users
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      });
      
      if (authError) {
        console.log(`❌ Auth creation failed: ${authError.message}`);
        failedUsers.push({ ...user, error: authError.message });
        continue;
      }
      
      // Create user profile in our users table
      const { data: profileUser, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: user.email,
          password: '', // Not needed for Supabase auth users
          full_name: user.full_name,
          role: user.role,
          metadata: user.metadata
        })
        .select()
        .single();
      
      if (profileError) {
        console.log(`❌ Profile creation failed: ${profileError.message}`);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        failedUsers.push({ ...user, error: profileError.message });
        continue;
      }
      
      console.log(`✅ User created successfully: ${user.email} ${user.metadata.power_user ? '(Power User)' : ''}`);
      createdUsers.push({
        ...user,
        id: authUser.user.id,
        auth_id: authUser.user.id
      });
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
      failedUsers.push({ ...user, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUPABASE-ONLY USER CREATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully created: ${createdUsers.length}/50 users`);
  console.log(`❌ Failed: ${failedUsers.length}/50 users`);
  console.log(`⭐ Power users created: ${createdUsers.filter(u => u.metadata.power_user).length}`);
  console.log(`🔧 Mode: Supabase Auth + Database Only`);
  console.log('='.repeat(60) + '\n');
  
  if (failedUsers.length > 0) {
    console.log('❌ FAILED USERS:');
    failedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.error}`);
    });
    console.log('');
  }
  
  // Test login with first successful user
  if (createdUsers.length > 0) {
    console.log('🔐 TESTING SUPABASE LOGIN WITH SAMPLE USER...\n');
    await testSupabaseLogin(createdUsers[0]);
  }
  
  // Display all created user emails
  console.log('📧 ALL CREATED USER EMAILS:');
  console.log('='.repeat(60));
  createdUsers.forEach((user, index) => {
    const powerUserIndicator = user.metadata.power_user ? ' ⭐ (Power User)' : '';
    console.log(`${index + 1}. ${user.email}${powerUserIndicator}`);
  });
  console.log('='.repeat(60) + '\n');
  
  console.log('🎉 SUPABASE-ONLY USER CREATION COMPLETED!');
  console.log('━'.repeat(60));
  console.log(`📝 Password for all users: TestUser123!`);
  console.log(`🔑 You can now log in with any of the created emails using the standard password.`);
  console.log(`🌐 Authentication: Supabase Auth (${supabaseUrl})`);
  console.log(`💾 User profiles: Supabase Database`);
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Test login on your frontend with any of the above emails');
  console.log('2. Start your backend server to enable full API functionality');
  console.log('3. Update PUBLIC_API_BASE in .env to connect backend');
  console.log('4. Re-run this script to verify full integration');
  console.log('━'.repeat(60));
  
  return {
    mode: 'supabase-only',
    created: createdUsers,
    failed: failedUsers,
    summary: {
      total: 50,
      successful: createdUsers.length,
      failed: failedUsers.length,
      powerUsers: createdUsers.filter(u => u.metadata.power_user).length
    }
  };
}

async function testUserLogin(testUser) {
  try {
    console.log(`🔍 Testing login for: ${testUser.email}`);
    console.log(`🔑 Using password: ${testUser.password}`);
    
    // Test login through Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginError) {
      console.log(`❌ Login test failed: ${loginError.message}`);
      return false;
    }
    
    if (!loginData.user) {
      console.log(`❌ Login test failed: No user data returned`);
      return false;
    }
    
    console.log(`✅ Login test successful!`);
    console.log(`👤 User ID: ${loginData.user.id}`);
    console.log(`📧 Email: ${loginData.user.email}`);
    console.log(`🎫 Access Token: ${loginData.session.access_token.substring(0, 20)}...`);
    
    // Test getting user profile from our users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
    
    if (profileError) {
      console.log(`⚠️  Profile fetch failed: ${profileError.message}`);
    } else {
      console.log(`✅ Profile data retrieved:`);
      console.log(`   Name: ${profileData.full_name}`);
      console.log(`   Role: ${profileData.role}`);
      console.log(`   Power User: ${profileData.metadata?.power_user ? 'Yes' : 'No'}`);
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

async function testSupabaseLogin(testUser) {
  try {
    console.log(`🔍 Testing Supabase login for: ${testUser.email}`);
    console.log(`🔑 Using password: ${testUser.password}`);
    console.log(`🌐 Supabase URL: ${supabaseUrl}`);
    
    // Test login through Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginError) {
      console.log(`❌ Supabase login test failed: ${loginError.message}`);
      return false;
    }
    
    if (!loginData.user) {
      console.log(`❌ Supabase login test failed: No user data returned`);
      return false;
    }
    
    console.log(`✅ Supabase login test successful!`);
    console.log(`👤 User ID: ${loginData.user.id}`);
    console.log(`📧 Email: ${loginData.user.email}`);
    console.log(`🎫 Access Token: ${loginData.session.access_token.substring(0, 20)}...`);
    console.log(`⏰ Token Expires: ${new Date(loginData.session.expires_at * 1000).toISOString()}`);
    
    // Test getting user profile from our users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
    
    if (profileError) {
      console.log(`⚠️  Profile fetch failed: ${profileError.message}`);
    } else {
      console.log(`✅ Profile data retrieved from database:`);
      console.log(`   Name: ${profileData.full_name}`);
      console.log(`   Role: ${profileData.role}`);
      console.log(`   Power User: ${profileData.metadata?.power_user ? 'Yes' : 'No'}`);
      console.log(`   Created: ${profileData.created_at}`);
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

// Run the script
async function main() {
  console.log('🏥 HVFLVSPOT TEST USER CREATION SCRIPT');
  console.log('━'.repeat(60));
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  console.log(`🔧 Backend URL: ${process.env.PUBLIC_API_BASE || 'Not configured'}`);
  console.log('━'.repeat(60) + '\n');
  
  // Run health check first
  const healthResult = await checkBackendHealth(true);
  
  if (healthResult.mode === 'supabase-only') {
    console.log('🔄 RUNNING IN SUPABASE-ONLY MODE\n');
    const result = await createTestUsersSupabaseOnly();
    
    console.log('\n🏁 FINAL SUMMARY:');
    console.log('━'.repeat(60));
    console.log(`✅ Created ${result.summary.successful}/50 users in Supabase`);
    console.log(`⭐ Power users: ${result.summary.powerUsers}`);
    console.log(`🔧 Mode: Supabase-only (no backend calls)`);
    console.log(`🌐 Auth URL: ${supabaseUrl}`);
    console.log('');
    console.log('💡 WHAT TO DO NEXT:');
    console.log('1. Test frontend login with any email above');
    console.log('2. Start backend server for full functionality');
    console.log('3. Add PUBLIC_API_BASE=http://localhost:3000 to .env');
    console.log('4. Re-run script to verify backend integration');
    console.log('━'.repeat(60));
  } else {
    console.log('🔄 RUNNING IN FULL-BACKEND MODE\n');
    const result = await createTestUsers();
    
    console.log('\n🏁 FINAL SUMMARY:');
    console.log('━'.repeat(60));
    console.log(`✅ Created ${result.summary.successful}/50 users`);
    console.log(`⭐ Power users: ${result.summary.powerUsers}`);
    console.log(`🔧 Mode: Full backend integration`);
    console.log(`🌐 Auth URL: ${supabaseUrl}`);
    console.log(`🔗 Backend URL: ${backendUrl}`);
    console.log('');
    console.log('💡 WHAT TO DO NEXT:');
    console.log('1. Test frontend login with any email above');
    console.log('2. Verify backend API endpoints are working');
    console.log('3. Test full user workflows end-to-end');
    console.log('━'.repeat(60));
  }
}

main().catch(console.error);