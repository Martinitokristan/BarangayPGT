'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';
import FeedClient from '@/components/posts/FeedClient';
import Landing from '@/components/layout/Landing';
import Navbar from '@/components/layout/Navbar';
import DeviceVerification from '@/components/auth/DeviceVerification';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <>
        <DeviceVerification />
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Suspense fallback={null}>
            <FeedClient initialPosts={[]} initialLastPage={1} />
          </Suspense>
        </main>
      </>
    );
  }

  return <Landing />;
}
