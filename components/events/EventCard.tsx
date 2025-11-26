import Link from 'next/link'
import { format } from 'date-fns'

interface Event {
  id: string
  title: string
  description: string
  image_url: string
  start_date: string
  location: string
  price: number
}

interface EventCardProps {
  event: Event
}

// Truncate description to a reasonable length
function truncateDescription(text: string, maxLength: number = 100): string {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`}>
      <article className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 overflow-hidden border border-gray-100 hover:border-indigo-200 cursor-pointer">
        {/* Event Image with Hover Zoom */}
        <div className="relative overflow-hidden h-56 bg-gradient-to-br from-gray-100 to-gray-200">
          <img 
            src={event.image_url || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Price Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
            <span className="text-indigo-600 font-bold text-lg">
              ${typeof event.price === 'number' ? event.price.toFixed(2) : event.price}
            </span>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
            {event.title}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            {truncateDescription(event.description, 120)}
          </p>
          
          {/* Event Details */}
          <div className="space-y-3">
            {/* Date */}
            <div className="flex items-center text-sm text-gray-700">
              <div className="flex-shrink-0 w-5 h-5 mr-3 text-indigo-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium">{format(new Date(event.start_date), 'MMM d, yyyy • h:mm a')}</span>
            </div>
            
            {/* Location */}
            <div className="flex items-center text-sm text-gray-700">
              <div className="flex-shrink-0 w-5 h-5 mr-3 text-indigo-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-medium truncate">{event.location}</span>
            </div>
          </div>
          
          {/* Get Tickets Button */}
          <div className="mt-6 relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2 group-hover:animate-pulse">
            {/* Button Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Button Content */}
            <span className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Get Tickets
            </span>
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
          </div>
        </div>
</article>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>