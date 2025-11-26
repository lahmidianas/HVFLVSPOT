import { supabase } from '../lib/supabase.js';

export const generateSlug = async (title) => {
  // Convert title to lowercase and replace spaces with hyphens
  let slug = title.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen

  // Check if slug exists
  const { data } = await supabase
    .from('events')
    .select('slug')
    .eq('slug', slug)
    .single();

  // If slug exists, append a number
  if (data) {
    let counter = 1;
    let newSlug = slug;
    while (true) {
      newSlug = `${slug}-${counter}`;
      const { data: existingSlug } = await supabase
        .from('events')
        .select('slug')
        .eq('slug', newSlug)
        .single();
      
      if (!existingSlug) {
        slug = newSlug;
        break;
      }
      counter++;
    }
  }

  return slug;
};