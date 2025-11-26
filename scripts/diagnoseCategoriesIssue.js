import { createClient } from '@supabase/supabase-js';
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

// Also create a regular client (like the frontend uses)
const supabaseRegular = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true
    }
  }
);

async function diagnoseCategoriesIssue() {
  console.log('🔍 DIAGNOSING CATEGORIES ISSUE');
  console.log('━'.repeat(60));
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using Service Role Key: ${supabaseServiceKey ? 'Yes' : 'No'}`);
  console.log(`🔑 Using Anon Key: ${process.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);
  console.log('━'.repeat(60) + '\n');

  try {
    // Test 1: Check if categories table exists and has data (admin client)
    console.log('📋 TEST 1: Categories table check (Admin Client)');
    console.log('━'.repeat(40));
    
    const { data: adminCategories, error: adminError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (adminError) {
      console.log('❌ Admin client error:', adminError.message);
      console.log('   Code:', adminError.code);
      console.log('   Details:', adminError.details);
    } else {
      console.log(`✅ Admin client: Found ${adminCategories?.length || 0} categories`);
      if (adminCategories && adminCategories.length > 0) {
        adminCategories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.name} (ID: ${cat.id}, Slug: ${cat.slug})`);
        });
      }
    }
    console.log('');

    // Test 2: Check categories with regular client (like frontend)
    console.log('📋 TEST 2: Categories table check (Regular Client - Frontend Simulation)');
    console.log('━'.repeat(40));
    
    const { data: regularCategories, error: regularError } = await supabaseRegular
      .from('categories')
      .select('*')
      .order('name');

    if (regularError) {
      console.log('❌ Regular client error:', regularError.message);
      console.log('   Code:', regularError.code);
      console.log('   Details:', regularError.details);
      console.log('   This might be the issue - frontend can\'t access categories!');
    } else {
      console.log(`✅ Regular client: Found ${regularCategories?.length || 0} categories`);
      if (regularCategories && regularCategories.length > 0) {
        regularCategories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.name} (ID: ${cat.id}, Slug: ${cat.slug})`);
        });
      } else {
        console.log('⚠️  Regular client returned empty array - this is likely the issue!');
      }
    }
    console.log('');

    // Test 3: Check RLS policies on categories table
    console.log('📋 TEST 3: RLS Policies Check');
    console.log('━'.repeat(40));
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categories');

    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message);
    } else {
      console.log(`📜 Found ${policies?.length || 0} RLS policies for categories table:`);
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
          console.log(`      Roles: ${policy.roles}`);
          console.log(`      Using: ${policy.qual || 'N/A'}`);
          console.log(`      Check: ${policy.with_check || 'N/A'}`);
        });
      } else {
        console.log('⚠️  No RLS policies found - this might be the issue!');
      }
    }
    console.log('');

    // Test 4: Check events and their category relationships
    console.log('📋 TEST 4: Events-Categories Relationship Check');
    console.log('━'.repeat(40));
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, category_id')
      .limit(10);

    if (eventsError) {
      console.log('❌ Error checking events:', eventsError.message);
    } else {
      console.log(`🎪 Found ${events?.length || 0} events (showing first 10):`);
      if (events && events.length > 0) {
        events.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.title}`);
          console.log(`      Category ID: ${event.category_id || 'NULL'}`);
        });
        
        // Check if any events have valid category IDs
        const eventsWithCategories = events.filter(e => e.category_id);
        console.log(`   📊 Events with category IDs: ${eventsWithCategories.length}/${events.length}`);
        
        if (eventsWithCategories.length > 0) {
          // Check if these category IDs actually exist
          const categoryIds = [...new Set(eventsWithCategories.map(e => e.category_id))];
          console.log(`   🔗 Unique category IDs in events: ${categoryIds.length}`);
          
          const { data: linkedCategories } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', categoryIds);
          
          console.log(`   ✅ Valid categories found: ${linkedCategories?.length || 0}/${categoryIds.length}`);
          if (linkedCategories) {
            linkedCategories.forEach(cat => {
              console.log(`      - ${cat.name} (${cat.id})`);
            });
          }
        }
      } else {
        console.log('   ⚠️  No events found in database');
      }
    }
    console.log('');

    // Test 5: Check table permissions and RLS status
    console.log('📋 TEST 5: Table Permissions and RLS Status');
    console.log('━'.repeat(40));
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'categories');

    if (tableError) {
      console.log('❌ Error checking table info:', tableError.message);
    } else {
      console.log('📊 Categories table info:', tableInfo);
    }

    // Check RLS status
    const { data: rlsInfo, error: rlsError } = await supabase
      .rpc('pg_get_rls', { table_name: 'categories' })
      .single();

    if (rlsError) {
      console.log('⚠️  Could not check RLS status:', rlsError.message);
    } else {
      console.log('🔒 RLS Status:', rlsInfo ? 'Enabled' : 'Disabled');
    }

    console.log('');

    // Summary and recommendations
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('━'.repeat(60));
    
    if (adminCategories?.length > 0 && (!regularCategories || regularCategories.length === 0)) {
      console.log('🎯 LIKELY ISSUE: RLS Policy Problem');
      console.log('   - Admin client can see categories ✅');
      console.log('   - Regular client cannot see categories ❌');
      console.log('   - Frontend uses regular client (anon key)');
      console.log('   - Need to check/fix RLS policies for public access');
    } else if (!adminCategories || adminCategories.length === 0) {
      console.log('🎯 LIKELY ISSUE: No Categories in Database');
      console.log('   - Categories table exists but is empty');
      console.log('   - Need to run category population script');
    } else if (adminCategories?.length > 0 && regularCategories?.length > 0) {
      console.log('🎯 LIKELY ISSUE: Frontend Component Problem');
      console.log('   - Both clients can see categories ✅');
      console.log('   - Issue is in the Svelte component logic');
    }

    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ DIAGNOSIS FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

diagnoseCategoriesIssue().catch(console.error);