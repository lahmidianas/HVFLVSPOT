'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActiveRoute = (path: string) => pathname === path

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Centered Logo */}
          <div className="flex-1 flex justify-center lg:justify-center">
            <Link 
              href="/" 
              className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="HVFLVSPOT homepage"
            >
              HVFLVSPOT
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <Link 
              href="/" 
              className={`nav-link ${isActiveRoute('/') ? 'nav-link-active' : ''}`}
              aria-current={isActiveRoute('/') ? 'page' : undefined}
            >
              Home
            </Link>
            <Link 
              href="/events" 
              className={`nav-link ${isActiveRoute('/events') ? 'nav-link-active' : ''}`}
              aria-current={isActiveRoute('/events') ? 'page' : undefined}
            >
              All Events
            </Link>
            <Link 
              href="/search" 
              className={`nav-link ${isActiveRoute('/search') ? 'nav-link-active' : ''}`}
              aria-current={isActiveRoute('/search') ? 'page' : undefined}
            >
              Events
            </Link>
            <Link 
              href="/wallet" 
              className={`nav-link ${isActiveRoute('/wallet') ? 'nav-link-active' : ''}`}
              aria-current={isActiveRoute('/wallet') ? 'page' : undefined}
            >
              Tickets
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center">
            <Link
              href="/login"
              className="hidden lg:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden" id="mobile-menu">
            <div className="space-y-1 pb-3 pt-2 border-t border-gray-200 bg-white">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${isActiveRoute('/') ? 'mobile-nav-link-active' : ''}`}
                aria-current={isActiveRoute('/') ? 'page' : undefined}
              >
                Home
              </Link>
              <Link
                href="/events"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${isActiveRoute('/events') ? 'mobile-nav-link-active' : ''}`}
                aria-current={isActiveRoute('/events') ? 'page' : undefined}
              >
                All Events
              </Link>
              <Link
                href="/search"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${isActiveRoute('/search') ? 'mobile-nav-link-active' : ''}`}
                aria-current={isActiveRoute('/search') ? 'page' : undefined}
              >
                Search
              </Link>
              <Link
                href="/wallet"
                onClick={closeMobileMenu}
                className={`mobile-nav-link ${isActiveRoute('/wallet') ? 'mobile-nav-link-active' : ''}`}
                aria-current={isActiveRoute('/wallet') ? 'page' : undefined}
              >
                Tickets
              </Link>
              
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="px-2">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <style jsx>{`
        .nav-link {
          @apply relative text-base font-medium text-gray-600 transition-all duration-300 ease-out;
          @apply hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-3 py-2;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
          transition: all 0.3s ease-out;
          transform: translateX(-50%);
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .nav-link-active {
          @apply text-indigo-600;
        }

        .nav-link-active::after {
          width: 100%;
        }

        .mobile-nav-link {
          @apply block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50;
          @apply transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2;
        }

        .mobile-nav-link-active {
          @apply text-indigo-600 bg-indigo-50;
        }

        /* Backdrop blur fallback for older browsers */
        @supports not (backdrop-filter: blur(12px)) {
          header {
            background-color: white;
          }
        }
      `}</style>
    </header>
  )
}