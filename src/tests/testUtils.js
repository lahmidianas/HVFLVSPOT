import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { hashPassword } from '../utils/auth.js';
import crypto from 'crypto';

// Use admin client for all test operations to bypass RLS
const adminClient = supabaseAdmin || supabase;

// Generate unique test identifiers for each test run
const generateTestIds = () => {
  const TEST_ID_PREFIX = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();
  return {
    TEST_EMAIL: `test_user_${TEST_ID_PREFIX}@example.com`,
    TEST_USER_ID: crypto.randomUUID(),
    TEST_EVENT_ID: '123e4567-e89b-12d3-a456-426614174000', // Use the hardcoded ID from tests
    TEST_TICKET_ID: '123e4567-e89b-12d3-a456-426614174001', // Use the hardcoded ID from tests
    TEST_CATEGORY_ID: crypto.randomUUID(),
    TEST_ORGANIZER_ID: crypto.randomUUID(),
    TEST_ID_PREFIX,
    TEST_COMPANY_NAME: `Test Company ${TEST_ID_PREFIX}_${timestamp}`,
    TEST_EVENT_TITLE: `Test Event ${TEST_ID_PREFIX}_${timestamp}`
  };
};

// Global test IDs that will be set during setup
let testIds = null;

export const initializeTestIds = () => {
  testIds = generateTestIds();
  console.log('Test IDs initialized:', {
    email: testIds.TEST_EMAIL,
    userId: testIds.TEST_USER_ID,
    companyName: testIds.TEST_COMPANY_NAME
  });
};

export const preCleanupTestData = async () => {
  if (!testIds) return;
  
  try {
    console.log('Starting pre-cleanup to ensure clean test environment...');
    
    // Clean up any existing data that might conflict with our test IDs
    // This is more aggressive cleanup to handle any leftover data
    
    // Clean up transactions with hardcoded event/ticket IDs
    await adminClient
      .from('transactions')
      .delete()
      .eq('event_id', '123e4567-e89b-12d3-a456-426614174000');

    await adminClient
      .from('transactions')
      .delete()
      .eq('ticket_id', '123e4567-e89b-12d3-a456-426614174001');

    // Clean up bookings with hardcoded event/ticket IDs
    await adminClient
      .from('bookings')
      .delete()
      .eq('event_id', '123e4567-e89b-12d3-a456-426614174000');

    await adminClient
      .from('bookings')
      .delete()
      .eq('ticket_id', '123e4567-e89b-12d3-a456-426614174001');

    // Clean up tickets with hardcoded IDs
    await adminClient
      .from('tickets')
      .delete()
      .eq('id', '123e4567-e89b-12d3-a456-426614174001');

    await adminClient
      .from('tickets')
      .delete()
      .eq('event_id', '123e4567-e89b-12d3-a456-426614174000');

    // Clean up events with hardcoded ID
    await adminClient
      .from('events')
      .delete()
      .eq('id', '123e4567-e89b-12d3-a456-426614174000');

    // Clean up by email pattern
    const emailPattern = testIds.TEST_EMAIL.split('_')[0] + '_' + testIds.TEST_EMAIL.split('_')[1] + '%';
    await adminClient
      .from('users')
      .delete()
      .ilike('email', emailPattern);
    
    // Clean up by company name pattern
    const companyPattern = testIds.TEST_COMPANY_NAME.split(' ')[0] + ' ' + testIds.TEST_COMPANY_NAME.split(' ')[1] + '%';
    await adminClient
      .from('organizers')
      .delete()
      .ilike('company_name', companyPattern);
    
    console.log('Pre-cleanup completed');
  } catch (error) {
    console.error('Pre-cleanup error:', error);
    // Continue even if pre-cleanup fails
  }
};

export const cleanupTestData = async () => {
  if (!testIds) return;
  
  try {
    console.log('Starting test data cleanup...');

    // Clean up in proper order to handle foreign key constraints
    
    // 1. Clean up transactions first (references bookings, events, tickets, users)
    await adminClient
      .from('transactions')
      .delete()
      .eq('user_id', testIds.TEST_USER_ID);

    // 2. Clean up bookings (references users, events, tickets)
    await adminClient
      .from('bookings')
      .delete()
      .eq('user_id', testIds.TEST_USER_ID);

    // 3. Clean up notifications (references users)
    await adminClient
      .from('notifications')
      .delete()
      .eq('user_id', testIds.TEST_USER_ID);

    // 4. Clean up notification preferences (references users)
    await adminClient
      .from('notification_preferences')
      .delete()
      .eq('user_id', testIds.TEST_USER_ID);

    // 5. Clean up organizer profile (references users) - try both by user_id and by company name
    await adminClient
      .from('organizers')
      .delete()
      .eq('user_id', testIds.TEST_USER_ID);

    // Also clean up by company name in case there are orphaned records
    if (testIds.TEST_COMPANY_NAME) {
      await adminClient
        .from('organizers')
        .delete()
        .eq('company_name', testIds.TEST_COMPANY_NAME);
    }

    // 6. Clean up tickets (references events)
    await adminClient
      .from('tickets')
      .delete()
      .eq('id', testIds.TEST_TICKET_ID);

    // Also clean up tickets by event_id
    await adminClient
      .from('tickets')
      .delete()
      .eq('event_id', testIds.TEST_EVENT_ID);
    // 7. Clean up events (references users as organizer_id)
    await adminClient
      .from('events')
      .delete()
      .eq('id', testIds.TEST_EVENT_ID);

    // Also clean up any events created by this organizer
    await adminClient
      .from('events')
      .delete()
      .eq('organizer_id', testIds.TEST_USER_ID);

    // Clean up events by title pattern in case there are orphaned records
    if (testIds.TEST_EVENT_TITLE) {
      await adminClient
        .from('events')
        .delete()
        .ilike('title', `${testIds.TEST_EVENT_TITLE}%`);
    }

    // 8. Clean up test category
    await adminClient
      .from('categories')
      .delete()
      .eq('id', testIds.TEST_CATEGORY_ID);
    // 9. Finally, clean up the user (no dependencies should remain)
    await adminClient
      .from('users')
      .delete()
      .eq('id', testIds.TEST_USER_ID);

    // Also clean up by email pattern in case there are orphaned records
    if (testIds.TEST_EMAIL) {
      await adminClient
        .from('users')
        .delete()
        .eq('email', testIds.TEST_EMAIL);
    }

    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Cleanup error:', error);
    // Continue even if cleanup fails
  }
};

export const setupTestData = async () => {
  try {
    // Generate fresh IDs for this test run
    testIds = generateTestIds();
    
    console.log('Starting test data setup...');
    
    // Pre-cleanup to ensure no conflicts
    await preCleanupTestData();
    
    // Regular cleanup of our specific test data
    await cleanupTestData();

    console.log('Creating test user with ID:', testIds.TEST_USER_ID);
    console.log('Using email:', testIds.TEST_EMAIL);
    
    // Create test user with Organizer role (for non-auth tests)
    const hashedPassword = await hashPassword('testpassword123');
    const { data: user, error: userError } = await adminClient
      .from('users')
      .insert({
        id: testIds.TEST_USER_ID,
        email: testIds.TEST_EMAIL,
        password: hashedPassword,
        full_name: 'Test Organizer',
        role: 'Organizer'
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation failed:', userError);
      throw new Error(`Failed to create test user: ${userError.message}`);
    }

    if (!user || !user.id) {
      console.error('User creation returned no data');
      throw new Error('User creation failed - no user data returned');
    }

    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Verify user exists in database
    const { data: verifyUser, error: verifyError } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('id', testIds.TEST_USER_ID)
      .single();

    if (verifyError || !verifyUser) {
      console.error('User verification failed:', verifyError);
      throw new Error('User creation verification failed');
    }

    console.log('User existence verified:', verifyUser);

    console.log('Creating organizer profile for user:', testIds.TEST_USER_ID);
    // Create test organizer profile
    const { data: organizer, error: organizerError } = await adminClient
      .from('organizers')
      .insert({
        id: testIds.TEST_ORGANIZER_ID,
        user_id: testIds.TEST_USER_ID,
        company_name: testIds.TEST_COMPANY_NAME,
        description: 'Test organizer for automated testing',
        contact_email: testIds.TEST_EMAIL,
        contact_phone: '+1234567890',
        website_url: 'https://example.com',
        business_address: '123 Test St',
        verified: true
      })
      .select()
      .single();

    if (organizerError) {
      console.error('Organizer creation failed:', organizerError);
      console.error('Attempted to create organizer with user_id:', testIds.TEST_USER_ID);
      throw new Error(`Failed to create test organizer: ${organizerError.message}`);
    }

    if (!organizer || !organizer.id) {
      console.error('Organizer creation returned no data');
      throw new Error('Organizer creation failed - no organizer data returned');
    }

    console.log('Test organizer created successfully:', {
      id: organizer.id,
      user_id: organizer.user_id,
      company_name: organizer.company_name,
      verified: organizer.verified
    });

    console.log('Creating test category...');
    // Create test category
    const { data: category, error: categoryError } = await adminClient
      .from('categories')
      .insert({
        id: testIds.TEST_CATEGORY_ID,
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category for automated testing'
      })
      .select()
      .single();

    if (categoryError) {
      console.error('Category creation failed:', categoryError);
      throw new Error(`Failed to create test category: ${categoryError.message}`);
    }

    console.log('Test category created successfully:', {
      id: category.id,
      name: category.name,
      slug: category.slug
    });

    console.log('Creating test event with organizer_id:', testIds.TEST_USER_ID);
    // Create test event
    const { data: event, error: eventError } = await adminClient
      .from('events')
      .insert({
        id: testIds.TEST_EVENT_ID,
        title: testIds.TEST_EVENT_TITLE,
        slug: `test-event-${testIds.TEST_ID_PREFIX}`,
        description: 'Test event for automated testing',
        location: 'Test Venue',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        category_id: testIds.TEST_CATEGORY_ID,
        organizer_id: testIds.TEST_USER_ID, // Use user ID, not organizer profile ID
        price: 100.00,
        capacity: 1000,
        image_url: 'https://example.com/test-image.jpg'
      })
      .select()
      .single();

    if (eventError) {
      console.error('Event creation failed:', eventError);
      console.error('Attempted to create event with organizer_id:', testIds.TEST_USER_ID);
      throw new Error(`Failed to create test event: ${eventError.message}`);
    }

    if (!event || !event.id) {
      console.error('Event creation returned no data');
      throw new Error('Event creation failed - no event data returned');
    }

    console.log('Test event created successfully:', {
      id: event.id,
      title: event.title,
      organizer_id: event.organizer_id,
      category_id: event.category_id
    });

    console.log('Creating test ticket...');
    // Create test ticket
    const { data: ticket, error: ticketError } = await adminClient
      .from('tickets')
      .insert({
        id: testIds.TEST_TICKET_ID,
        event_id: testIds.TEST_EVENT_ID,
        type: 'General Admission',
        price: 100.00,
        quantity: 100
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Ticket creation failed:', ticketError);
      throw new Error(`Failed to create test ticket: ${ticketError.message}`);
    }

    if (!ticket || !ticket.id) {
      console.error('Ticket creation returned no data');
      throw new Error('Ticket creation failed - no ticket data returned');
    }

    console.log('Test ticket created successfully:', {
      id: ticket.id,
      event_id: ticket.event_id,
      type: ticket.type,
      price: ticket.price,
      quantity: ticket.quantity
    });
    
    // Store test data in global scope for tests
    global.testUser = user;
    global.testOrganizer = organizer;
    global.testCategory = category;
    global.testEvent = event;
    global.testTicket = ticket;

    console.log('Test data setup completed successfully');
    console.log('Test User ID:', testIds.TEST_USER_ID);
    console.log('Test Organizer ID:', testIds.TEST_ORGANIZER_ID);
    console.log('Test Event ID:', testIds.TEST_EVENT_ID);
    console.log('Test Ticket ID:', testIds.TEST_TICKET_ID);
    console.log('Test Company Name:', testIds.TEST_COMPANY_NAME);
  } catch (error) {
    console.error('Setup error:', error);
    throw error;
  }
};

export const assertSuccess = (name) => {
  console.log(`✅ ${name}: Passed`);
  return true;
};

export const assertError = (name, error) => {
  console.error(`❌ ${name}: Failed - ${error.message}`);
  return false;
};

// Export getter functions instead of static values
export const getTestIds = () => {
  if (!testIds) {
    throw new Error('Test IDs not initialized. Call setupTestData() first.');
  }
  return testIds;
};

// Export individual getters for backward compatibility
export const TEST_USER_ID = () => getTestIds().TEST_USER_ID;
export const TEST_EMAIL = () => getTestIds().TEST_EMAIL;
export const TEST_EVENT_ID = () => getTestIds().TEST_EVENT_ID;
export const TEST_TICKET_ID = () => getTestIds().TEST_TICKET_ID;
export const TEST_CATEGORY_ID = () => getTestIds().TEST_CATEGORY_ID;
export const TEST_ORGANIZER_ID = () => getTestIds().TEST_ORGANIZER_ID;
export const TEST_COMPANY_NAME = () => getTestIds().TEST_COMPANY_NAME;
export const TEST_EVENT_TITLE = () => getTestIds().TEST_EVENT_TITLE;