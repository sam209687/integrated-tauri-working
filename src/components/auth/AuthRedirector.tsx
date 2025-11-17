// src/components/AuthRedirector.tsx
'use client'; // 👈 This line is essential!

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthRedirector() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Show a loading state while NextAuth is checking the session status
  if (status === 'loading') {
    return <div>Loading...</div>; 
  }

  // If a session exists, redirect to the dashboard
  if (session) {
    router.replace('/admin/dashboard');
    return null; // Return null while redirecting
  }

  // If no session exists, redirect to the login page
  router.replace('/auth');
  return null; // Return null while redirecting
}