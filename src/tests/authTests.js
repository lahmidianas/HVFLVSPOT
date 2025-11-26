import { AuthService } from '../services/authService.js';
import { generateTokens } from '../utils/auth.js';
import { initializeTestIds, cleanupTestData, assertSuccess, assertError, TEST_EMAIL } from './testUtils.js';
import jwt from 'jsonwebtoken';

const authService = new AuthService();

async function testUserSignup() {
  try {
    console.log('🔍 Starting User Signup Test');
    console.log('📧 Test email:', TEST_EMAIL());
    
    const existingUser = await authService.getUserByEmail(TEST_EMAIL());
    console.log('🔎 Existing user check result:', existingUser ? 'User found' : 'No existing user');
    
    if (existingUser) {
      console.log('❌ User already exists with email:', existingUser.email);
      throw new Error('User already registered');
    }
    
    console.log('👤 Creating new user...');
    const user = await authService.createUser(
      TEST_EMAIL(),
      'password123',
      'Test User',
      'User'
    );
    console.log('✅ User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role
    });
    
    if (!user || !user.id) {
      console.log('❌ User creation validation failed');
      throw new Error('User creation failed');
    }
    
    console.log('🎉 User Signup Test completed successfully');
    return assertSuccess('User Signup');
  } catch (error) {
    console.log('💥 User Signup Test failed with error:', error.message);
    return assertError('User Signup', error);
  }
}

async function testUserLogin() {
  try {
    console.log('🔍 Starting User Login Test');
    console.log('📧 Login attempt with email:', TEST_EMAIL());
    
    const user = await authService.validateCredentials(TEST_EMAIL(), 'password123');
    console.log('🔐 Credential validation result:', user ? 'Valid credentials' : 'Invalid credentials');
    
    if (!user) {
      console.log('❌ Login failed - no user returned');
      throw new Error('Login failed');
    }

    console.log('✅ Login successful for user:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    console.log('🎉 User Login Test completed successfully');
    return assertSuccess('User Login');
  } catch (error) {
    console.log('💥 User Login Test failed with error:', error.message);
    return assertError('User Login', error);
  }
}

async function testInvalidLogin() {
  try {
    console.log('🔍 Starting Invalid Login Test');
    console.log('📧 Testing invalid login with email:', TEST_EMAIL());
    console.log('🔑 Using wrong password: wrongpassword');
    
    const user = await authService.validateCredentials(TEST_EMAIL(), 'wrongpassword');
    console.log('🔐 Invalid credential validation result:', user ? 'Unexpectedly valid' : 'Correctly invalid');
    
    if (user) {
      console.log('❌ Invalid login should have failed but succeeded');
      throw new Error('Invalid login should fail');
    }

    console.log('✅ Invalid login correctly rejected');
    console.log('🎉 Invalid Login Test completed successfully');
    return assertSuccess('Invalid Login');
  } catch (error) {
    console.log('💥 Invalid Login Test failed with error:', error.message);
    return assertError('Invalid Login', error);
  }
}

async function testTokenRefresh() {
  try {
    console.log('🔍 Starting Token Refresh Test');
    console.log('📧 Getting user for token generation:', TEST_EMAIL());
    
    const user = await authService.validateCredentials(TEST_EMAIL(), 'password123');
    console.log('👤 User retrieved for token test:', user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log('❌ User not found for token refresh test');
      throw new Error('User not found');
    }

    console.log('🎫 Generating tokens for user:', user.id);
    const tokens = generateTokens(user.id, user.role);
    console.log('🔑 Tokens generated:', {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      accessTokenLength: tokens.accessToken?.length,
      refreshTokenLength: tokens.refreshToken?.length
    });
    
    console.log('🔍 Verifying refresh token...');
    const decoded = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log('✅ Token decoded successfully:', {
      userId: decoded.userId,
      hasUserId: !!decoded.userId
    });
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Token verification failed - missing userId');
      throw new Error('Token verification failed');
    }

    console.log('🎉 Token Refresh Test completed successfully');
    return assertSuccess('Token Refresh');
  } catch (error) {
    console.log('💥 Token Refresh Test failed with error:', error.message);
    return assertError('Token Refresh', error);
  }
}

async function runAuthTests() {
  console.log('Starting Authentication Tests...\n');
  
  try {
    console.log('🚀 Setting up auth test environment...');
    // Initialize test IDs and cleanup any existing data
    initializeTestIds();
    await cleanupTestData();
    console.log('✅ Auth test environment setup completed\n');
    
    // Run tests in sequence without cleanup between them to maintain user state
    console.log('📋 Running authentication tests in sequence...\n');
    await testUserSignup();
    console.log('\n' + '='.repeat(50) + '\n');
    await testInvalidLogin();
    console.log('\n' + '='.repeat(50) + '\n');
    await testUserLogin();
    console.log('\n' + '='.repeat(50) + '\n');
    await testTokenRefresh();
    console.log('\n' + '='.repeat(50) + '\n');
  } finally {
    console.log('🧹 Final cleanup of test data...');
    await cleanupTestData();
    console.log('✅ Final test cleanup completed');
  }
}

export { runAuthTests };