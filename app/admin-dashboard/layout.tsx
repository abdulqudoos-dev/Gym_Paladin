'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import SidebarButton from '@/components/SidebarButton';
import SidebarToggle from '@/components/SidebarToggle';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.user.role !== 'admin') {
            router.push('/dashboard');
            return;
          }
          setUser(userData.user);
        } else {
          localStorage.removeItem('token');
          router.push('/auth/login');
        }
      } catch (error) {
        localStorage.removeItem('token');
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('token');
    setUser(null);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('logout'));
    // Small delay to ensure state updates before redirect
    setTimeout(() => {
    router.push('/');
    }, 100);
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin-dashboard', icon: 'dashboard' },
    { name: 'Programs', href: '/admin-dashboard/programs', icon: 'programs' },
    { name: 'Workouts Management', href: '/workout-planner', icon: 'workouts' },
    { name: 'User Management', href: '/admin-dashboard/users', icon: 'users' },
    // { name: 'Subscriptions', href: '/admin-dashboard/subscriptions', icon: 'subscriptions' }, // commented out
    { name: 'Reports', href: '/admin-dashboard/reports', icon: 'reports' },
    // { name: 'Settings', href: '/admin-dashboard/settings', icon: 'settings' }, // temporarily disabled
  ];

  if (isLoading || isLoggingOut || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isLoggingOut ? 'Logging out...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobile ? (sidebarOpen ? 0 : -300) : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-800 to-black border-r border-gray-700 z-40 overflow-visible ${
          isMobile ? 'w-72' : sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className={`border-b border-gray-700 ${sidebarOpen ? 'p-6' : 'p-4 py-6'}`}>
         <Link href="/" className={`flex items-center group ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
           <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform bg-transparent">
             <img src="/assets/Fitmaker_logo-removebg-preview.png" alt="PALADIN" className="w-full h-full object-contain" />
           </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                   <span className="text-red-500 font-bold text-xl">PAL</span>
                   <span className="text-white font-bold text-xl">ADIN</span>
                    <p className="text-xs text-gray-400 -mt-1">Admin Panel</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`space-y-2 ${sidebarOpen ? 'p-4' : 'p-2'}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            // Get icon component
            const getIcon = () => {
              const iconProps = { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
              
              switch (item.icon) {
                case 'dashboard':
                  return (
                    <svg {...iconProps}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  );
                case 'users':
                  return (
                    <svg {...iconProps}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  );
                case 'programs':
                  return (
                    <svg {...iconProps}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  );
                case 'workouts':
                  return (
                    <svg {...iconProps}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  );
                case 'subscriptions':
                  return (
                    <svg {...iconProps}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  );
                case 'reports':
                  return (
                    <svg {...iconProps}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  );
                case 'settings':
                  return (
                    <svg {...iconProps}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  );
                default:
                  return null;
              }
            };

            return (
              <SidebarButton
                key={item.name}
                href={item.href}
                icon={getIcon()}
                label={item.name}
                isActive={isActive}
                isCollapsed={!sidebarOpen}
              />
            );
          })}
        </nav>

       </motion.aside>

       {/* Sidebar Toggle Button - Outside sidebar */}
       {!isMobile && (
         <div className={`fixed top-6 z-[60] transition-all duration-300 ${sidebarOpen ? 'left-64' : 'left-24'}`}>
           <SidebarToggle
             isOpen={sidebarOpen}
             onToggle={() => setSidebarOpen(!sidebarOpen)}
           />
         </div>
       )}

       {/* Mobile overlay backdrop */}
       {isMobile && sidebarOpen && (
         <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
       )}

       {/* Main Content */}
       <div className={`transition-all duration-300 ${isMobile ? 'ml-0' : sidebarOpen ? 'ml-72' : 'ml-20'} flex flex-col min-h-screen`}>
         {/* Top Navbar */}
         <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50 py-1">
           <div className="px-4 sm:px-6 py-2 h-18 sm:h-20 lg:h-22 flex items-center">
             <div className="w-full flex items-center justify-between gap-3 sm:gap-6">
               {/* Left side: Mobile menu button */}
               <div className="flex items-center gap-3 min-w-0">
                 {/* Mobile Menu Button - only show on mobile */}
                 {isMobile && (
                   <SidebarToggle
                     isOpen={sidebarOpen}
                     onToggle={() => setSidebarOpen(!sidebarOpen)}
                     variant="navbar"
                   />
                 )}
               </div>

               {/* Center: Search Bar */}
               <div className="flex-1 flex justify-center px-4">
                 <div className="relative w-full max-w-md">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                     </svg>
                   </div>
                   <input
                     type="text"
                     value={adminSearch}
                     onChange={(e) => setAdminSearch(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         const q = adminSearch.trim();
                         if (q.length === 0) return;
                         router.push(`/admin-dashboard/users?q=${encodeURIComponent(q)}`);
                       }
                     }}
                     placeholder="Search users, reports, workouts..."
                     className="block w-full pl-10 pr-3 h-10 sm:h-11 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                   />
                 </div>
               </div>

              {/* Right Side */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Menu */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs sm:text-sm text-gray-300">Welcome back,</p>
                    <p className="text-white font-medium truncate max-w-[120px]">{user?.name || 'Admin'}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
        {/* Admin Footer */}
        <footer className="border-t border-gray-800 bg-gray-900/40 px-6 py-4 text-sm text-gray-400">
          <div className="flex items-center justify-between">
            <span>© {new Date().getFullYear()} PALADIN Admin</span>
            <span className="text-gray-500">v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
