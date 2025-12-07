import { EventManagementService } from '../services/organizer/EventManagementService.js';
import { EventStatisticsService } from '../services/organizer/EventStatisticsService.js';
import { OrganizerService } from '../services/organizer/OrganizerService.js';
import { supabase, supabaseAdmin } from '../lib/server/supabaseAdmin.js';
import { setupTestData, cleanupTestData, assertSuccess, assertError, TEST_USER_ID } from './testUtils.js';

const managementService = new EventManagementService();
const statisticsService = new EventStatisticsService();
const organizerService = new OrganizerService();

// Enhanced logging utility
const logStep = (testName, step, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ðŸ¢ ${testName} - ${step}`);
  if (data) {
    console.log(`[${timestamp}] ðŸ“Š Data:`, JSON.stringify(data, null, 2));
  }
};

const logTestStart = (testName) => {
  console.log('\n' + '='.repeat(80));
  console.log(`ðŸš€ STARTING TEST: ${testName}`);
  console.log('='.repeat(80));
};

const logTestEnd = (testName, success) => {
  const status = success ? 'âœ… PASSED' : 'âŒ FAILED';
  console.log('='.repeat(80));
  console.log(`${status}: ${testName}`);
  console.log('='.repeat(80) + '\n');
};

const logError = (testName, step, error) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] âŒ ${testName} - ${step} FAILED`);
  console.log(`[${timestamp}] ðŸ”¥ Error:`, error.message);
  console.log(`[${timestamp}] ðŸ“š Stack:`, error.stack);
};

// Test data generator
const generateTestData = (customData = {}) => ({
  organizer: {
    company_name: `Test Company ${Date.now()}`,
    description: 'Test organizer description',
    contact_email: `test${Date.now()}@example.com`,
    contact_phone: '+1234567890',
    website_url: 'https://example.com',
    business_address: '123 Test St, Test City'
  },
  event: {
    title: `Test Event ${Date.now()}`,
    description: 'Test event description',
    location: 'Test Venue',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    price: 99.99,
    capacity: 1000,
    ...customData
  },
  tickets: [
    { type: 'General', price: 99.99, quantity: 100 },
    { type: 'VIP', price: 199.99, quantity: 50 }
  ]
});

// Test Cases
const testCases = {
  async testOrganizerProfile() {
    const testName = 'Organizer Profile Management';
    logTestStart(testName);
    
    try {
      logStep(testName, 'Step 1: Retrieving existing organizer profile');
      const startTime = Date.now();
      // Get existing organizer profile
      const organizer = await organizerService.getOrganizerProfile(TEST_USER_ID());
      const retrievalTime = Date.now() - startTime;
      
      logStep(testName, `Organizer profile retrieved in ${retrievalTime}ms`, {
        organizerId: organizer?.id,
        companyName: organizer?.company_name,
        verified: organizer?.verified,
        hasContactInfo: !!(organizer?.contact_email && organizer?.contact_phone)
      });

      logStep(testName, 'Step 2: Validating organizer profile data');
      // Verify organizer data
      if (!organizer?.id || !organizer.company_name) {
        logError(testName, 'Step 2', new Error('Invalid organizer profile data - missing required fields'));
        throw new Error('Invalid organizer profile data');
      }
      logStep(testName, 'Organizer profile data validated successfully');

      logStep(testName, 'Step 3: Preparing profile update data');
      // Test profile update
      const updateData = {
        company_name: `Updated Company ${Date.now()}`,
        description: 'Updated description for testing'
      };
      logStep(testName, 'Profile update data prepared', updateData);

      logStep(testName, 'Step 4: Updating organizer profile');
      const updateStartTime = Date.now();
      const updatedOrganizer = await organizerService.updateOrganizerProfile(
        TEST_USER_ID(),
        updateData
      );
      const updateTime = Date.now() - updateStartTime;
      
      logStep(testName, `Profile updated in ${updateTime}ms`, {
        newCompanyName: updatedOrganizer.company_name,
        newDescription: updatedOrganizer.description,
        updatedAt: updatedOrganizer.updated_at
      });

      logStep(testName, 'Step 5: Verifying profile update');
      if (updatedOrganizer.company_name !== updateData.company_name) {
        logError(testName, 'Step 5', new Error(`Company name update failed. Expected: ${updateData.company_name}, Got: ${updatedOrganizer.company_name}`));
        throw new Error('Organizer update failed');
      }
      logStep(testName, 'Profile update verified successfully');

      logTestEnd(testName, true);
      return assertSuccess('Organizer Profile Management');
    } catch (error) {
      logError(testName, 'Test execution', error);
      logTestEnd(testName, false);
      return assertError('Organizer Profile Management', error);
    }
  },

  async testEventCreation() {
    const testName = 'Event Creation';
    logTestStart(testName);
    
    const testData = generateTestData();
    let createdEvent = null;

    try {
      logStep(testName, 'Step 1: Verifying organizer profile exists');
      // Verify organizer exists
      const organizer = await organizerService.getOrganizerProfile(TEST_USER_ID());
      if (!organizer) {
        logError(testName, 'Step 1', new Error('No organizer profile found for user'));
        throw new Error('No organizer profile found');
      }
      logStep(testName, 'Organizer profile verified', {
        organizerId: organizer.id,
        companyName: organizer.company_name,
        verified: organizer.verified
      });

      logStep(testName, 'Step 2: Creating event with ticket types');
      // Create event
      logStep(testName, 'Event creation data prepared', {
        eventTitle: testData.event.title,
        location: testData.event.location,
        price: testData.event.price,
        capacity: testData.event.capacity,
        ticketTypesCount: testData.tickets.length
      });
      
      const createStartTime = Date.now();
      createdEvent = await managementService.createEvent(
        TEST_USER_ID(),
        { ...testData.event, tickets: testData.tickets }
      );
      const createTime = Date.now() - createStartTime;

      logStep(testName, `Event created in ${createTime}ms`, {
        eventId: createdEvent?.id,
        title: createdEvent?.title,
        slug: createdEvent?.slug,
        organizerId: createdEvent?.organizer_id,
        hasCategory: !!createdEvent?.categories
      });

      logStep(testName, 'Step 3: Validating event creation response');
      // Verify event creation
      if (!createdEvent?.id) {
        logError(testName, 'Step 3', new Error('Event creation failed - no ID returned'));
        throw new Error('Event creation failed - no ID returned');
      }
      logStep(testName, 'Event creation response validated');

      logStep(testName, 'Step 4: Verifying ticket types were created');
      // Verify tickets
      const { data: tickets } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('event_id', createdEvent.id);

      logStep(testName, 'Ticket types verification', {
        expectedTickets: testData.tickets.length,
        actualTickets: tickets?.length || 0,
        ticketTypes: tickets?.map(t => ({ type: t.type, price: t.price, quantity: t.quantity })) || []
      });

      if (!tickets || tickets.length !== testData.tickets.length) {
        logError(testName, 'Step 4', new Error(`Expected ${testData.tickets.length} tickets, got ${tickets?.length || 0}`));
        throw new Error(`Expected ${testData.tickets.length} tickets, got ${tickets?.length || 0}`);
      }
      logStep(testName, 'All ticket types created successfully');

      logTestEnd(testName, true);
      return assertSuccess('Event Creation');
    } catch (error) {
      logError(testName, 'Test execution', error);
      logTestEnd(testName, false);
      return assertError('Event Creation', error);
    } finally {
      if (createdEvent?.id) {
        logStep(testName, 'Cleaning up created event', { eventId: createdEvent.id });
        await cleanupEvent(createdEvent.id);
      }
    }
  },

  async testEventUpdate() {
    const testName = 'Event Update';
    logTestStart(testName);
    
    const testData = generateTestData();
    let createdEvent = null;

    try {
      logStep(testName, 'Step 1: Verifying organizer profile exists');
      // Verify organizer exists
      const organizer = await organizerService.getOrganizerProfile(TEST_USER_ID());
      if (!organizer) {
        logError(testName, 'Step 1', new Error('No organizer profile found for user'));
        throw new Error('No organizer profile found');
      }
      logStep(testName, 'Organizer profile verified for update test');

      logStep(testName, 'Step 2: Creating initial event for update test');
      // First create an event
      const createStartTime = Date.now();
      createdEvent = await managementService.createEvent(
        TEST_USER_ID(),
        { ...testData.event, tickets: testData.tickets }
      );
      const createTime = Date.now() - createStartTime;
      
      logStep(testName, `Initial event created in ${createTime}ms`, {
        eventId: createdEvent.id,
        originalTitle: createdEvent.title,
        originalPrice: createdEvent.price
      });

      logStep(testName, 'Step 3: Preparing event update data');
      // Update data
      const updateData = {
        title: `Updated Event Title ${Date.now()}`,
        price: 149.99
      };
      logStep(testName, 'Event update data prepared', updateData);

      logStep(testName, 'Step 4: Performing event update');
      // Perform update
      const updateStartTime = Date.now();
      const updatedEvent = await managementService.updateEvent(
        TEST_USER_ID(),
        createdEvent.id,
        updateData
      );
      const updateTime = Date.now() - updateStartTime;
      
      logStep(testName, `Event updated in ${updateTime}ms`, {
        eventId: updatedEvent.id,
        newTitle: updatedEvent.title,
        newPrice: updatedEvent.price,
        updatedAt: updatedEvent.updated_at
      });

      logStep(testName, 'Step 5: Verifying event update');
      // Verify update
      if (updatedEvent.title !== updateData.title || 
          updatedEvent.price !== updateData.price) {
        logError(testName, 'Step 5', new Error(`Update verification failed. Title: ${updatedEvent.title} vs ${updateData.title}, Price: ${updatedEvent.price} vs ${updateData.price}`));
        throw new Error('Event update verification failed');
      }
      logStep(testName, 'Event update verified successfully');

      logTestEnd(testName, true);
      return assertSuccess('Event Update');
    } catch (error) {
      logError(testName, 'Test execution', error);
      logTestEnd(testName, false);
      return assertError('Event Update', error);
    } finally {
      if (createdEvent?.id) {
        logStep(testName, 'Cleaning up updated event', { eventId: createdEvent.id });
        await cleanupEvent(createdEvent.id);
      }
    }
  },

  async testEventStatistics() {
    const testName = 'Event Statistics';
    logTestStart(testName);
    
    const testData = generateTestData();
    let createdEvent = null;

    try {
      logStep(testName, 'Step 1: Verifying organizer profile exists');
      // Verify organizer exists
      const organizer = await organizerService.getOrganizerProfile(TEST_USER_ID());
      if (!organizer) {
        logError(testName, 'Step 1', new Error('No organizer profile found for user'));
        throw new Error('No organizer profile found');
      }
      logStep(testName, 'Organizer profile verified for statistics test');

      logStep(testName, 'Step 2: Creating event for statistics test');
      // Create event with tickets
      const createStartTime = Date.now();
      createdEvent = await managementService.createEvent(
        TEST_USER_ID(),
        { ...testData.event, tickets: testData.tickets }
      );
      const createTime = Date.now() - createStartTime;
      
      logStep(testName, `Event created for statistics in ${createTime}ms`, {
        eventId: createdEvent.id,
        title: createdEvent.title,
        capacity: createdEvent.capacity
      });

      logStep(testName, 'Step 3: Creating test bookings for statistics');
      // Create test bookings
      const bookingStartTime = Date.now();
      const bookings = await createTestBookings(createdEvent.id);
      const bookingTime = Date.now() - bookingStartTime;
      
      logStep(testName, `Test bookings created in ${bookingTime}ms`, {
        bookingCount: bookings?.length || 0,
        totalQuantity: bookings?.reduce((sum, b) => sum + b.quantity, 0) || 0,
        totalRevenue: bookings?.reduce((sum, b) => sum + b.total_price, 0) || 0
      });

      logStep(testName, 'Step 4: Retrieving event statistics');
      // Get statistics
      const statsStartTime = Date.now();
      const stats = await statisticsService.getEventStats(
        TEST_USER_ID(),
        createdEvent.id
      );
      const statsTime = Date.now() - statsStartTime;
      
      logStep(testName, `Statistics retrieved in ${statsTime}ms`, {
        ticketsSold: stats.ticketsSold,
        ticketsAvailable: stats.ticketsAvailable,
        revenue: stats.revenue,
        ticketTypesCount: Object.keys(stats.ticketTypes || {}).length,
        recentBookingsCount: stats.recentBookings?.length || 0
      });

      logStep(testName, 'Step 5: Validating statistics data');
      // Verify statistics
      if (!stats.ticketsSold || !stats.revenue) {
        logError(testName, 'Step 5', new Error(`Invalid statistics data - ticketsSold: ${stats.ticketsSold}, revenue: ${stats.revenue}`));
        throw new Error('Invalid statistics data');
      }
      
      logStep(testName, 'Statistics validation', {
        hasValidTicketsSold: stats.ticketsSold > 0,
        hasValidRevenue: stats.revenue > 0,
        hasTicketTypes: Object.keys(stats.ticketTypes || {}).length > 0,
        hasRecentBookings: (stats.recentBookings?.length || 0) > 0
      });
      
      logStep(testName, 'Statistics data validated successfully');

      logTestEnd(testName, true);
      return assertSuccess('Event Statistics');
    } catch (error) {
      logError(testName, 'Test execution', error);
      logTestEnd(testName, false);
      return assertError('Event Statistics', error);
    } finally {
      if (createdEvent?.id) {
        logStep(testName, 'Cleaning up event and related data', { eventId: createdEvent.id });
        await cleanupEvent(createdEvent.id);
      }
    }
  },

  async testUnauthorizedAccess() {
    const testName = 'Unauthorized Access Prevention';
    logTestStart(testName);
    
    const testData = generateTestData();
    let createdEvent = null;

    try {
      logStep(testName, 'Step 1: Creating event for unauthorized access test');
      // Create event normally
      const createStartTime = Date.now();
      createdEvent = await managementService.createEvent(
        TEST_USER_ID(),
        { ...testData.event, tickets: testData.tickets }
      );
      const createTime = Date.now() - createStartTime;
      
      logStep(testName, `Event created in ${createTime}ms`, {
        eventId: createdEvent.id,
        authorizedUserId: TEST_USER_ID()
      });

      logStep(testName, 'Step 2: Preparing unauthorized access attempt');
      // Attempt unauthorized access
      const unauthorizedId = '00000000-0000-0000-0000-000000000000';
      logStep(testName, 'Unauthorized access data prepared', {
        unauthorizedUserId: unauthorizedId,
        targetEventId: createdEvent.id,
        attemptedAction: 'update event'
      });
      
      logStep(testName, 'Step 3: Attempting unauthorized event update');
      let accessDenied = false;
      let errorMessage = '';
      
      const attemptStartTime = Date.now();
      try {
      await managementService.updateEvent(
        unauthorizedId,
        createdEvent.id,
        { title: 'Unauthorized Update' }
      );
        const attemptTime = Date.now() - attemptStartTime;
        logStep(testName, `Unexpected success in ${attemptTime}ms - this should have failed`);
      } catch (error) {
        accessDenied = true;
        errorMessage = error.message;
        const attemptTime = Date.now() - attemptStartTime;
        logStep(testName, `Unauthorized access correctly blocked in ${attemptTime}ms`, {
          error: errorMessage,
          errorType: error.constructor.name
        });
      }

      logStep(testName, 'Step 4: Verifying unauthorized access was blocked');
      if (!accessDenied) {
        logError(testName, 'Step 4', new Error('Unauthorized access should have been blocked but succeeded'));
        throw new Error('Should have failed with unauthorized access');
      }

      logStep(testName, 'Step 5: Validating error message');
      if (!errorMessage.includes('unauthorized')) {
        logError(testName, 'Step 5', new Error(`Expected 'unauthorized' error, got: ${errorMessage}`));
        throw new Error('Incorrect error message for unauthorized access');
      }
      
      logStep(testName, 'Unauthorized access correctly prevented');
      logTestEnd(testName, true);
      return assertSuccess('Unauthorized Access Prevention');
    } catch (error) {
      logError(testName, 'Test execution', error);
      logTestEnd(testName, false);
      return assertError('Unauthorized Access Prevention', error);
    } finally {
      if (createdEvent?.id) {
        logStep(testName, 'Cleaning up test event', { eventId: createdEvent.id });
        await cleanupEvent(createdEvent.id);
      }
    }
  }
};

// Helper Functions
async function cleanupEvent(eventId) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ðŸ§¹ Cleaning up event ${eventId} and related data...`);
  
  try {
    // Delete bookings first (due to foreign key constraints)
    await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('event_id', eventId);

    // Delete tickets
    await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('event_id', eventId);

    // Delete event
    await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    console.log(`[${timestamp}] âœ… Cleanup completed for event ${eventId}`);
  } catch (error) {
    console.error(`[${timestamp}] âŒ Cleanup error:`, error);
  }
}

async function createTestBookings(eventId) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ðŸ“ Creating test bookings for event ${eventId}...`);
  
  try {
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('event_id', eventId);

    if (!tickets?.length) {
      console.log(`[${timestamp}] âŒ No tickets found for booking creation`);
      throw new Error('No tickets found for booking creation');
    }

    const bookings = [];
    for (const ticket of tickets) {
      bookings.push({
        user_id: TEST_USER_ID(),
        event_id: eventId,
        ticket_id: ticket.id,
        quantity: 2,
        total_price: ticket.price * 2,
        status: 'confirmed'
      });
    }

    const { data: createdBookings } = await supabaseAdmin
      .from('bookings')
      .insert(bookings)
      .select();

    console.log(`[${timestamp}] âœ… Created ${createdBookings?.length || 0} test bookings`);
    return createdBookings;
  } catch (error) {
    console.error(`[${timestamp}] âŒ Error creating test bookings:`, error);
    throw error;
  }
}

// Main test runner
export async function runEventManagementTests() {
  console.log('\n' + 'ðŸ¢'.repeat(20));
  console.log('ðŸ¢ STARTING EVENT MANAGEMENT TEST SUITE ðŸ¢');
  console.log('ðŸ¢'.repeat(20) + '\n');

  const testStartTime = Date.now();
  let testResults = [];

  try {
    logStep('Test Suite', 'Setting up event management test environment');
    // Setup test environment
    await setupTestData();
    logStep('Test Suite', 'Test environment setup completed');

    // Run each test case
    for (const [testName, testFn] of Object.entries(testCases)) {
      logStep('Test Suite', `Running ${testName} test`);
      const result = await testFn();
      testResults.push(result);
      
      // Clean up between tests
      await cleanupTestData();
      await setupTestData();
    }
  } catch (error) {
    logStep('Test Suite', 'Test suite error occurred');
    console.error('Test suite error:', error);
  } finally {
    logStep('Test Suite', 'Cleaning up event management test environment');
    // Final cleanup
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
  console.log('\n' + 'ðŸ“Š'.repeat(20));
  console.log('ðŸ“Š EVENT MANAGEMENT TEST SUITE SUMMARY ðŸ“Š');
  console.log('ðŸ“Š'.repeat(20));
  console.log(`â±ï¸  Total execution time: ${totalTestTime}ms`);
  console.log(`âœ… Tests passed: ${passedTests}/${totalTests}`);
  console.log(`âŒ Tests failed: ${failedTests}/${totalTests}`);
  console.log(`ðŸ“ˆ Success rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log('ðŸ“Š'.repeat(20) + '\n');
  if (failedTests > 0) {
    console.log('âŒ Some event management tests failed. Please review the detailed logs above.');
  } else {
    console.log('ðŸŽ‰ All event management tests passed successfully!');
  }
}
