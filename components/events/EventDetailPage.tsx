'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, isPast } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  title: string
  description: string
  image_url: string
  start_date: string
  end_date: string
  location: string
  price: number
  capacity: number
  categories?: {
    name: string
    slug: string
  }
  organizers?: {
    company_name: string
    contact_email: string
    website_url?: string
  }
}

interface Ticket {
  id: string
  type: string
  price: number
  quantity: number
}

interface EventDetailPageProps {
  eventId: string
}

export function EventDetailPage({ eventId }: EventDetailPageProps) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})

  // Computed values
  const isEventInPast = event ? isPast(new Date(event.start_date)) : false
  const isSoldOut = tickets.length > 0 ? tickets.every(ticket => ticket.quantity === 0) : false
  const hasAvailableTickets = tickets.some(ticket => ticket.quantity > 0)
  const cartTotal = getTotalPrice()
  const cartQuantity = getTotalQuantity()
  const hasItemsInCart = cartQuantity > 0

  useEffect(() => {
    loadEventDetails()
  }, [eventId])

  async function loadEventDetails() {
    try {
      setLoading(true)
      setError(null)

      // Load event details with related data
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          categories (
            name,
            slug
          ),
          organizers (
            company_name,
            contact_email,
            website_url
          )
        `)
        .eq('id', eventId)
        .single()

      if (eventError) {
        if (eventError.code === 'PGRST116') {
          // Event not found
          setEvent(null)
          return
        }
        throw eventError
      }

      setEvent(eventData)

      // Load tickets for this event
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true })

      if (ticketError) {
        console.error('Failed to load tickets:', ticketError)
        setTickets([])
      } else {
        setTickets(ticketData || [])
      }

    } catch (err) {
      console.error('Failed to load event:', err)
      setError('Unable to load event details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function updateTicketQuantity(ticketId: string, quantity: number) {
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return
    
    const validQuantity = Math.max(0, Math.min(quantity, ticket.quantity))
    
    if (validQuantity === 0) {
      const newSelected = { ...selectedTickets }
      delete newSelected[ticketId]
      setSelectedTickets(newSelected)
    } else {
      setSelectedTickets(prev => ({ ...prev, [ticketId]: validQuantity }))
    }
  }

  function getTotalPrice() {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = tickets.find(t => t.id === ticketId)
      return total + (ticket ? ticket.price * quantity : 0)
    }, 0)
  }

  function getTotalQuantity() {
    return Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0)
  }

  function clearCart() {
    setSelectedTickets({})
  }

  function proceedToCheckout() {
    if (!hasItemsInCart) return
    
    const cartParams = new URLSearchParams()
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      cartParams.append('ticket', `${ticketId}:${quantity}`)
    })
    
    router.push(`/events/${eventId}/checkout?${cartParams.toString()}`)
  }

  function handleGetTickets() {
    if (isEventInPast || isSoldOut || !hasAvailableTickets) {
      return
    }
    
    if (hasItemsInCart) {
      proceedToCheckout()
    } else {
      // Scroll to tickets section
      document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  function openMapLink() {
    if (event?.location) {
      const encodedLocation = encodeURIComponent(event.location)
      window.open(`https://maps.google.com/?q=${encodedLocation}`, '_blank')
    }
  }

  function getEventStatus() {
    if (isEventInPast) {
      return { type: 'past', message: 'This event has ended', color: 'gray' }
    }
    
    if (isSoldOut) {
      return { type: 'sold-out', message: 'Sold Out', color: 'red' }
    }
    
    if (hasAvailableTickets) {
      return { type: 'available', message: 'Tickets Available', color: 'green' }
    }
    
    return { type: 'loading', message: 'Loading...', color: 'yellow' }
  }

  function getButtonText() {
    const status = getEventStatus()
    
    switch (status.type) {
      case 'past':
        return 'Event Ended'
      case 'sold-out':
        return 'Sold Out'
      default:
        return hasItemsInCart ? `Checkout (${cartQuantity})` : 'Select Tickets'
    }
  }

  function isButtonDisabled() {
    const status = getEventStatus()
    return ['past', 'sold-out'].includes(status.type)
  }

  function getStatusColorClasses(color: string) {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800'
      case 'red':
        return 'bg-red-100 text-red-800'
      case 'gray':
        return 'bg-gray-100 text-gray-800'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        {/* Hero Banner Skeleton */}
        <div className="relative h-96 bg-gray-200">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
            <div className="absolute bottom-8 left-8 right-8">
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn't find the event you're looking for. It may have been removed or the link might be incorrect.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/events')}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse All Events
            </button>
            
            <div>
              <button
                onClick={() => router.push('/')}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
              >
                ← Back to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
          <p className="text-lg text-gray-600 mb-8">{error}</p>
          
          <div className="space-y-4">
            <button
              onClick={loadEventDetails}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            
            <div>
              <button
                onClick={() => router.push('/events')}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
              >
                ← Browse All Events
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const status = getEventStatus()

  return (
    <main>
      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={event.image_url || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              {/* Event Status Badge */}
              {status.type !== 'available' && (
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClasses(status.color)} bg-opacity-90 backdrop-blur-sm`}>
                    {status.message}
                  </span>
                </div>
              )}
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                {event.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-white/90 text-lg">
                {/* Date */}
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                
                {/* Time */}
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{format(new Date(event.start_date), 'h:mm a')}</span>
                </div>
                
                {/* Location */}
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <button
                    onClick={openMapLink}
                    className="font-medium hover:text-white transition-colors duration-200 underline decoration-white/50 hover:decoration-white"
                  >
                    {event.location}
                  </button>
                </div>
              </div>
              
              {/* CTA Button in Hero */}
              <div className="mt-8">
                <button
                  onClick={handleGetTickets}
                  disabled={isButtonDisabled()}
                  className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                >
                  {hasItemsInCart ? (
                    <>
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                      Checkout ({cartQuantity})
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      {getButtonText()}
                    </>
                  )}
                </button>
                
                {hasItemsInCart && (
                  <div className="mt-3 text-white/80 text-sm">
                    {cartQuantity} ticket{cartQuantity !== 1 ? 's' : ''} selected • ${cartTotal.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Event</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{event.description}</p>
              </div>
            </section>

            {/* Event Details Grid */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Capacity</h3>
                  </div>
                  <p className="text-gray-600 text-lg">{event.capacity?.toLocaleString() || 'TBD'} attendees</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Category</h3>
                  </div>
                  <p className="text-gray-600 text-lg">{event.categories?.name || 'General Event'}</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Duration</h3>
                  </div>
                  <p className="text-gray-600 text-lg">
                    {Math.ceil((new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 60 * 60))} hours
                  </p>
                </div>
                
                {event.organizers && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-3">
                      <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v12" />
                      </svg>
                      <h3 className="font-semibold text-gray-900">Organizer</h3>
                    </div>
                    <p className="text-gray-600 text-lg font-medium">{event.organizers.company_name}</p>
                    {event.organizers.website_url && (
                      <a 
                        href={event.organizers.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-200 inline-flex items-center mt-2"
                      >
                        Visit Website
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Ticket Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <section className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" id="tickets">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">Select Tickets</h2>
                  <p className="text-indigo-100 mt-1">Choose your ticket type and quantity</p>
                </div>
                
                <div className="p-6">
                  {tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tickets Coming Soon</h3>
                      <p className="text-gray-600">Ticket sales haven't started yet. Check back soon!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map(ticket => (
                        <div 
                          key={ticket.id}
                          className={`border border-gray-200 rounded-lg p-4 transition-all duration-200 ${
                            ticket.quantity === 0 
                              ? 'bg-gray-50 opacity-60' 
                              : selectedTickets[ticket.id] 
                                ? 'bg-indigo-50 border-indigo-200' 
                                : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                                {ticket.type}
                                {selectedTickets[ticket.id] && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {selectedTickets[ticket.id]} selected
                                  </span>
                                )}
                              </h3>
                              <p className="text-2xl font-bold text-indigo-600 mt-1">${ticket.price}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              {ticket.quantity === 0 ? (
                                <span className="text-red-600 font-medium">Sold Out</span>
                              ) : ticket.quantity < 10 ? (
                                <span className="text-orange-600 font-medium">Only {ticket.quantity} left!</span>
                              ) : (
                                <span>{ticket.quantity} available</span>
                              )}
                            </div>
                            
                            {!isEventInPast && !isSoldOut && ticket.quantity > 0 && (
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => updateTicketQuantity(ticket.id, Math.max(0, (selectedTickets[ticket.id] || 0) - 1))}
                                  disabled={!selectedTickets[ticket.id] || selectedTickets[ticket.id] <= 0}
                                  className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  aria-label={`Decrease quantity for ${ticket.type}`}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                  </svg>
                                </button>
                                
                                <span className="w-8 text-center font-bold text-lg text-gray-900">
                                  {selectedTickets[ticket.id] || 0}
                                </span>
                                
                                <button
                                  onClick={() => updateTicketQuantity(ticket.id, Math.min(ticket.quantity, (selectedTickets[ticket.id] || 0) + 1))}
                                  disabled={selectedTickets[ticket.id] >= ticket.quantity}
                                  className="w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transform hover:scale-105"
                                  aria-label={`Increase quantity for ${ticket.type}`}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Cart Summary */}
                  {hasItemsInCart && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">Total Tickets:</span>
                          <span className="font-bold text-lg text-gray-900">{cartQuantity}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">Total Price:</span>
                          <span className="font-bold text-2xl text-indigo-600">${cartTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <button
                          onClick={proceedToCheckout}
                          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          Proceed to Checkout
                        </button>
                        
                        <button
                          onClick={clearCart}
                          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}