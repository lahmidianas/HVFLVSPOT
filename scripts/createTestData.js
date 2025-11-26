import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../src/utils/auth.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data configuration
const TEST_PASSWORD = 'TestUser123!';
const ORGANIZER_PASSWORD = 'OrgManager123!';

// Generate unique identifiers for this run
const runId = Date.now();
const uniqueSuffix = Math.random().toString(36).substring(2, 8);

const testData = {
  organizer: {
    company_name: `Test Events Co ${uniqueSuffix}`,
    description: 'Premium event planning and management for testing purposes',
    business_address: '123 Test Street, Demo City, DC 12345',
    contact_email: `contact.${uniqueSuffix}@testevents.com`,
    website_url: 'https://testevents.com',
    manager: {
      name: 'Test Manager',
      email: `manager.${uniqueSuffix}@testevents.com`
    }
  },
  user: {
    name: 'Test User',
    email: `user.${uniqueSuffix}@example.com`
  },
  categories: [
    { name: 'Music', slug: 'music', description: 'Concerts, festivals, and live music events' },
    { name: 'Comedy', slug: 'comedy', description: 'Stand-up comedy shows and humor events' },
    { name: 'Festivals', slug: 'festivals', description: 'Cultural festivals and community celebrations' }
  ],
  events: [
    {
      title: `Summer Music Festival ${uniqueSuffix}`,
      description: 'A spectacular outdoor music festival featuring top artists from around the world. Join us for three days of incredible music, food, and fun.',
      location: 'Central Park, New York',
      category: 'Music',
      price: 89.99,
      capacity: 5000,
      status: 'upcoming',
      daysFromNow: 30,
      tickets: [
        { type: 'General Admission', price: 89.99, quantity: 1000 },
        { type: 'VIP', price: 199.99, quantity: 100 }
      ]
    },
    {
      title: `Comedy Night Spectacular ${uniqueSuffix}`,
      description: 'An evening of laughter with the best comedians in the business. Get ready for non-stop entertainment and hilarious performances.',
      location: 'Comedy Club Downtown, Los Angeles',
      category: 'Comedy',
      price: 45.00,
      capacity: 300,
      status: 'upcoming',
      daysFromNow: 15,
      tickets: [
        { type: 'Standard', price: 45.00, quantity: 200 },
        { type: 'Premium', price: 75.00, quantity: 50 }
      ]
    },
    {
      title: `Heritage Cultural Festival ${uniqueSuffix}`,
      description: 'Celebrate our rich cultural heritage with traditional music, dance, food, and crafts from around the world.',
      location: 'Heritage Square, Chicago',
      category: 'Festivals',
      price: 25.00,
      capacity: 2000,
      status: 'past',
      daysFromNow: -10,
      tickets: [
        { type: 'Adult', price: 25.00, quantity: 800 },
        { type: 'Child', price: 15.00, quantity: 400 }
      ]
    },
    {
      title: `Electronic Music Rave ${uniqueSuffix}`,
      description: 'The hottest electronic music event of the year featuring world-renowned DJs and incredible light shows.',
      location: 'Warehouse District, Miami',
      category: 'Music',
      price: 120.00,
      capacity: 1500,
      status: 'sold-out',
      daysFromNow: 45,
      tickets: [
        { type: 'General', price: 120.00, quantity: 0 },
        { type: 'VIP', price: 250.00, quantity: 0 }
      ]
    },
    {
      title: `Food & Wine Festival ${uniqueSuffix}`,
      description: 'A delightful celebration of culinary excellence featuring the finest local restaurants, wineries, and food artisans.',
      location: 'Waterfront Park, Seattle',
      category: 'Festivals',
      price: 65.00,
      capacity: 1200,
      status: 'upcoming',
      daysFromNow: 60,
      tickets: [
        { type: 'Tasting Pass', price: 65.00, quantity: 600 },
        { type: 'VIP Experience', price: 150.00, quantity: 100 }
      ]
    }
  ]
};

async function cleanupExistingData() {
  console.log('🧹 Cleaning up existing test data...\n');
  
  try {
    // Clean up in proper order due to foreign key constraints
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('organizers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Clean up auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    if (authUsers?.users) {
      for (const authUser of authUsers.users) {
        if (authUser.email?.includes('@testevents.com') || 
            authUser.email?.includes('@example.com')) {
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      }
    }
    
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.log('⚠️  Cleanup error (continuing anyway):', error.message, '\n');
  }
}

async function createCategories() {
  console.log('📂 Creating categories...\n');
  
  const createdCategories = [];
  
  for (const category of testData.categories) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      createdCategories.push(data);
      console.log(`✅ Category: ${category.name} (ID: ${data.id})`);
    } catch (error) {
      console.log(`❌ Failed to create category ${category.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📂 Created ${createdCategories.length}/3 categories\n`);
  return createdCategories;
}

async function createTestUser() {
  console.log('👤 Creating test user...\n');
  
  try {
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testData.user.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: testData.user.name,
        role: 'User'
      }
    });
    
    if (authError) throw authError;
    
    // Create user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testData.user.email,
        password: '',
        full_name: testData.user.name,
        role: 'User',
        metadata: {
          preferred_categories: [],
          preferred_locations: ['New York', 'Los Angeles'],
          max_price: 200
        }
      })
      .select()
      .single();
    
    if (profileError) throw profileError;
    
    console.log(`✅ Test User: ${testData.user.name}`);
    console.log(`   Email: ${testData.user.email}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   ID: ${authUser.user.id}\n`);
    
    return userProfile;
  } catch (error) {
    console.log(`❌ Failed to create test user: ${error.message}\n`);
    throw error;
  }
}

async function createOrganizerAndManager() {
  console.log('🏢 Creating organizer and manager...\n');
  
  try {
    // Create manager user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testData.organizer.manager.email,
      password: ORGANIZER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: testData.organizer.manager.name,
        role: 'Organizer'
      }
    });
    
    if (authError) throw authError;
    
    // Create manager profile
    const { data: managerProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testData.organizer.manager.email,
        password: '',
        full_name: testData.organizer.manager.name,
        role: 'Organizer',
        metadata: {
          organizer_manager: true,
          company_name: testData.organizer.company_name
        }
      })
      .select()
      .single();
    
    if (profileError) throw profileError;
    
    // Create organizer profile
    const { data: organizerProfile, error: organizerError } = await supabase
      .from('organizers')
      .insert({
        user_id: authUser.user.id,
        company_name: testData.organizer.company_name,
        description: testData.organizer.description,
        contact_email: testData.organizer.contact_email,
        contact_phone: '+1-555-0123',
        website_url: testData.organizer.website_url,
        business_address: testData.organizer.business_address,
        verified: true,
        verification_date: new Date().toISOString()
      })
      .select()
      .single();
    
    if (organizerError) throw organizerError;
    
    console.log(`✅ Organizer: ${testData.organizer.company_name}`);
    console.log(`   Manager: ${testData.organizer.manager.name}`);
    console.log(`   Email: ${testData.organizer.manager.email}`);
    console.log(`   Password: ${ORGANIZER_PASSWORD}`);
    console.log(`   Manager ID: ${authUser.user.id}`);
    console.log(`   Organizer ID: ${organizerProfile.id}\n`);
    
    return { managerProfile, organizerProfile };
  } catch (error) {
    console.log(`❌ Failed to create organizer: ${error.message}\n`);
    throw error;
  }
}

async function createEvents(organizerId, categories) {
  console.log('🎪 Creating events...\n');
  
  const createdEvents = [];
  
  for (const eventData of testData.events) {
    try {
      const category = categories.find(c => c.name === eventData.category);
      if (!category) {
        console.log(`❌ Category '${eventData.category}' not found for event ${eventData.title}`);
        continue;
      }
      
      // Calculate dates based on status
      let startDate, endDate;
      const now = new Date();
      
      if (eventData.status === 'past') {
        startDate = new Date(now.getTime() + eventData.daysFromNow * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hours later
      } else {
        startDate = new Date(now.getTime() + eventData.daysFromNow * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000); // 6 hours later
      }
      
      const slug = `${eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${runId}`;
      
      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          slug: slug,
          description: eventData.description,
          location: eventData.location,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          category_id: category.id,
          organizer_id: organizerId,
          price: eventData.price,
          capacity: eventData.capacity,
          image_url: `https://images.pexels.com/photos/${1000000 + Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg`
        })
        .select()
        .single();
      
      if (eventError) throw eventError;
      
      // Create tickets
      const eventTickets = [];
      for (const ticketData of eventData.tickets) {
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            event_id: event.id,
            type: ticketData.type,
            price: ticketData.price,
            quantity: ticketData.quantity
          })
          .select()
          .single();
        
        if (ticketError) {
          console.log(`   ⚠️  Failed to create ticket ${ticketData.type}: ${ticketError.message}`);
          continue;
        }
        
        eventTickets.push(ticket);
      }
      
      console.log(`✅ Event: ${eventData.title}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Status: ${eventData.status}`);
      console.log(`   Date: ${startDate.toLocaleDateString()}`);
      console.log(`   Location: ${eventData.location}`);
      console.log(`   Price: $${eventData.price}`);
      console.log(`   Tickets: ${eventTickets.length} types created`);
      
      createdEvents.push({ ...event, tickets: eventTickets, status: eventData.status });
      
    } catch (error) {
      console.log(`❌ Failed to create event ${eventData.title}: ${error.message}`);
    }
  }
  
  console.log(`\n🎪 Created ${createdEvents.length}/5 events\n`);
  return createdEvents;
}

async function createBookingsAndTransactions(userId, events) {
  console.log('🎫 Creating bookings and transactions...\n');
  
  const createdBookings = [];
  const createdTransactions = [];
  
  // Get events with tickets for booking
  const eventsWithTickets = events.filter(e => e.tickets && e.tickets.length > 0);
  
  if (eventsWithTickets.length < 2) {
    console.log('❌ Not enough events with tickets for booking creation\n');
    return { createdBookings, createdTransactions };
  }
  
  // Create 2 successful bookings
  for (let i = 0; i < 2; i++) {
    try {
      const event = eventsWithTickets[i];
      const ticket = event.tickets[0]; // Use first ticket type
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 tickets
      const totalPrice = ticket.price * quantity;
      
      // Create successful transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          event_id: event.id,
          ticket_id: ticket.id,
          amount: totalPrice,
          status: 'completed',
          type: 'payment'
        })
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      createdTransactions.push(transaction);
      
      // Create booking with QR code
      const qrCode = Buffer.from(JSON.stringify({
        tid: crypto.randomUUID(),
        uid: userId,
        eid: event.id,
        tkid: ticket.id,
        qty: quantity,
        price: ticket.price,
        ts: new Date().toISOString(),
        exp: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');
      
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          event_id: event.id,
          ticket_id: ticket.id,
          quantity: quantity,
          total_price: totalPrice,
          status: 'confirmed',
          qr_code: qrCode
        })
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      createdBookings.push(booking);
      
      console.log(`✅ Booking ${i + 1}: ${event.title}`);
      console.log(`   Ticket: ${ticket.type} × ${quantity}`);
      console.log(`   Amount: $${totalPrice}`);
      console.log(`   Status: confirmed`);
      
    } catch (error) {
      console.log(`❌ Failed to create booking ${i + 1}: ${error.message}`);
    }
  }
  
  // Create 1 failed transaction (no booking)
  try {
    const event = eventsWithTickets[2] || eventsWithTickets[0];
    const ticket = event.tickets[0];
    const totalPrice = ticket.price * 2;
    
    const { data: failedTransaction, error: failedError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        event_id: event.id,
        ticket_id: ticket.id,
        amount: totalPrice,
        status: 'failed',
        type: 'payment'
      })
      .select()
      .single();
    
    if (failedError) throw failedError;
    createdTransactions.push(failedTransaction);
    
    console.log(`✅ Failed Transaction: ${event.title}`);
    console.log(`   Amount: $${totalPrice}`);
    console.log(`   Status: failed`);
    
  } catch (error) {
    console.log(`❌ Failed to create failed transaction: ${error.message}`);
  }
  
  console.log(`\n🎫 Created ${createdBookings.length} bookings and ${createdTransactions.length} transactions\n`);
  return { createdBookings, createdTransactions };
}

async function createNotifications(userId, events) {
  console.log('📧 Creating notifications...\n');
  
  const notifications = [
    {
      type: 'booking',
      content: 'Your booking has been confirmed! Get ready for an amazing event experience.',
      channel: 'email',
      status: 'delivered'
    },
    {
      type: 'payment',
      content: 'Payment processed successfully. Your receipt has been sent to your email.',
      channel: 'email',
      status: 'delivered'
    },
    {
      type: 'reminder',
      content: 'Your event starts tomorrow! Don\'t forget to bring your ticket.',
      channel: 'push',
      status: 'delivered'
    },
    {
      type: 'marketing',
      content: 'New events added this week! Check out what\'s happening near you.',
      channel: 'email',
      status: 'delivered'
    }
  ];
  
  const createdNotifications = [];
  
  for (const notificationData of notifications) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notificationData.type,
          content: notificationData.content,
          channel: notificationData.channel,
          status: notificationData.status
        })
        .select()
        .single();
      
      if (error) throw error;
      createdNotifications.push(notification);
      
      console.log(`✅ Notification: ${notificationData.type} (${notificationData.channel})`);
      
    } catch (error) {
      console.log(`❌ Failed to create notification: ${error.message}`);
    }
  }
  
  console.log(`\n📧 Created ${createdNotifications.length}/4 notifications\n`);
  return createdNotifications;
}

async function createNotificationPreferences(userId) {
  console.log('⚙️  Creating notification preferences...\n');
  
  try {
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        booking_enabled: true,
        payment_enabled: true,
        marketing_enabled: true,
        reminder_enabled: true,
        preferred_channel: 'email'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Notification preferences created for user\n`);
    return preferences;
  } catch (error) {
    console.log(`❌ Failed to create notification preferences: ${error.message}\n`);
    return null;
  }
}

async function main() {
  console.log('🚀 HVFLVSPOT TEST DATA CREATION');
  console.log('━'.repeat(60));
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  console.log(`🆔 Run ID: ${runId} (${uniqueSuffix})`);
  console.log('━'.repeat(60) + '\n');
  
  try {
    // Step 1: Cleanup existing data
    await cleanupExistingData();
    
    // Step 2: Create categories
    const categories = await createCategories();
    
    // Step 3: Create test user
    const testUser = await createTestUser();
    
    // Step 4: Create organizer and manager
    const { managerProfile, organizerProfile } = await createOrganizerAndManager();
    
    // Step 5: Create events
    const events = await createEvents(managerProfile.id, categories);
    
    // Step 6: Create bookings and transactions
    const { createdBookings, createdTransactions } = await createBookingsAndTransactions(testUser.id, events);
    
    // Step 7: Create notifications
    const notifications = await createNotifications(testUser.id, events);
    
    // Step 8: Create notification preferences
    await createNotificationPreferences(testUser.id);
    
    // Final Summary
    console.log('🎉 TEST DATA CREATION COMPLETED!');
    console.log('━'.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   📂 Categories: ${categories.length}`);
    console.log(`   🎪 Events: ${events.length}`);
    console.log(`   👥 Users: 2 (1 test user + 1 organizer manager)`);
    console.log(`   🎫 Bookings: ${createdBookings.length}`);
    console.log(`   💳 Transactions: ${createdTransactions.length}`);
    console.log(`   📧 Notifications: ${notifications.length}`);
    console.log('━'.repeat(60) + '\n');
    
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('━'.repeat(40));
    console.log('👤 TEST USER:');
    console.log(`   Email: ${testData.user.email}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log('');
    console.log('🏢 ORGANIZER MANAGER:');
    console.log(`   Email: ${testData.organizer.manager.email}`);
    console.log(`   Password: ${ORGANIZER_PASSWORD}`);
    console.log(`   Company: ${testData.organizer.company_name}`);
    console.log('━'.repeat(40) + '\n');
    
    console.log('📂 CATEGORIES CREATED:');
    console.log('━'.repeat(40));
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
    });
    console.log('━'.repeat(40) + '\n');
    
    console.log('🎪 EVENTS CREATED:');
    console.log('━'.repeat(40));
    events.forEach((event, index) => {
      const statusEmoji = event.status === 'upcoming' ? '🟢' : 
                         event.status === 'past' ? '🔴' : '🟡';
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Status: ${statusEmoji} ${event.status}`);
      console.log(`   Date: ${new Date(event.start_date).toLocaleDateString()}`);
      console.log(`   Price: $${event.price}`);
      console.log('');
    });
    console.log('━'.repeat(40) + '\n');
    
    console.log('💡 NEXT STEPS:');
    console.log('1. Start the backend server: npm run dev:backend');
    console.log('2. Start the frontend: npm run dev');
    console.log('3. Test login with the credentials above');
    console.log('4. Browse events and test booking flow');
    console.log('5. Check organizer dashboard functionality');
    console.log('━'.repeat(60));
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main().catch(console.error);