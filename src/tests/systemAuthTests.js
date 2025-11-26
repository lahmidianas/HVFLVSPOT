import { AuthService } from '../services/authService.js';
import { generateSystemToken, hashPassword } from '../utils/auth.js';
import { setupTestData, cleanupTestData, assertSuccess, assertError, getTestIds } from './testUtils.js';
import jwt from 'jsonwebtoken';

const authService = new AuthService();

// Enhanced logging utility
const logStep = (testName, step, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔐 ${testName} - ${step}`);
  if (data) {
    console.log(`[${timestamp}] 📊 Data:`, JSON.stringify(data, null, 2));
  }
};

const logTestStart = (testName) => {
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 STARTING TEST: ${testName}`);
  console.log('='.repeat(80));
};

const logTestEnd = (testName, success) => {
  const status = success ? '✅ PASSED' : '❌ FAILED';
  console.log('='.repeat(80));
  console.log(`${status}: ${testName}`);
  console.log('='.repeat(80) + '\n');
};

const logError = (testName, step, error) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ❌ ${testName} - ${step} FAILED`);
  console.log(`[${timestamp}] 🔥 Error:`, error.message);
  console.log(`[${timestamp}] 📚 Stack:`, error.stack);
};

async function testSystemLogin() {
  const testName = 'System Login';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing system API key for authentication');
    const testApiKey = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN2YIpjR5OO';
    logStep(testName, 'Using test API key (hashed)', { 
      keyLength: testApiKey.length,
      keyPrefix: testApiKey.substring(0, 10) + '...'
    });

    logStep(testName, 'Step 2: Validating system API key through AuthService');
    const startTime = Date.now();
    const systemAccount = await authService.validateSystemApiKey('$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN2YIpjR5OO');
    const validationTime = Date.now() - startTime;
    
    logStep(testName, `API key validation completed in ${validationTime}ms`, {
      accountFound: !!systemAccount,
      accountId: systemAccount?.id,
      accountName: systemAccount?.name,
      permissionsCount: systemAccount?.permissions?.length || 0
    });
    
    if (!systemAccount || !systemAccount.id) {
      logError(testName, 'Step 2', new Error('System account validation failed - no account returned'));
      throw new Error('Invalid API key');
    }

    logStep(testName, 'Step 3: Generating system authentication token');
    const tokenStartTime = Date.now();
    const token = generateSystemToken(systemAccount.id, systemAccount.permissions);
    const tokenTime = Date.now() - tokenStartTime;
    
    logStep(testName, `System token generated in ${tokenTime}ms`, {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      systemId: systemAccount.id,
      permissionsIncluded: systemAccount.permissions.length
    });

    logStep(testName, 'Step 4: Verifying token structure and content');
    const decoded = jwt.verify(token, process.env.JWT_SYSTEM_SECRET);
    logStep(testName, 'Token decoded successfully', {
      systemId: decoded.systemId,
      tokenType: decoded.type,
      permissionsCount: decoded.permissions?.length || 0,
      hasExpiration: !!decoded.exp,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'N/A'
    });
    
    if (!decoded || !decoded.permissions) {
      logError(testName, 'Step 4', new Error('Token verification failed - missing required fields'));
      throw new Error('System token validation failed');
    }

    logStep(testName, 'Step 5: Validating token permissions');
    if (decoded.permissions.length === 0) {
      logError(testName, 'Step 5', new Error('Token has no permissions assigned'));
      throw new Error('System token has no permissions');
    }
    
    logStep(testName, `Token permissions validated: ${decoded.permissions.length} permissions found`);
    logStep(testName, 'Sample permissions', { 
      permissions: decoded.permissions.slice(0, 3).concat(decoded.permissions.length > 3 ? ['...'] : [])
    });

    logTestEnd(testName, true);
    return assertSuccess('System Login');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('System Login', error);
  }
}

async function testInvalidSystemLogin() {
  const testName = 'Invalid System Login';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing invalid API key for negative test');
    const invalidApiKey = 'invalid-key-12345';
    logStep(testName, 'Using invalid API key', { 
      key: invalidApiKey,
      keyLength: invalidApiKey.length
    });

    logStep(testName, 'Step 2: Attempting authentication with invalid API key');
    const startTime = Date.now();
    
    let authFailed = false;
    let errorMessage = '';
    
    try {
      const result = await authService.validateSystemApiKey('invalid-key');
      const validationTime = Date.now() - startTime;
      
      logStep(testName, `Unexpected success in ${validationTime}ms - this should have failed`);
      if (result) {
        logError(testName, 'Step 2', new Error('Invalid API key should not return a result'));
        throw new Error('Invalid API key should fail');
      }
    } catch (error) {
      authFailed = true;
      errorMessage = error.message;
      const validationTime = Date.now() - startTime;
      logStep(testName, `Authentication correctly failed in ${validationTime}ms`, { 
        error: errorMessage,
        errorType: error.constructor.name
      });
    }

    logStep(testName, 'Step 3: Verifying authentication failure');
    if (!authFailed) {
      logError(testName, 'Step 3', new Error('Authentication should have failed but succeeded'));
      throw new Error('Invalid API key should fail');
    }

    logStep(testName, 'Step 4: Validating error message');
    if (!errorMessage.includes('Invalid API key')) {
      logError(testName, 'Step 4', new Error(`Expected 'Invalid API key' error, got: ${errorMessage}`));
      throw new Error('Incorrect error message for invalid API key');
    }
    
    logStep(testName, 'Error message validated correctly');
    logTestEnd(testName, true);
    return assertSuccess('Invalid System Login');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Invalid System Login', error);
  }
}

async function testSystemPermissions() {
  const testName = 'System Permissions';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Retrieving system account for permissions test');
    const startTime = Date.now();
    const systemAccount = await authService.validateSystemApiKey('$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN2YIpjR5OO');
    const retrievalTime = Date.now() - startTime;
    
    logStep(testName, `System account retrieved in ${retrievalTime}ms`, {
      accountId: systemAccount?.id,
      accountName: systemAccount?.name,
      permissionsCount: systemAccount?.permissions?.length || 0
    });

    if (!systemAccount) {
      logError(testName, 'Step 1', new Error('Failed to retrieve system account'));
      throw new Error('System account not found');
    }

    logStep(testName, 'Step 2: Generating token with system permissions');
    const tokenStartTime = Date.now();
    const token = generateSystemToken(systemAccount.id, systemAccount.permissions);
    const tokenTime = Date.now() - tokenStartTime;
    
    logStep(testName, `Token generated in ${tokenTime}ms with permissions`, {
      tokenLength: token.length,
      permissionsIncluded: systemAccount.permissions.length
    });

    logStep(testName, 'Step 3: Decoding and validating token permissions');
    const decoded = jwt.verify(token, process.env.JWT_SYSTEM_SECRET);
    logStep(testName, 'Token decoded for permissions validation', {
      systemId: decoded.systemId,
      tokenType: decoded.type,
      permissionsInToken: decoded.permissions?.length || 0
    });
    
    if (!decoded.permissions || decoded.permissions.length === 0) {
      logError(testName, 'Step 3', new Error('Token permissions validation failed - no permissions found'));
      throw new Error('Permission validation failed');
    }

    logStep(testName, 'Step 4: Analyzing permission structure');
    const permissionTypes = {};
    decoded.permissions.forEach(permission => {
      const category = permission.split('.')[0];
      permissionTypes[category] = (permissionTypes[category] || 0) + 1;
    });
    
    logStep(testName, 'Permission analysis completed', {
      totalPermissions: decoded.permissions.length,
      permissionCategories: Object.keys(permissionTypes).length,
      categoryBreakdown: permissionTypes,
      samplePermissions: decoded.permissions.slice(0, 5)
    });

    logStep(testName, 'Step 5: Validating permission format');
    const invalidPermissions = decoded.permissions.filter(p => !p.includes('.'));
    if (invalidPermissions.length > 0) {
      logError(testName, 'Step 5', new Error(`Invalid permission format found: ${invalidPermissions.join(', ')}`));
      throw new Error('Invalid permission format detected');
    }
    
    logStep(testName, 'All permissions have valid format (category.action)');
    logTestEnd(testName, true);
    return assertSuccess('System Permissions');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('System Permissions', error);
  }
}

export async function runSystemAuthTests() {
  console.log('\n' + '🔐'.repeat(20));
  console.log('🔐 STARTING SYSTEM AUTHENTICATION TEST SUITE 🔐');
  console.log('🔐'.repeat(20) + '\n');

  const testStartTime = Date.now();
  let testResults = [];
  
  try {
    logStep('Test Suite', 'Setting up system authentication test environment');
    await setupTestData();
    logStep('Test Suite', 'Test environment setup completed');
    
    // Run tests sequentially with detailed logging
    logStep('Test Suite', 'Running System Login Test');
    testResults.push(await testSystemLogin());
    
    logStep('Test Suite', 'Running Invalid System Login Test');
    testResults.push(await testInvalidSystemLogin());
    
    logStep('Test Suite', 'Running System Permissions Test');
    testResults.push(await testSystemPermissions());

  } finally {
    logStep('Test Suite', 'Cleaning up system authentication test environment');
    await cleanupTestData();
    logStep('Test Suite', 'Test environment cleanup completed');
  }

  const testEndTime = Date.now();
  const totalTestTime = testEndTime - testStartTime;
  
  // Calculate results
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  const failedTests = totalTests - passedTests;
  
  // Final summary
  console.log('\n' + '📊'.repeat(20));
  console.log('📊 SYSTEM AUTH TEST SUITE SUMMARY 📊');
  console.log('📊'.repeat(20));
  console.log(`⏱️  Total execution time: ${totalTestTime}ms`);
  console.log(`✅ Tests passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Tests failed: ${failedTests}/${totalTests}`);
  console.log(`📈 Success rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log('📊'.repeat(20) + '\n');

  if (failedTests > 0) {
    console.log('❌ Some system authentication tests failed. Please review the detailed logs above.');
  } else {
    console.log('🎉 All system authentication tests passed successfully!');
  }
}

// Legacy function for backward compatibility
async function runSystemAuthTestsLegacy() {
  console.log('Starting System Authentication Tests...\n');
  
  try {
    await setupTestData();
    
    const results = await Promise.all([
      testSystemLogin(),
      testInvalidSystemLogin(),
      testSystemPermissions()
    ]);
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\nTest Summary: ${passed}/${total} tests passed`);
  } finally {
    await cleanupTestData();
  }
}