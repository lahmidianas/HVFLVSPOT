import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../src/utils/auth.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Generate unique identifiers for this run
const runId = Date.now();
const uniqueSuffix = Math.random().toString(36).substring(2, 8);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = process.env.PUBLIC_API_BASE || 'http://localhost:3000';

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

// Rich test data
const organizerData = [
  {
    company_name: `Stellar Events Co. ${uniqueSuffix}`,
    description: 'Premium event planning and management for corporate and private events',
    business_address: '123 Broadway, New York, NY 10001',
    contact_email: `contact.${uniqueSuffix}@stellarevents.com`,
    website_url: 'https://stellarevents.com',
    manager: {
      name: 'Sarah Johnson',
      email: `sarah.johnson.${uniqueSuffix}@stellarevents.com`
    }
  },
  {
    company_name: `Metro Music Productions ${uniqueSuffix}`,
    description: 'Live music events, concerts, and festival production',
    business_address: '456 Music Row, Nashville, TN 37203',
    contact_email: `info.${uniqueSuffix}@metromusicprod.com`,
    website_url: 'https://metromusicproductions.com',
    manager: {
      name: 'Michael Rodriguez',
      email: `michael.rodriguez.${uniqueSuffix}@metromusicprod.com`
    }
  },
  {
    company_name: `Urban Festival Group ${uniqueSuffix}`,
    description: 'Street festivals, food events, and community celebrations',
    business_address: '789 Festival Ave, Austin, TX 78701',
    contact_email: `hello.${uniqueSuffix}@urbanfestival.com`,
    website_url: 'https://urbanfestivalgroup.com',
    manager: {
      name: 'Jessica Chen',
      email: `jessica.chen.${uniqueSuffix}@urbanfestival.com`
    }
  },
  {
    company_name: `Coastal Concert Series ${uniqueSuffix}`,
    description: 'Beachside concerts and outdoor music experiences',
    business_address: '321 Ocean Drive, Miami, FL 33139',
    contact_email: `bookings.${uniqueSuffix}@coastalconcerts.com`,
    website_url: 'https://coastalconcertseries.com',
    manager: {
      name: 'David Thompson',
      email: `david.thompson.${uniqueSuffix}@coastalconcerts.com`
    }
  },
  {
    company_name: `Elite Sports Events ${uniqueSuffix}`,
    description: 'Professional sports events and athletic competitions',
    business_address: '654 Stadium Blvd, Chicago, IL 60601',
    contact_email: `events.${uniqueSuffix}@elitesports.com`,
    website_url: 'https://elitesportsevents.com',
    manager: {
      name: 'Amanda Wilson',
      email: `amanda.wilson.${uniqueSuffix}@elitesports.com`
    }
  }
];

const eventTemplates = [
  // Music Events
  { title: 'Summer Music Festival', category: 'Music', type: 'festival', basePrice: 89.99 },
  { title: 'Jazz Night at the Blue Note', category: 'Music', type: 'concert', basePrice: 45.00 },
  { title: 'Electronic Dance Experience', category: 'Music', type: 'concert', basePrice: 65.00 },
  
  // Sports Events
  { title: 'City Marathon Championship', category: 'Sports', type: 'competition', basePrice: 25.00 },
  { title: 'Basketball Tournament Finals', category: 'Sports', type: 'tournament', basePrice: 35.00 },
  { title: 'Tennis Open Qualifier', category: 'Sports', type: 'tournament', basePrice: 20.00 },
  
  // Cultural Events
  { title: 'Art & Wine Festival', category: 'Arts', type: 'festival', basePrice: 55.00 },
  { title: 'Food Truck Rally', category: 'Food', type: 'festival', basePrice: 15.00 },
  { title: 'Heritage Cultural Celebration', category: 'Culture', type: 'festival', basePrice: 30.00 },
  
  // Entertainment
  { title: 'Comedy Night Showcase', category: 'Entertainment', type: 'show', basePrice: 40.00 },
  { title: 'Film Festival Premiere', category: 'Entertainment', type: 'screening', basePrice: 25.00 },
  { title: 'Tech Conference 2025', category: 'Business', type: 'conference', basePrice: 199.00 },
  
  // Nightlife
  { title: 'Rooftop Party Experience', category: 'Nightlife', type: 'party', basePrice: 75.00 },
  { title: 'DJ Battle Championship', category: 'Music', type: 'competition', basePrice: 50.00 },
  { title: 'Sunset Beach Concert', category: 'Music', type: 'concert', basePrice: 60.00 }
];

const userData = [
  { name: 'Emma Thompson', email: `emma.thompson.${uniqueSuffix}@email.com` },
  { name: 'Liam Johnson', email: `liam.johnson.${uniqueSuffix}@email.com` },
  { name: 'Olivia Davis', email: `olivia.davis.${uniqueSuffix}@email.com` },
  { name: 'Noah Wilson', email: `noah.wilson.${uniqueSuffix}@email.com` },
  { name: 'Ava Martinez', email: `ava.martinez.${uniqueSuffix}@email.com` },
  { name: 'Ethan Brown', email: `ethan.brown.${uniqueSuffix}@email.com` },
  { name: 'Sophia Garcia', email: `sophia.garcia.${uniqueSuffix}@email.com` },
  { name: 'Mason Miller', email: `mason.miller.${uniqueSuffix}@email.com` },
  { name: 'Isabella Jones', email: `isabella.jones.${uniqueSuffix}@email.com` },
  { name: 'William Taylor', email: `william.taylor.${uniqueSuffix}@email.com` }
];

const locations = [
  'Madison Square Garden, New York',
  'Hollywood Bowl, Los Angeles',
  'Red Rocks Amphitheatre, Colorado',
  'Navy Pier, Chicago',
  'South Beach, Miami',
  'Austin Convention Center, Texas',
  'Pike Place Market, Seattle',
  'Golden Gate Park, San Francisco'
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(daysFromNow, variance = 30) {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + daysFromNow);
  const varianceMs = variance * 24 * 60 * 60 * 1000;
  const randomOffset = (Math.random() - 0.5) * varianceMs;
  return new Date(baseDate.getTime() + randomOffset);
}

function generateTicketTypes(basePrice) {
  const types = [
    { type: 'General Admission', priceMultiplier: 1.0, quantityRange: [100, 300] },
    { type: 'VIP', priceMultiplier: 2.5, quantityRange: [20, 50] },
    { type: 'Early Bird', priceMultiplier: 0.8, quantityRange: [50, 100] },
    { type: 'Premium', priceMultiplier: 1.8, quantityRange: [30, 80] },
    { type: 'Student', priceMultiplier: 0.6, quantityRange: [40, 100] }
  ];
  
  // Select 2-3 random ticket types
  const selectedTypes = [];
  const numTypes = Math.floor(Math.random() * 2) + 2; // 2-3 types
  
  // Always include General Admission
  selectedTypes.push(types[0]);
  
  // Add random additional types
  for (let i = 1; i < numTypes && selectedTypes.length < 3; i++) {
    const randomType = types[Math.floor(Math.random() * (types.length - 1)) + 1];
    if (!selectedTypes.find(t => t.type === randomType.type)) {
      selectedTypes.push(randomType);
    }
  }
  
  return selectedTypes.map(typeData => ({
    type: typeData.type,
    price: Math.round(basePrice * typeData.priceMultiplier * 100) / 100,
    quantity: Math.floor(Math.random() * (typeData.quantityRange[1] - typeData.quantityRange[0])) + typeData.quantityRange[0]
  }));
}

async function cleanupExistingData() {
  console.log('🧹 Cleaning up existing test data...\n');
  
  try {
    // Clean up Supabase Auth users first (this is the key fix)
    console.log('🔐 Cleaning up Supabase Auth users...');
    
    // Get all users from auth
    const { data: authUsers, error: authListError } = await supabase.auth.admin.listUsers();
    
    if (!authListError && authUsers?.users) {
      for (const authUser of authUsers.users) {
        // Delete test users (those with test email patterns)
        if (authUser.email?.includes('@stellarevents.com') ||
            authUser.email?.includes('@metromusicprod.com') ||
            authUser.email?.includes('@urbanfestival.com') ||
            authUser.email?.includes('@coastalconcerts.com') ||
            authUser.email?.includes('@elitesports.com') ||
            authUser.email?.includes('@email.com')) {
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      }
    }
    
    console.log('✅ Auth users cleaned up');
    
    // Clean up in proper order due to foreign key constraints
    console.log('🗄️  Cleaning up database tables...');
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('organizers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Clean up categories - delete all existing categories to avoid unique constraint issues
    console.log('📂 Cleaning up existing categories...');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Categories cleaned up');
    
    console.log('✅ Database tables cleaned up');
    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.log('⚠️  Cleanup error (continuing anyway):', error.message, '\n');
  }
}

async function createCategories() {
  console.log('📂 Creating event categories...\n');
  
  const categories = [
    { name: 'Music', slug: 'music', description: 'Concerts, festivals, and live music events' },
    { name: 'Sports', slug: 'sports', description: 'Athletic competitions and sporting events' },
    { name: 'Arts', slug: 'arts', description: 'Art exhibitions, galleries, and creative events' },
    { name: 'Food', slug: 'food', description: 'Food festivals, tastings, and culinary events' },
    { name: 'Culture', slug: 'culture', description: 'Cultural celebrations and heritage events' },
    { name: 'Entertainment', slug: 'entertainment', description: 'Shows, comedy, and entertainment events' },
    { name: 'Business', slug: 'business', description: 'Conferences, networking, and business events' },
    { name: 'Nightlife', slug: 'nightlife', description: 'Parties, clubs, and nightlife events' }
  ];
  
  const createdCategories = [];
  
  for (const category of categories) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      createdCategories.push(data);
      console.log(`✅ Category: ${category.name}`);
    } catch (error) {
      console.log(`❌ Failed to create category ${category.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📂 Created ${createdCategories.length}/8 categories\n`);
  
  // If no categories were created, create a default one to prevent event creation failures
  if (createdCategories.length === 0) {
    console.log('⚠️  No categories created, creating default category...');
    try {
      const { data: defaultCategory, error } = await supabase
        .from('categories')
        .insert({
          name: 'General',
          slug: `general-${runId}`,
          description: 'General events category'
        })
        .select()
        .single();
      
      if (!error && defaultCategory) {
        createdCategories.push(defaultCategory);
        console.log('✅ Default category created\n');
      }
    } catch (defaultError) {
      console.log('❌ Failed to create default category:', defaultError.message, '\n');
    }
  }
  
  return createdCategories;
}

async function createOrganizers() {
  console.log('🏢 Creating organizer accounts...\n');
  
  const createdOrganizers = [];
  const createdManagers = [];
  const failedCreations = [];
  
  for (let i = 0; i < organizerData.length; i++) {
    const orgData = organizerData[i];
    
    try {
      console.log(`[${i + 1}/5] Creating: ${orgData.company_name}`);
      
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
      
      if (authError) throw authError;
      
      // Create manager profile
      const { data: managerProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: orgData.manager.email,
          password: '',
          full_name: orgData.manager.name,
          role: 'Organizer',
          metadata: { organizer_manager: true }
        })
        .select()
        .single();
      
      if (profileError) throw profileError;
      
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
          verified: true,
          verification_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (organizerError) throw organizerError;
      
      console.log(`   ✅ Manager: ${orgData.manager.name}`);
      console.log(`   ✅ Company: ${orgData.company_name}`);
      
      createdOrganizers.push({
        ...organizerProfile,
        manager_id: authUser.user.id
      });
      
      createdManagers.push({
        id: authUser.user.id,
        email: orgData.manager.email,
        name: orgData.manager.name,
        company: orgData.company_name
      });
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failedCreations.push({ ...orgData, error: error.message });
    }
  }
  
  console.log(`\n🏢 Created ${createdOrganizers.length}/5 organizers\n`);
  
  if (createdOrganizers.length === 0) {
    console.log('❌ CRITICAL: No organizers created. Cannot proceed with events.');
    console.log('   This will cause all subsequent steps to fail.\n');
  }
  
  return { createdOrganizers, createdManagers, failedCreations };
}

async function createUsers() {
  console.log('👥 Creating user accounts...\n');
  
  const createdUsers = [];
  const failedUsers = [];
  
  for (let i = 0; i < userData.length; i++) {
    const user = userData[i];
    
    try {
      console.log(`[${i + 1}/10] Creating: ${user.name}`);
      
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'TestUser123!',
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          role: 'User'
        }
      });
      
      if (authError) throw authError;
      
      // Create user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: user.email,
          password: '',
          full_name: user.name,
          role: 'User',
          metadata: {
            preferred_categories: [],
            preferred_locations: [getRandomElement(locations)],
            max_price: Math.floor(Math.random() * 200) + 50
          }
        })
        .select()
        .single();
      
      if (profileError) throw profileError;
      
      console.log(`   ✅ ${user.name} (${user.email})`);
      createdUsers.push(userProfile);
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failedUsers.push({ ...user, error: error.message });
    }
  }
  
  console.log(`\n👥 Created ${createdUsers.length}/10 users\n`);
  
  if (createdUsers.length === 0) {
    console.log('❌ CRITICAL: No users created. Cannot proceed with bookings.');
    console.log('   This will cause booking and notification steps to fail.\n');
  }
  
  return { createdUsers, failedUsers };
}

async function createEvents(organizers, categories) {
  console.log('🎪 Creating events...\n');
  
  if (!organizers || organizers.length === 0) {
    console.log('❌ SKIPPING EVENT CREATION: No organizers available');
    console.log('   Cannot create events without organizers.\n');
    return { createdEvents: [], createdTickets: [] };
  }
  
  if (!categories || categories.length === 0) {
    console.log('❌ SKIPPING EVENT CREATION: No categories available');
    console.log('   Cannot create events without categories.\n');
    return { createdEvents: [], createdTickets: [] };
  }
  
  const createdEvents = [];
  const createdTickets = [];
  let upcomingCount = 0;
  let pastCount = 0;
  let soldOutCount = 0;
  let failedEvents = [];
  
  for (let i = 0; i < 15; i++) {
    const organizer = organizers[i % organizers.length];
    const template = eventTemplates[i % eventTemplates.length];
    
    // Find matching category or use first available category as fallback
    let category = categories.find(c => c.name === template.category);
    if (!category) {
      category = categories[0]; // Use first available category
      console.log(`   ⚠️  Category '${template.category}' not found, using '${category.name}' instead`);
    }
    
    if (!category || !category.id) {
      console.log(`   ❌ No valid category available for event ${template.title}`);
      failedEvents.push({ template, error: 'No valid category available' });
      continue;
    }
    
    try {
      // Determine event timing and status
      let startDate, endDate, isSoldOut = false;
      
      if (pastCount < 3 && Math.random() < 0.3) {
        // Past event
        startDate = getRandomDate(-30, 20); // 10-50 days ago
        endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hours later
        pastCount++;
      } else if (soldOutCount < 2 && upcomingCount >= 5 && Math.random() < 0.5) {
        // Sold out event
        startDate = getRandomDate(15, 30); // 15-45 days from now
        endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);
        isSoldOut = true;
        soldOutCount++;
      } else {
        // Upcoming event
        startDate = getRandomDate(7, 60); // 7-67 days from now
        endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000);
        upcomingCount++;
      }
      
      const eventTitle = `${template.title} ${new Date().getFullYear()} ${uniqueSuffix}`;
      const slug = `${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${runId}`;
      
      console.log(`[${i + 1}/15] Creating: ${eventTitle}`);
      console.log(`   Organizer: ${organizer.company_name}`);
      console.log(`   Type: ${pastCount <= 3 && startDate < new Date() ? 'Past' : soldOutCount <= 2 && isSoldOut ? 'Sold Out' : 'Upcoming'}`);
      
      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: eventTitle,
          slug: slug,
          description: `Join us for an amazing ${template.type} experience. ${template.title} brings together the best in ${template.category.toLowerCase()} for an unforgettable event.`,
          location: getRandomElement(locations),
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          category_id: category.id,
          organizer_id: organizer.manager_id,
          price: template.basePrice,
          capacity: Math.floor(Math.random() * 800) + 200,
          image_url: `https://images.pexels.com/photos/${1000000 + Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg`
        })
        .select()
        .single();
      
      if (eventError) throw eventError;
      
      // Create ticket types
      const ticketTypes = generateTicketTypes(template.basePrice);
      const eventTickets = [];
      
      for (const ticketType of ticketTypes) {
        const quantity = isSoldOut ? 0 : ticketType.quantity;
        
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            event_id: event.id,
            type: ticketType.type,
            price: ticketType.price,
            quantity: quantity
          })
          .select()
          .single();
        
        if (ticketError) {
          console.log(`   ⚠️  Ticket creation failed: ${ticketError.message}`);
          continue;
        }
        
        eventTickets.push(ticket);
        createdTickets.push(ticket);
      }
      
      console.log(`   ✅ Event created with ${eventTickets.length} ticket types`);
      createdEvents.push({ ...event, tickets: eventTickets });
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failedEvents.push({ template, error: error.message });
    }
  }
  
  console.log(`\n🎪 Created ${createdEvents.length}/15 events`);
  console.log(`   📅 Upcoming: ${upcomingCount}`);
  console.log(`   📆 Past: ${pastCount}`);
  console.log(`   🚫 Sold Out: ${soldOutCount}`);
  if (failedEvents.length > 0) {
    console.log(`   ❌ Failed: ${failedEvents.length}`);
  }
  console.log(`🎫 Created ${createdTickets.length} ticket types\n`);
  
  return { createdEvents, createdTickets };
}

async function createBookingsAndTransactions(users, events) {
  console.log('🎫 Creating bookings and transactions...\n');
  
  if (!users || users.length === 0) {
    console.log('❌ SKIPPING BOOKINGS: No users available');
    console.log('   Cannot create bookings without users.\n');
    return { createdBookings: [], createdTransactions: [] };
  }
  
  if (!events || events.length === 0) {
    console.log('❌ SKIPPING BOOKINGS: No events available');
    console.log('   Cannot create bookings without events.\n');
    return { createdBookings: [], createdTransactions: [] };
  }
  
  const createdBookings = [];
  const createdTransactions = [];
  let successfulBookings = 0;
  let failedBookings = 0;
  let refundedBookings = 0;
  let skippedBookings = 0;
  
  for (let i = 0; i < 30; i++) {
    try {
      const user = getRandomElement(users);
      const eventsWithTickets = events.filter(e => e.tickets && e.tickets.length > 0);
      
      if (eventsWithTickets.length === 0) {
        console.log(`[${i + 1}/30] Skipping: No events with tickets available`);
        skippedBookings++;
        continue;
      }
      
      const event = getRandomElement(eventsWithTickets);
      const ticket = getRandomElement(event.tickets);
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 tickets
      const totalPrice = ticket.price * quantity;
      
      console.log(`[${i + 1}/30] Booking: ${user.full_name} → ${event.title}`);
      
      // Determine booking status
      let bookingStatus = 'confirmed';
      let transactionStatus = 'completed';
      
      if (failedBookings < 3 && Math.random() < 0.1) {
        bookingStatus = 'failed';
        transactionStatus = 'failed';
        failedBookings++;
      } else if (refundedBookings < 5 && successfulBookings > 10 && Math.random() < 0.2) {
        bookingStatus = 'refunded';
        transactionStatus = 'refunded';
        refundedBookings++;
      } else {
        successfulBookings++;
      }
      
      // Create transaction first
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          event_id: event.id,
          ticket_id: ticket.id,
          amount: totalPrice,
          status: transactionStatus,
          type: 'payment'
        })
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      createdTransactions.push(transaction);
      
      // Create booking if transaction successful
      if (transactionStatus !== 'failed') {
        const qrCode = Buffer.from(JSON.stringify({
          tid: crypto.randomUUID(),
          uid: user.id,
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
            user_id: user.id,
            event_id: event.id,
            ticket_id: ticket.id,
            quantity: quantity,
            total_price: totalPrice,
            status: bookingStatus,
            qr_code: qrCode
          })
          .select()
          .single();
        
        if (bookingError) throw bookingError;
        createdBookings.push(booking);
        
        // Create refund transaction if booking was refunded
        if (bookingStatus === 'refunded') {
          const { data: refundTransaction, error: refundError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              event_id: event.id,
              ticket_id: ticket.id,
              amount: totalPrice,
              status: 'completed',
              type: 'refund',
              reference_id: transaction.id
            })
            .select()
            .single();
          
          if (!refundError) {
            createdTransactions.push(refundTransaction);
          }
        }
      }
      
      console.log(`   ✅ ${bookingStatus} booking (${ticket.type})`);
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      skippedBookings++;
    }
  }
  
  console.log(`\n🎫 Created ${createdBookings.length} bookings`);
  console.log(`   ✅ Successful: ${successfulBookings}`);
  console.log(`   ❌ Failed: ${failedBookings}`);
  console.log(`   🔄 Refunded: ${refundedBookings}`);
  if (skippedBookings > 0) {
    console.log(`   ⏭️  Skipped: ${skippedBookings}`);
  }
  console.log(`💳 Created ${createdTransactions.length} transactions\n`);
  
  return { createdBookings, createdTransactions };
}

async function createNotifications(users, events) {
  console.log('📧 Creating notifications...\n');
  
  if (!users || users.length === 0) {
    console.log('❌ SKIPPING NOTIFICATIONS: No users available');
    console.log('   Cannot create notifications without users.\n');
    return [];
  }
  
  const notificationTypes = [
    { type: 'booking', content: 'Your booking has been confirmed! Get ready for an amazing event.', channel: 'email' },
    { type: 'payment', content: 'Payment processed successfully. Receipt attached.', channel: 'email' },
    { type: 'reminder', content: 'Your event starts in 24 hours! Don\'t forget to bring your ticket.', channel: 'push' },
    { type: 'marketing', content: 'New events added! Check out what\'s happening this weekend.', channel: 'email' },
    { type: 'reminder', content: 'Event starts in 2 hours! See you there!', channel: 'sms' },
    { type: 'booking', content: 'Booking cancelled and refund processed.', channel: 'email' },
    { type: 'marketing', content: 'Early bird tickets now available for upcoming events!', channel: 'push' }
  ];
  
  const createdNotifications = [];
  let failedNotifications = 0;
  
  for (let i = 0; i < 20; i++) {
    try {
      const user = getRandomElement(users);
      const notificationTemplate = getRandomElement(notificationTypes);
      
      console.log(`[${i + 1}/20] Notification: ${notificationTemplate.type} → ${user.full_name}`);
      
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notificationTemplate.type,
          content: notificationTemplate.content,
          channel: notificationTemplate.channel,
          status: Math.random() < 0.9 ? 'delivered' : 'failed',
          error: Math.random() < 0.1 ? 'Simulated delivery failure' : null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`   ✅ ${notificationTemplate.channel} notification`);
      createdNotifications.push(notification);
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failedNotifications++;
    }
  }
  
  console.log(`\n📧 Created ${createdNotifications.length}/20 notifications`);
  if (failedNotifications > 0) {
    console.log(`   ❌ Failed: ${failedNotifications}`);
  }
  console.log('');
  
  return createdNotifications;
}

async function createNotificationPreferences(users) {
  console.log('⚙️  Creating notification preferences...\n');
  
  if (!users || users.length === 0) {
    console.log('❌ SKIPPING PREFERENCES: No users available\n');
    return [];
  }
  
  const createdPreferences = [];
  
  for (const user of users) {
    try {
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          booking_enabled: true,
          payment_enabled: true,
          marketing_enabled: Math.random() < 0.7, // 70% enable marketing
          reminder_enabled: true,
          preferred_channel: getRandomElement(['email', 'push', 'sms'])
        })
        .select()
        .single();
      
      if (error) throw error;
      createdPreferences.push(preferences);
      
    } catch (error) {
      console.log(`⚠️  Failed to create preferences for ${user.full_name}: ${error.message}`);
    }
  }
  
  console.log(`⚙️  Created ${createdPreferences.length}/${users.length} notification preferences\n`);
  return createdPreferences;
}

async function verifyDataIntegrity() {
  console.log('🔍 Verifying data integrity...\n');
  
  try {
    // Count all created records
    const [
      { count: organizerCount },
      { count: userCount },
      { count: eventCount },
      { count: ticketCount },
      { count: bookingCount },
      { count: transactionCount },
      { count: notificationCount }
    ] = await Promise.all([
      supabase.from('organizers').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('tickets').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true })
    ]);
    
    console.log('📊 DATABASE RECORD COUNTS:');
    console.log(`   🏢 Organizers: ${organizerCount}`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🎪 Events: ${eventCount}`);
    console.log(`   🎫 Tickets: ${ticketCount}`);
    console.log(`   📝 Bookings: ${bookingCount}`);
    console.log(`   💳 Transactions: ${transactionCount}`);
    console.log(`   📧 Notifications: ${notificationCount}\n`);
    
    return {
      organizers: organizerCount,
      users: userCount,
      events: eventCount,
      tickets: ticketCount,
      bookings: bookingCount,
      transactions: transactionCount,
      notifications: notificationCount
    };
    
  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}\n`);
    return null;
  }
}

async function getSampleCredentials(managers, users, events) {
  console.log('🔑 SAMPLE LOGIN CREDENTIALS:\n');
  
  if (!users || users.length === 0) {
    console.log('❌ No sample user credentials available\n');
    return { sampleUser: null, sampleManager: null, sampleEvents: [] };
  }
  
  // Sample user
  const sampleUser = users[0];
  console.log('👤 SAMPLE USER:');
  console.log(`   Email: ${sampleUser.email}`);
  console.log(`   Password: TestUser123!`);
  console.log(`   Name: ${sampleUser.full_name}\n`);
  
  // Sample organizer manager
  if (managers && managers.length > 0) {
    const sampleManager = managers[0];
    console.log('🏢 SAMPLE ORGANIZER MANAGER:');
    console.log(`   Email: ${sampleManager.email}`);
    console.log(`   Password: OrgManager123!`);
    console.log(`   Name: ${sampleManager.name}`);
    console.log(`   Company: ${sampleManager.company}\n`);
  } else {
    console.log('❌ No sample manager credentials available\n');
  }
  
  // Sample events
  if (events && events.length > 0) {
    console.log('🎪 SAMPLE EVENT IDs FOR TESTING:');
    const upcomingEvents = events.filter(e => new Date(e.start_date) > new Date()).slice(0, 3);
    upcomingEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title}`);
      console.log(`      ID: ${event.id}`);
      console.log(`      Date: ${new Date(event.start_date).toLocaleDateString()}`);
      console.log(`      Price: $${event.price}\n`);
    });
    
    return { sampleUser, sampleManager: managers?.[0], sampleEvents: upcomingEvents };
  } else {
    console.log('❌ No sample events available\n');
    return { sampleUser, sampleManager: managers?.[0], sampleEvents: [] };
  }
}

async function main() {
  console.log('🚀 HVFLVSPOT RICH DATASET CREATION');
  console.log('━'.repeat(60));
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  console.log(`🆔 Run ID: ${runId} (${uniqueSuffix})`);
  console.log(`📊 Creating comprehensive test dataset...`);
  console.log('━'.repeat(60) + '\n');
  
  try {
    // Step 1: Cleanup
    await cleanupExistingData();
    
    // Step 2: Create categories
    const categories = await createCategories();
    
    // Step 3: Create organizers and managers
    const { createdOrganizers, createdManagers, failedCreations } = await createOrganizers();
    
    // Step 4: Create regular users
    const { createdUsers, failedUsers } = await createUsers();
    
    // Step 5: Create events and tickets (only if organizers exist)
    const { createdEvents, createdTickets } = await createEvents(createdOrganizers, categories);
    
    // Step 6: Create bookings and transactions (only if users and events exist)
    const { createdBookings, createdTransactions } = await createBookingsAndTransactions(createdUsers, createdEvents);
    
    // Step 7: Create notifications (only if users exist)
    const createdNotifications = await createNotifications(createdUsers, createdEvents);
    
    // Step 8: Create notification preferences (only if users exist)
    await createNotificationPreferences(createdUsers);
    
    // Step 9: Verify data integrity
    const counts = await verifyDataIntegrity();
    
    // Step 10: Get sample credentials
    const samples = await getSampleCredentials(createdManagers, createdUsers, createdEvents);
    
    // Final Summary
    console.log('🎉 DATASET CREATION COMPLETED!');
    console.log('━'.repeat(60));
    console.log('📊 FINAL SUMMARY:');
    console.log(`   🏢 Organizers: ${counts?.organizers || createdOrganizers.length}`);
    console.log(`   🎪 Events: ${counts?.events || createdEvents.length}`);
    console.log(`   🎫 Ticket Types: ${counts?.tickets || createdTickets.length}`);
    console.log(`   👥 Users: ${counts?.users || createdUsers.length}`);
    console.log(`   📝 Bookings: ${counts?.bookings || createdBookings.length}`);
    console.log(`   💳 Transactions: ${counts?.transactions || createdTransactions.length}`);
    console.log(`   📧 Notifications: ${counts?.notifications || createdNotifications.length}`);
    console.log('');
    console.log('🌐 SUPABASE CONFIGURATION:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Mode: Direct database operations`);
    console.log(`   Run ID: ${runId}`);
    console.log('');
    
    // Show any failures
    if (failedCreations && failedCreations.length > 0) {
      console.log('⚠️  ORGANIZER CREATION FAILURES:');
      failedCreations.forEach((org, index) => {
        console.log(`   ${index + 1}. ${org.company_name} - ${org.error}`);
      });
      console.log('');
    }
    
    if (failedUsers && failedUsers.length > 0) {
      console.log('⚠️  USER CREATION FAILURES:');
      failedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} - ${user.error}`);
      });
      console.log('');
    }
    
    console.log('💡 NEXT STEPS:');
    console.log('1. Test login with sample credentials above');
    console.log('2. Browse events in the frontend');
    console.log('3. Test booking flow with sample event IDs');
    console.log('4. Verify organizer dashboard functionality');
    console.log('5. Check notification preferences in user settings');
    console.log('━'.repeat(60));
    
    
  } catch (error) {
    console.error('❌ Dataset creation failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);