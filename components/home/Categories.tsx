'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

// Predefined category data with icons and gradients
const categoryConfig = {
  'music': {
    icon: 'music',
    gradient: 'from-purple-500 to-pink-500',
    hoverGradient: 'from-purple-600 to-pink-600'
  },
  'sports': {
    icon: 'trophy',
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'from-blue-600 to-cyan-600'
  },
  'comedy': {
    icon: 'smile',
    gradient: 'from-yellow-500 to-orange-500',
    hoverGradient: 'from-yellow-600 to-orange-600'
  },
  'arts': {
    icon: 'palette',
    gradient: 'from-green-500 to-teal-500',
    hoverGradient: 'from-green-600 to-teal-600'
  },
  'festivals': {
    icon: 'star',
    gradient: 'from-red-500 to-rose-500',
    hoverGradient: 'from-red-600 to-rose-600'
  },
  'entertainment': {
    icon: 'film',
    gradient: 'from-indigo-500 to-purple-500',
    hoverGradient: 'from-indigo-600 to-purple-600'
  }
}

function getCategoryConfig(slug: string) {
  return categoryConfig[slug.toLowerCase() as keyof typeof categoryConfig] || {
    icon: 'calendar',
    gradient: 'from-gray-500 to-gray-600',
    hoverGradient: 'from-gray-600 to-gray-700'
  }
}

function CategoryIcon({ iconType }: { iconType: string }) {
  const iconPaths = {
    music: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
    trophy: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    smile: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    palette: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3V1a1 1 0 011-1h8a1 1 0 011 1v2M7 21h10a2 2 0 002-2v-4a2 2 0 00-2-2H7",
    star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    film: "M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3M7 4H5a1 1 0 00-1 1v3m2-4v10a1 1 0 001 1h8a1 1 0 001-1V4M7 4h10M9 9h6m-6 4h6",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
  }

  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d={iconPaths[iconType as keyof typeof iconPaths] || iconPaths.calendar} 
      />
    </svg>
  )
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      // Categories are reference data, safe to read directly
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (err) throw err
      setCategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore by Category</h2>
            <p className="text-lg text-gray-600">Loading categories...</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-2xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Unable to load categories</p>
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">No categories available</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gray-50 py-16" aria-labelledby="categories-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="categories-heading" className="text-3xl font-bold text-gray-900 mb-4">
            Explore by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing events across different categories and find your perfect experience
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => {
            const config = getCategoryConfig(category.slug)
            
            return (
              <Link
                key={category.id}
                href={`/events?category=${category.id}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-6 text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-50`}
                aria-label={`Browse ${category.name} events`}
              >
                {/* Background Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${config.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="mb-4 p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                    <CategoryIcon iconType={config.icon} />
                  </div>
                  
                  {/* Label */}
                  <h3 className="text-lg font-bold mb-2 group-hover:scale-105 transition-transform duration-300">
                    {category.name}
                  </h3>
                  
                  {/* Description */}
                  {category.description && (
                    <p className="text-sm text-white/80 group-hover:text-white transition-colors duration-300 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  {/* Hover Arrow */}
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}