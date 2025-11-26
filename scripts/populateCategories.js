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

const categories = [
  {
    name: 'Music',
    slug: 'music',
    description: 'Concerts, festivals, and live music events'
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Athletic competitions and sporting events'
  },
  {
    name: 'Comedy',
    slug: 'comedy',
    description: 'Stand-up comedy shows and humor events'
  },
  {
    name: 'Arts',
    slug: 'arts',
    description: 'Art exhibitions, galleries, and creative events'
  },
  {
    name: 'Festivals',
    slug: 'festivals',
    description: 'Cultural festivals and community celebrations'
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Shows, theater, and entertainment events'
  }
];

async function populateCategories() {
  console.log('🎨 POPULATING EVENT CATEGORIES');
  console.log('━'.repeat(50));
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  console.log(`📊 Creating ${categories.length} categories`);
  console.log('━'.repeat(50) + '\n');

  try {
    // First, check if categories already exist
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('*');

    if (checkError) {
      console.error('❌ Error checking existing categories:', checkError.message);
      throw checkError;
    }

    console.log(`📋 Found ${existingCategories?.length || 0} existing categories`);

    if (existingCategories && existingCategories.length > 0) {
      console.log('📂 Existing categories:');
      existingCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (${cat.slug})`);
      });
      console.log('');
    }

    // Insert or update categories
    const { data: insertedCategories, error: insertError } = await supabase
      .from('categories')
      .upsert(categories, { 
        onConflict: 'slug',
        ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting categories:', insertError.message);
      throw insertError;
    }

    console.log('✅ CATEGORIES POPULATED SUCCESSFULLY!');
    console.log('━'.repeat(50));
    console.log(`📊 Total categories: ${insertedCategories?.length || 0}`);
    console.log('');
    console.log('📂 CREATED CATEGORIES:');
    insertedCategories?.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name}`);
      console.log(`      Slug: ${category.slug}`);
      console.log(`      Description: ${category.description}`);
      console.log('');
    });

    // Verify categories are accessible
    console.log('🔍 VERIFYING CATEGORY ACCESS...');
    const { data: verifyCategories, error: verifyError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (verifyError) {
      console.error('❌ Error verifying categories:', verifyError.message);
    } else {
      console.log(`✅ Verification successful: ${verifyCategories?.length || 0} categories accessible`);
    }

    console.log('━'.repeat(50));
    console.log('🎉 CATEGORY POPULATION COMPLETED!');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('1. Refresh your frontend application');
    console.log('2. The categories should now appear in the Categories section');
    console.log('3. Test clicking on categories to filter events');
    console.log('━'.repeat(50));

  } catch (error) {
    console.error('❌ CATEGORY POPULATION FAILED:', error.message);
    console.error('');
    console.error('🔧 TROUBLESHOOTING:');
    console.error('1. Check your Supabase connection');
    console.error('2. Verify the categories table exists');
    console.error('3. Check RLS policies on categories table');
    console.error('4. Ensure SUPABASE_SERVICE_ROLE_KEY has proper permissions');
    process.exit(1);
  }
}

populateCategories().catch(console.error);