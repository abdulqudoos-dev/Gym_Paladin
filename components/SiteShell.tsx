'use client';

import { ReactNode, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePathname } from 'next/navigation';

type SiteShellProps = {
  children: ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const isAdminRoute = pathname?.startsWith('/admin-dashboard');
  const isPlannerRoute = pathname === '/workout-planner';
  const isAuthRoute = pathname?.startsWith('/auth/');
  const hideSiteHeader = isAdminRoute || isPlannerRoute || isAuthRoute;
  const hideSiteFooter = isAdminRoute || isPlannerRoute || isAuthRoute;

  // Handle route transitions
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div>
      {!hideSiteHeader && <Header key="main-header" />}
      <div className={`transition-all duration-200 ${!hideSiteHeader ? 'pt-20 sm:pt-24' : ''} ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
        {children}
      </div>
      {!hideSiteFooter && <Footer />}
    </div>
  );
}


