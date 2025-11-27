
// src/app/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function RootPage() {
  const session = await auth();

  if (session) {
    // Redirect authenticated users to the admin dashboard
    redirect('/admin/dashboard');
  }

  // Redirect unauthenticated users to the login page
  redirect('/auth');
}