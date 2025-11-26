import { NotificationService } from '../services/notification/NotificationService.js';
import { PreferencesService } from '../services/notification/PreferencesService.js';
import { NotificationChannel, NotificationType, NotificationStatus } from '../utils/notification/constants.js';
import { setupTestData, cleanupTestData, assertSuccess, assertError, TEST_USER_ID } from './testUtils.js';
import { supabase, supabaseAdmin } from '../lib/supabase.js';

// Use admin client for test queries to bypass RLS
const testClient = supabaseAdmin || supabase;

const notificationService = new NotificationService();
const preferencesService = new PreferencesService();

// Enhanced logging utility
const logStep = (testName, step, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📧 ${testName} - ${step}`);
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

// Test notification delivery
async function testEmailNotification() {
  const testName = 'Email Notification Delivery';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing email notification data');
    const notificationData = {
      userId: TEST_USER_ID(),
      type: NotificationType.BOOKING,
      content: 'Test booking confirmation',
      channel: NotificationChannel.EMAIL
    };
    logStep(testName, 'Email notification data prepared', notificationData);

    logStep(testName, 'Step 2: Checking initial notification count');
    const { data: initialNotifications, error: countError } = await testClient
      .from('notifications')
      .select('id')
      .eq('user_id', notificationData.userId)
      .eq('channel', NotificationChannel.EMAIL);
    
    if (countError) {
      logError(testName, 'Step 2', countError);
      throw countError;
    }
    
    const initialCount = initialNotifications?.length || 0;
    logStep(testName, `Initial email notification count: ${initialCount}`);

    logStep(testName, 'Step 3: Sending email notification through NotificationService');
    const startTime = Date.now();
    const notification = await notificationService.sendNotification({
      userId: TEST_USER_ID(),
      type: NotificationType.BOOKING,
      content: 'Test booking confirmation',
      channel: NotificationChannel.EMAIL
    });
    const deliveryTime = Date.now() - startTime;
    
    logStep(testName, `Email notification sent in ${deliveryTime}ms`, {
      notificationId: notification.id,
      status: notification.status,
      channel: notification.channel,
      type: notification.type
    });

    logStep(testName, 'Step 4: Validating notification response structure');
    if (!notification || !notification.id) {
      logError(testName, 'Step 4', new Error('Notification response missing required fields'));
      throw new Error('Email notification delivery failed - missing notification ID');
    }

    logStep(testName, 'Step 5: Verifying notification status');
    if (!notification || notification.status !== NotificationStatus.DELIVERED) {
      logError(testName, 'Step 5', new Error(`Expected status: ${NotificationStatus.DELIVERED}, got: ${notification?.status}`));
      throw new Error('Email notification delivery failed');
    }
    logStep(testName, 'Email notification status verified as DELIVERED');

    logStep(testName, 'Step 6: Checking database notification count after delivery');
    const { data: finalNotifications, error: finalCountError } = await testClient
      .from('notifications')
      .select('id')
      .eq('user_id', notificationData.userId)
      .eq('channel', NotificationChannel.EMAIL);
    
    if (finalCountError) {
      logError(testName, 'Step 6', finalCountError);
      throw finalCountError;
    }
    
    const finalCount = finalNotifications?.length || 0;
    logStep(testName, `Final email notification count: ${finalCount} (expected: ${initialCount + 1})`);
    
    if (finalCount !== initialCount + 1) {
      logError(testName, 'Step 6', new Error(`Notification count mismatch. Expected: ${initialCount + 1}, got: ${finalCount}`));
      throw new Error('Email notification not recorded in database');
    }

    logStep(testName, 'Step 7: Verifying notification in database');
    const { data: dbNotification, error: dbError } = await testClient
      .from('notifications')
      .select('*')
      .eq('id', notification.id)
      .single();
    
    if (dbError || !dbNotification) {
      logError(testName, 'Step 7', dbError || new Error('Notification not found in database'));
      throw new Error('Email notification not found in database');
    }
    
    logStep(testName, 'Email notification verified in database', {
      id: dbNotification.id,
      user_id: dbNotification.user_id,
      type: dbNotification.type,
      channel: dbNotification.channel,
      status: dbNotification.status,
      created_at: dbNotification.created_at
    });

    logTestEnd(testName, true);
    return assertSuccess('Email Notification Delivery');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Email Notification Delivery', error);
  }
}

async function testPushNotification() {
  const testName = 'Push Notification Delivery';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing push notification data');
    const notificationData = {
      userId: TEST_USER_ID(),
      type: NotificationType.PAYMENT,
      content: 'Payment processed successfully',
      channel: NotificationChannel.PUSH
    };
    logStep(testName, 'Push notification data prepared', notificationData);

    logStep(testName, 'Step 2: Checking initial push notification count');
    const { data: initialNotifications, error: countError } = await testClient
      .from('notifications')
      .select('id')
      .eq('user_id', notificationData.userId)
      .eq('channel', NotificationChannel.PUSH);
    
    if (countError) {
      logError(testName, 'Step 2', countError);
      throw countError;
    }
    
    const initialCount = initialNotifications?.length || 0;
    logStep(testName, `Initial push notification count: ${initialCount}`);

    logStep(testName, 'Step 3: Sending push notification through NotificationService');
    const startTime = Date.now();
    const notification = await notificationService.sendNotification({
      userId: TEST_USER_ID(),
      type: NotificationType.PAYMENT,
      content: 'Payment processed successfully',
      channel: NotificationChannel.PUSH
    });
    const deliveryTime = Date.now() - startTime;
    
    logStep(testName, `Push notification sent in ${deliveryTime}ms`, {
      notificationId: notification.id,
      status: notification.status,
      channel: notification.channel,
      type: notification.type
    });

    logStep(testName, 'Step 4: Validating notification response structure');
    if (!notification || !notification.id) {
      logError(testName, 'Step 4', new Error('Notification response missing required fields'));
      throw new Error('Push notification delivery failed - missing notification ID');
    }

    logStep(testName, 'Step 5: Verifying notification status');
    if (!notification || notification.status !== NotificationStatus.DELIVERED) {
      logError(testName, 'Step 5', new Error(`Expected status: ${NotificationStatus.DELIVERED}, got: ${notification?.status}`));
      throw new Error('Push notification delivery failed');
    }
    logStep(testName, 'Push notification status verified as DELIVERED');

    logStep(testName, 'Step 6: Verifying notification content and channel');
    if (notification.channel !== NotificationChannel.PUSH) {
      logError(testName, 'Step 6', new Error(`Expected channel: ${NotificationChannel.PUSH}, got: ${notification.channel}`));
      throw new Error('Push notification channel mismatch');
    }
    
    if (notification.type !== NotificationType.PAYMENT) {
      logError(testName, 'Step 6', new Error(`Expected type: ${NotificationType.PAYMENT}, got: ${notification.type}`));
      throw new Error('Push notification type mismatch');
    }
    logStep(testName, 'Push notification content and channel verified');

    logTestEnd(testName, true);
    return assertSuccess('Push Notification Delivery');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Push Notification Delivery', error);
  }
}

async function testSMSNotification() {
  const testName = 'SMS Notification Delivery';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing SMS notification data');
    const notificationData = {
      userId: TEST_USER_ID(),
      type: NotificationType.REMINDER,
      content: 'Event starts in 1 hour',
      channel: NotificationChannel.SMS
    };
    logStep(testName, 'SMS notification data prepared', notificationData);

    logStep(testName, 'Step 2: Checking initial SMS notification count');
    const { data: initialNotifications, error: countError } = await testClient
      .from('notifications')
      .select('id')
      .eq('user_id', notificationData.userId)
      .eq('channel', NotificationChannel.SMS);
    
    if (countError) {
      logError(testName, 'Step 2', countError);
      throw countError;
    }
    
    const initialCount = initialNotifications?.length || 0;
    logStep(testName, `Initial SMS notification count: ${initialCount}`);

    logStep(testName, 'Step 3: Sending SMS notification through NotificationService');
    const startTime = Date.now();
    const notification = await notificationService.sendNotification({
      userId: TEST_USER_ID(),
      type: NotificationType.REMINDER,
      content: 'Event starts in 1 hour',
      channel: NotificationChannel.SMS
    });
    const deliveryTime = Date.now() - startTime;
    
    logStep(testName, `SMS notification sent in ${deliveryTime}ms`, {
      notificationId: notification.id,
      status: notification.status,
      channel: notification.channel,
      type: notification.type
    });

    logStep(testName, 'Step 4: Validating notification response structure');
    if (!notification || !notification.id) {
      logError(testName, 'Step 4', new Error('Notification response missing required fields'));
      throw new Error('SMS notification delivery failed - missing notification ID');
    }

    logStep(testName, 'Step 5: Verifying notification status');
    if (!notification || notification.status !== NotificationStatus.DELIVERED) {
      logError(testName, 'Step 5', new Error(`Expected status: ${NotificationStatus.DELIVERED}, got: ${notification?.status}`));
      throw new Error('SMS notification delivery failed');
    }
    logStep(testName, 'SMS notification status verified as DELIVERED');

    logStep(testName, 'Step 6: Verifying SMS-specific properties');
    if (notification.channel !== NotificationChannel.SMS) {
      logError(testName, 'Step 6', new Error(`Expected channel: ${NotificationChannel.SMS}, got: ${notification.channel}`));
      throw new Error('SMS notification channel mismatch');
    }
    
    if (notification.content.length > 160) {
      logStep(testName, 'Warning: SMS content exceeds 160 characters', { 
        contentLength: notification.content.length,
        content: notification.content.substring(0, 50) + '...'
      });
    }
    logStep(testName, 'SMS notification properties verified');

    logTestEnd(testName, true);
    return assertSuccess('SMS Notification Delivery');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('SMS Notification Delivery', error);
  }
}

async function testInvalidRecipient() {
  const testName = 'Invalid Recipient Handling';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing invalid recipient test data');
    const nonExistentUUID = '00000000-0000-4000-a000-000000000000';
    const invalidNotificationData = {
      userId: nonExistentUUID,
      type: NotificationType.BOOKING,
      content: 'Test notification',
      channel: NotificationChannel.EMAIL
    };
    logStep(testName, 'Invalid recipient data prepared', invalidNotificationData);

    logStep(testName, 'Step 2: Verifying user does not exist in database');
    const { data: userCheck, error: userCheckError } = await testClient
      .from('users')
      .select('id')
      .eq('id', nonExistentUUID)
      .maybeSingle();
    
    if (userCheckError) {
      logError(testName, 'Step 2', userCheckError);
      throw userCheckError;
    }
    
    logStep(testName, `User existence check: ${userCheck ? 'Found (unexpected)' : 'Not found (expected)'}`);
    
    if (userCheck) {
      logError(testName, 'Step 2', new Error('Test user should not exist'));
      throw new Error('Invalid test setup - user exists');
    }
    
    logStep(testName, 'Step 3: Attempting to send notification to invalid recipient');
    let notificationFailed = false;
    let errorMessage = '';
    
    const startTime = Date.now();
    try {
    await notificationService.sendNotification({
      userId: nonExistentUUID,
      type: NotificationType.BOOKING,
      content: 'Test notification',
      channel: NotificationChannel.EMAIL
    });
      const unexpectedTime = Date.now() - startTime;
      logStep(testName, `Unexpected success in ${unexpectedTime}ms - this should have failed`);
    } catch (error) {
      notificationFailed = true;
      errorMessage = error.message;
      const failureTime = Date.now() - startTime;
      logStep(testName, `Notification correctly failed in ${failureTime}ms`, { 
        error: errorMessage,
        errorType: error.constructor.name
      });
    }

    logStep(testName, 'Step 4: Verifying notification failure');
    if (!notificationFailed) {
      logError(testName, 'Step 4', new Error('Notification should have failed but succeeded'));
      throw new Error('Invalid recipient notification should fail');
    }

    logStep(testName, 'Step 5: Validating error message content');
    if (errorMessage.includes('User not found')) {
      logStep(testName, 'Error message validated correctly');
      logTestEnd(testName, true);
      return assertSuccess('Invalid Recipient Handling');
    }
    
    logError(testName, 'Step 5', new Error(`Expected 'User not found' error, got: ${errorMessage}`));
    throw new Error('Incorrect error message for invalid recipient');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Invalid Recipient Handling', error);
  }
}

async function testPreferencesCreation() {
  const testName = 'Default Preferences Creation';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Checking existing preferences');
    const { data: existingPrefs, error: existingError } = await testClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', TEST_USER_ID())
      .maybeSingle();
    
    if (existingError) {
      logError(testName, 'Step 1', existingError);
      throw existingError;
    }
    
    logStep(testName, `Existing preferences check: ${existingPrefs ? 'Found' : 'Not found'}`);

    logStep(testName, 'Step 2: Getting preferences through PreferencesService');
    const startTime = Date.now();
    const preferences = await preferencesService.getPreferences(TEST_USER_ID());
    const retrievalTime = Date.now() - startTime;
    
    logStep(testName, `Preferences retrieved in ${retrievalTime}ms`, {
      hasPreferences: !!preferences,
      preferredChannel: preferences?.preferred_channel,
      bookingEnabled: preferences?.booking_enabled,
      paymentEnabled: preferences?.payment_enabled,
      marketingEnabled: preferences?.marketing_enabled,
      reminderEnabled: preferences?.reminder_enabled
    });

    logStep(testName, 'Step 3: Validating preferences structure');
    if (!preferences || !preferences.preferred_channel) {
      logError(testName, 'Step 3', new Error('Preferences missing required fields'));
      throw new Error('Default preferences not created');
    }
    
    logStep(testName, 'Step 4: Verifying default preference values');
    const expectedDefaults = {
      booking_enabled: true,
      payment_enabled: true,
      marketing_enabled: false,
      reminder_enabled: true,
      preferred_channel: NotificationChannel.EMAIL
    };
    
    const validationResults = {};
    Object.entries(expectedDefaults).forEach(([key, expectedValue]) => {
      const actualValue = preferences[key];
      validationResults[key] = {
        expected: expectedValue,
        actual: actualValue,
        matches: actualValue === expectedValue
      };
    });
    
    logStep(testName, 'Default preferences validation', validationResults);
    
    const invalidDefaults = Object.entries(validationResults)
      .filter(([key, result]) => !result.matches);
    
    if (invalidDefaults.length > 0) {
      logError(testName, 'Step 4', new Error(`Invalid default values: ${invalidDefaults.map(([key]) => key).join(', ')}`));
      throw new Error('Default preferences have incorrect values');
    }
    
    logStep(testName, 'All default preferences validated successfully');

    logTestEnd(testName, true);
    return assertSuccess('Default Preferences Creation');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Default Preferences Creation', error);
  }
}

async function testPreferencesUpdate() {
  const testName = 'Preferences Update';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Getting current preferences');
    const currentPrefs = await preferencesService.getPreferences(TEST_USER_ID());
    logStep(testName, 'Current preferences retrieved', {
      marketingEnabled: currentPrefs.marketing_enabled,
      preferredChannel: currentPrefs.preferred_channel
    });

    logStep(testName, 'Step 2: Preparing preference updates');
    const updateData = {
      marketing_enabled: false,
      preferred_channel: NotificationChannel.PUSH
    };
    logStep(testName, 'Preference update data prepared', updateData);

    logStep(testName, 'Step 3: Updating preferences through PreferencesService');
    const startTime = Date.now();
    const updatedPrefs = await preferencesService.updatePreferences(TEST_USER_ID(), {
      marketing_enabled: false,
      preferred_channel: NotificationChannel.PUSH
    });
    const updateTime = Date.now() - startTime;
    
    logStep(testName, `Preferences updated in ${updateTime}ms`, {
      id: updatedPrefs.id,
      marketingEnabled: updatedPrefs.marketing_enabled,
      preferredChannel: updatedPrefs.preferred_channel,
      updatedAt: updatedPrefs.updated_at
    });

    logStep(testName, 'Step 4: Validating preference updates');
    if (!updatedPrefs || 
        updatedPrefs.marketing_enabled !== false || 
        updatedPrefs.preferred_channel !== NotificationChannel.PUSH) {
      logError(testName, 'Step 4', new Error('Preference update validation failed'));
      throw new Error('Preferences update failed');
    }
    
    logStep(testName, 'Step 5: Verifying updates in database');
    const { data: dbPrefs, error: dbError } = await testClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', TEST_USER_ID())
      .single();
    
    if (dbError || !dbPrefs) {
      logError(testName, 'Step 5', dbError || new Error('Preferences not found in database'));
      throw new Error('Updated preferences not found in database');
    }
    
    logStep(testName, 'Database preferences verified', {
      marketingEnabled: dbPrefs.marketing_enabled,
      preferredChannel: dbPrefs.preferred_channel,
      updatedAt: dbPrefs.updated_at
    });
    
    if (dbPrefs.marketing_enabled !== false || dbPrefs.preferred_channel !== NotificationChannel.PUSH) {
      logError(testName, 'Step 5', new Error('Database preferences do not match updates'));
      throw new Error('Database preferences update verification failed');
    }
    
    logStep(testName, 'Preference updates verified in database');

    logTestEnd(testName, true);
    return assertSuccess('Preferences Update');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Preferences Update', error);
  }
}

async function testNotificationRespectingPreferences() {
  const testName = 'Preferences Enforcement';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Disabling marketing notifications in preferences');
    const startTime = Date.now();
    await preferencesService.updatePreferences(TEST_USER_ID(), {
      marketing_enabled: false
    });
    const updateTime = Date.now() - startTime;
    
    logStep(testName, `Marketing notifications disabled in ${updateTime}ms`);

    logStep(testName, 'Step 2: Verifying preference update');
    const updatedPrefs = await preferencesService.getPreferences(TEST_USER_ID());
    logStep(testName, 'Updated preferences verified', {
      marketingEnabled: updatedPrefs.marketing_enabled,
      bookingEnabled: updatedPrefs.booking_enabled,
      paymentEnabled: updatedPrefs.payment_enabled
    });
    
    if (updatedPrefs.marketing_enabled !== false) {
      logError(testName, 'Step 2', new Error('Marketing notifications not properly disabled'));
      throw new Error('Preference update failed');
    }

    logStep(testName, 'Step 3: Attempting to send disabled marketing notification');
    const notificationStartTime = Date.now();
    const result = await notificationService.sendNotification({
      userId: TEST_USER_ID(),
      type: NotificationType.MARKETING,
      content: 'Marketing message',
      channel: NotificationChannel.EMAIL
    });
    const notificationTime = Date.now() - notificationStartTime;
    
    logStep(testName, `Marketing notification processed in ${notificationTime}ms`, {
      status: result.status,
      reason: result.reason,
      hasId: !!result.id
    });

    logStep(testName, 'Step 4: Verifying notification was skipped');
    if (result.status !== 'skipped') {
      logError(testName, 'Step 4', new Error(`Expected status: 'skipped', got: '${result.status}'`));
      throw new Error('Disabled notification was not skipped');
    }
    
    logStep(testName, 'Step 5: Verifying skip reason');
    if (!result.reason || !result.reason.includes('disabled')) {
      logError(testName, 'Step 5', new Error(`Expected reason to mention 'disabled', got: '${result.reason}'`));
      throw new Error('Skip reason not properly set');
    }
    
    logStep(testName, 'Marketing notification correctly skipped due to preferences');

    logStep(testName, 'Step 6: Testing enabled notification type still works');
    const enabledResult = await notificationService.sendNotification({
      userId: TEST_USER_ID(),
      type: NotificationType.BOOKING,
      content: 'Booking confirmation',
      channel: NotificationChannel.EMAIL
    });
    
    logStep(testName, 'Enabled notification test result', {
      status: enabledResult.status,
      type: enabledResult.type,
      hasId: !!enabledResult.id
    });
    
    if (enabledResult.status !== NotificationStatus.DELIVERED) {
      logError(testName, 'Step 6', new Error('Enabled notification type should still work'));
      throw new Error('Enabled notification failed');
    }
    
    logStep(testName, 'Enabled notification types still working correctly');

    logTestEnd(testName, true);
    return assertSuccess('Preferences Enforcement');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Preferences Enforcement', error);
  }
}

async function testInvalidMessageFormat() {
  const testName = 'Invalid Message Format Handling';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing invalid message format test');
    const invalidNotificationData = {
      userId: TEST_USER_ID(),
      type: NotificationType.BOOKING,
      content: '', // Empty content should fail
      channel: NotificationChannel.EMAIL
    };
    logStep(testName, 'Invalid message data prepared', {
      contentLength: invalidNotificationData.content.length,
      isEmpty: invalidNotificationData.content === ''
    });

    logStep(testName, 'Step 2: Attempting to send notification with invalid content');
    let notificationFailed = false;
    let errorMessage = '';
    
    const startTime = Date.now();
    try {
    await notificationService.sendNotification({
      userId: TEST_USER_ID(),
      type: NotificationType.BOOKING,
      content: '', // Empty content should fail
      channel: NotificationChannel.EMAIL
    });
      const unexpectedTime = Date.now() - startTime;
      logStep(testName, `Unexpected success in ${unexpectedTime}ms - this should have failed`);
    } catch (error) {
      notificationFailed = true;
      errorMessage = error.message;
      const failureTime = Date.now() - startTime;
      logStep(testName, `Notification correctly failed in ${failureTime}ms`, { 
        error: errorMessage,
        errorType: error.constructor.name
      });
    }

    logStep(testName, 'Step 3: Verifying notification failure');
    if (!notificationFailed) {
      logError(testName, 'Step 3', new Error('Invalid message format should have failed'));
      throw new Error('Invalid message format should fail');
    }

    logStep(testName, 'Step 4: Validating error message content');
    if (errorMessage.includes('Invalid content')) {
      logStep(testName, 'Error message validated correctly');
      logTestEnd(testName, true);
      return assertSuccess('Invalid Message Format Handling');
    }
    
    logError(testName, 'Step 4', new Error(`Expected 'Invalid content' error, got: ${errorMessage}`));
    throw new Error('Incorrect error message for invalid format');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Invalid Message Format Handling', error);
  }
}

async function testExternalServiceFailure() {
  const testName = 'External Service Failure Handling';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing external service failure simulation');
    const failureNotificationData = {
      userId: TEST_USER_ID(),
      type: NotificationType.PAYMENT,
      content: 'SIMULATE_FAILURE',
      channel: NotificationChannel.EMAIL
    };
    logStep(testName, 'Failure simulation data prepared', {
      specialContent: failureNotificationData.content,
      userId: failureNotificationData.userId
    });

    logStep(testName, 'Step 2: Checking initial failed notification count');
    const { data: initialFailedNotifications, error: countError } = await testClient
      .from('notifications')
      .select('id')
      .eq('user_id', failureNotificationData.userId)
      .eq('status', NotificationStatus.FAILED);
    
    if (countError) {
      logError(testName, 'Step 2', countError);
      throw countError;
    }
    
    const initialFailedCount = initialFailedNotifications?.length || 0;
    logStep(testName, `Initial failed notification count: ${initialFailedCount}`);

    logStep(testName, 'Step 3: Sending notification with simulated external service failure');
    const startTime = Date.now();
    const notification = await notificationService.sendNotification({
      userId: TEST_USER_ID(),
      type: NotificationType.PAYMENT,
      content: 'SIMULATE_FAILURE',
      channel: NotificationChannel.EMAIL
    });
    const processingTime = Date.now() - startTime;
    
    logStep(testName, `Notification processed in ${processingTime}ms`, {
      notificationId: notification.id,
      status: notification.status,
      error: notification.error,
      hasError: !!notification.error
    });

    logStep(testName, 'Step 4: Verifying notification failure status');
    if (notification.status !== NotificationStatus.FAILED) {
      logError(testName, 'Step 4', new Error(`Expected status: ${NotificationStatus.FAILED}, got: ${notification.status}`));
      throw new Error('External service failure not handled correctly');
    }
    logStep(testName, 'Notification status correctly set to FAILED');

    logStep(testName, 'Step 5: Verifying error information is recorded');
    if (!notification.error) {
      logError(testName, 'Step 5', new Error('Error information not recorded'));
      throw new Error('External service failure error not recorded');
    }
    logStep(testName, 'Error information properly recorded', { error: notification.error });

    logStep(testName, 'Step 6: Checking failed notification count after failure');
    const { data: finalFailedNotifications, error: finalCountError } = await testClient
      .from('notifications')
      .select('id')
      .eq('user_id', failureNotificationData.userId)
      .eq('status', NotificationStatus.FAILED);
    
    if (finalCountError) {
      logError(testName, 'Step 6', finalCountError);
      throw finalCountError;
    }
    
    const finalFailedCount = finalFailedNotifications?.length || 0;
    logStep(testName, `Final failed notification count: ${finalFailedCount} (expected: ${initialFailedCount + 1})`);
    
    if (finalFailedCount !== initialFailedCount + 1) {
      logError(testName, 'Step 6', new Error(`Failed notification count mismatch. Expected: ${initialFailedCount + 1}, got: ${finalFailedCount}`));
      throw new Error('Failed notification not properly recorded');
    }
    
    logStep(testName, 'Failed notification properly recorded in database');

    logTestEnd(testName, true);
    return assertSuccess('External Service Failure Handling');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('External Service Failure Handling', error);
  }
}

export async function runNotificationTests() {
  console.log('\n' + '📧'.repeat(20));
  console.log('📧 STARTING NOTIFICATION SERVICE TEST SUITE 📧');
  console.log('📧'.repeat(20) + '\n');

  const testStartTime = Date.now();
  let testResults = [];

  try {
    logStep('Test Suite', 'Setting up notification test environment');
    await setupTestData();
    logStep('Test Suite', 'Test environment setup completed');

    // Run tests sequentially with detailed logging
    logStep('Test Suite', 'Running Email Notification Test');
    testResults.push(await testEmailNotification());
    
    logStep('Test Suite', 'Running Push Notification Test');
    testResults.push(await testPushNotification());
    
    logStep('Test Suite', 'Running SMS Notification Test');
    testResults.push(await testSMSNotification());
    
    logStep('Test Suite', 'Running Invalid Recipient Test');
    testResults.push(await testInvalidRecipient());
    
    logStep('Test Suite', 'Running Preferences Creation Test');
    testResults.push(await testPreferencesCreation());
    
    logStep('Test Suite', 'Running Preferences Update Test');
    testResults.push(await testPreferencesUpdate());
    
    logStep('Test Suite', 'Running Preferences Enforcement Test');
    testResults.push(await testNotificationRespectingPreferences());
    
    logStep('Test Suite', 'Running Invalid Message Format Test');
    testResults.push(await testInvalidMessageFormat());
    
    logStep('Test Suite', 'Running External Service Failure Test');
    testResults.push(await testExternalServiceFailure());

  } finally {
    logStep('Test Suite', 'Cleaning up notification test environment');
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
  console.log('📊 NOTIFICATION TEST SUITE SUMMARY 📊');
  console.log('📊'.repeat(20));
  console.log(`⏱️  Total execution time: ${totalTestTime}ms`);
  console.log(`✅ Tests passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Tests failed: ${failedTests}/${totalTests}`);
  console.log(`📈 Success rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log('📊'.repeat(20) + '\n');
  if (failedTests > 0) {
    console.log('❌ Some notification tests failed. Please review the detailed logs above.');
  } else {
    console.log('🎉 All notification tests passed successfully!');
  }
}