// src/lib/auth.config.ts

import type { NextAuthConfig } from 'next-auth';

// This configuration is used by Next.js Middleware (Edge Runtime) for authorization checks.
// It MUST NOT import any Node.js-only modules (like 'mongoose' or 'bcrypt').

export const authConfig = {
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  // FIX: NextAuthConfig requires 'providers', even if empty for the middleware context.
  providers: [], 
} satisfies NextAuthConfig;