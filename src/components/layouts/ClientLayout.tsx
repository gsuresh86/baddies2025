'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from "@supabase/supabase-js";
import PublicLayout from './PublicLayout';
import AdminLayout from './AdminLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ToastProvider } from '@/contexts/ToastContext';
import { DataProvider } from '@/contexts/DataContext';

// Define route categories
const PUBLIC_ROUTES = ['/', '/standings', '/teams', '/rules', '/tournaments', '/match'];
const AUTH_ROUTES = ['/admin-login'];

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    import('@/lib/store').then(m => m.getUser().then(u => { 
      setUser(u); 
      setLoading(false); 
    }));
  }, []);

  // Redirect if not authenticated and trying to access admin routes
  useEffect(() => {
    if (!user && !loading && pathname.startsWith('/admin') && pathname !== '/admin-login') {
      router.replace('/admin-login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Check if current route is admin route
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/admin-login';
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/match/') || pathname.startsWith('/standings') || pathname.startsWith('/teams') || pathname.startsWith('/rules');
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // If it's an auth route, render without any layout
  if (isAuthRoute) {
    return (
      <ToastProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </ToastProvider>
    );
  }

  // If it's an admin route, use admin layout
  if (isAdminRoute) {
    return (
      <ToastProvider>
        <DataProvider>
          <AdminLayout user={user}>
            {children}
          </AdminLayout>
        </DataProvider>
      </ToastProvider>
    );
  }

  // If it's a public route, use public layout
  if (isPublicRoute) {
    return (
      <ToastProvider>
        <DataProvider>
          <PublicLayout>
            {children}
          </PublicLayout>
        </DataProvider>
      </ToastProvider>
    );
  }

  // Default to public layout
  return (
    <ToastProvider>
      <DataProvider>
        <PublicLayout>
          {children}
        </PublicLayout>
      </DataProvider>
    </ToastProvider>
  );
} 