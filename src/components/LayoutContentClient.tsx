"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminHeader } from '@/components/AdminHeader';
import { AuthLoadingScreen } from '@/components/AuthLoadingScreen';
import { useAuth } from '@/hooks/useAuth';

export default function LayoutContentClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();
  const isAdminRoute = pathname?.startsWith('/admin');
  const hideFooter = isAdminRoute || pathname === '/messages';

  useEffect(() => {
    // Register service worker on client only
    if ('serviceWorker' in navigator) {
      const onLoad = () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Service worker registration failed:', err));
      };
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  if (loading) return <AuthLoadingScreen />;

  return (
    <>
      {isAdminRoute ? <AdminHeader /> : <Header />}
      {children}
      {!hideFooter && <Footer />}
    </>
  );
}
