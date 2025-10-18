"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Orbitron } from 'next/font/google';

type UserShape = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: "user" | "admin";
  subscription?: { plan?: string };
};

const logoFont = Orbitron({ subsets: ['latin'], weight: ['700', '800'] });

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserShape | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };
    
    // Set initial scroll state
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load logged-in user if token exists
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let settleTimeoutId: NodeJS.Timeout | null = null;
    
    const checkAuth = async () => {
      if (!mounted) return;
      
      // Clear any pending timeouts
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (settleTimeoutId) {
        clearTimeout(settleTimeoutId);
        settleTimeoutId = null;
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) { 
        if (mounted) {
          setUser(null); 
          // Add small delay to ensure state is settled
          settleTimeoutId = setTimeout(() => {
            if (mounted) setIsLoading(false);
          }, 50);
        }
        return; 
      }
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (!res.ok) { 
          if (mounted) {
            setUser(null);
            localStorage.removeItem('token'); // Clean up invalid token
            // Add small delay to ensure state is settled
            settleTimeoutId = setTimeout(() => {
              if (mounted) setIsLoading(false);
            }, 50);
          }
          return; 
        }
        const me = await res.json();
        if (mounted) {
          setUser(me.user || me);
          // Add small delay to ensure state is settled
          settleTimeoutId = setTimeout(() => {
            if (mounted) setIsLoading(false);
          }, 50);
        }
      } catch {
        if (mounted) {
          setUser(null);
          localStorage.removeItem('token'); // Clean up on error
          // Add small delay to ensure state is settled
          settleTimeoutId = setTimeout(() => {
            if (mounted) setIsLoading(false);
          }, 50);
        }
      }
    };

    // Check auth on mount
    checkAuth();

    // Listen for storage changes (logout from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && mounted) {
        // Debounce rapid storage changes
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (mounted) checkAuth();
        }, 100);
      }
    };

    // Listen for custom logout events
    const handleLogoutEvent = () => {
      if (mounted) {
        setUser(null);
        // Add small delay to ensure state is settled
        settleTimeoutId = setTimeout(() => {
          if (mounted) setIsLoading(false);
        }, 50);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logout', handleLogoutEvent);

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (settleTimeoutId) clearTimeout(settleTimeoutId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', handleLogoutEvent);
    };
  }, []); // Empty dependency array to run only once

  // Check if we should render header
  const isAdminRoute = pathname?.startsWith('/admin-dashboard');
  
  // Ensure we have a stable user state before rendering
  const currentRole: "guest" | "user" | "admin" = user?.role === 'admin' ? 'admin' : (user ? 'user' : 'guest');
  
  // Prevent rendering during state transitions
  const isStateTransitioning = isLoading;
  
  // Additional safeguard: ensure we have a definitive state
  const hasDefinitiveState = !isLoading && (user !== null || currentRole === 'guest');

  const navLinks = useMemo(() => {
    // Since we're not showing header on admin routes, we only need user and guest navigation
    if (currentRole === 'user') {
      const links = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Workouts', href: '/workouts' },
        { name: 'Calendar', href: '/calendar' },
        { name: 'Progress', href: '/progress' },
        { name: 'Pricing', href: '/pricing' },
      ];
      
      // Add admin link for admin users when not on admin routes
      if (user?.role === 'admin') {
        links.push({ name: 'Admin Panel', href: '/admin-dashboard' });
      }
      
      return links;
    }
    return [
      { name: 'Home', href: '/' },
      { name: 'Programs', href: '/#programs' },
      { name: 'Pricing', href: '/pricing' },
    ];
  }, [currentRole, user?.role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('logout'));
    router.push('/');
  };

  // Don't render header on admin routes
  if (isAdminRoute) {
    return null;
  }

  // Show loading state to prevent stale navbar
  if (isStateTransitioning || !hasDefinitiveState) {
    return (
      <motion.header
        key="loading-header" // Add unique key
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-40 bg-dark-500/95 backdrop-blur-md shadow-lg"
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform bg-transparent">
                <img src="/assets/Fitmaker_logo-removebg-preview.png" alt="PALADIN" className="w-full h-full object-contain" />
              </div>
              <div className={`hidden sm:block ${logoFont.className}`}>
                <span className="text-primary-500 font-bold text-xl">PAL</span>
                <span className="text-white font-bold text-xl">ADIN</span>
                <p className="text-xs text-gray-400 -mt-1">Transform Your Body</p>
              </div>
            </Link>
            
            {/* Loading indicator */}
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-gray-700 h-8 w-20 rounded"></div>
              <div className="animate-pulse bg-gray-700 h-8 w-16 rounded"></div>
            </div>
          </div>
        </nav>
      </motion.header>
    );
  }

  return (
    <motion.header
      key={`header-${currentRole}-${user?._id || 'guest'}`} // Force re-render on state change
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-dark-500/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform bg-transparent">
              <img src="/assets/Fitmaker_logo-removebg-preview.png" alt="PALADIN" className="w-full h-full object-contain" />
            </div>
            <div className={`hidden sm:block ${logoFont.className}`}>
              <span className="text-primary-500 font-bold text-xl">PAL</span>
              <span className="text-white font-bold text-xl">ADIN</span>
              <p className="text-xs text-gray-400 -mt-1">Transform Your Body</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:text-primary-500 transition-colors font-medium relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Right side: auth controls */}
          <div className="hidden md:flex items-center space-x-4">
            {currentRole === 'guest' ? (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-gray-700 hover:border-primary-500"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-primary-500/50"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {user?.subscription?.plan && (
                  <span className="hidden lg:inline-flex items-center text-xs px-2 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    {user.subscription.plan}
                  </span>
                )}
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/profile" 
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-orange text-white flex items-center justify-center font-semibold hover:scale-110 transition-transform cursor-pointer"
                    title="Go to Profile"
                  >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </Link>
                  <div className="text-right">
                    <div className="text-white text-sm font-medium leading-none">{user?.name || 'Member'}</div>
                    <div className="text-gray-400 text-xs leading-none capitalize">{currentRole}</div>
                  </div>
                  <button onClick={handleLogout} className="text-gray-300 hover:text-white text-sm px-3 py-2 rounded-lg border border-gray-700 hover:border-primary-500">
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-400 rounded-lg my-4 p-4"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-primary-500 transition-colors font-medium py-2"
                >
                  {link.name}
                </Link>
              ))}
              {currentRole === 'guest' ? (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors font-medium py-2 border-t border-gray-700 pt-4"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold px-6 py-3 rounded-lg text-center"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-primary-500 transition-colors font-medium py-2 border-t border-gray-700 pt-4"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="text-gray-300 hover:text-white transition-colors font-medium py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>
    </motion.header>
  );
}

