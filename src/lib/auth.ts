// src/lib/auth.ts
import NextAuth, { DefaultSession } from "next-auth";
import { authOptions } from "./auth.options"; // ✅ Import the full NextAuth configuration

// ------------------------------------------------------------------
// ✅ Type Augmentations — adds strong typing for session, user, and JWT
// ------------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "cashier";
      personalEmail?: string;
      isAdminInitialSetupComplete?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "admin" | "cashier";
    personalEmail?: string;
    isAdminInitialSetupComplete?: boolean;
  }

  interface JWT {
    id: string;
    role: "admin" | "cashier";
    personalEmail?: string;
    isAdminInitialSetupComplete?: boolean;
  }
}

// ------------------------------------------------------------------
// ✅ Initialize NextAuth using centralized configuration
// ------------------------------------------------------------------

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);

// ------------------------------------------------------------------
// ✅ Notes:
// ------------------------------------------------------------------
// - This file centralizes NextAuth initialization and exports reusable helpers.
// - All authentication logic, providers, and callbacks live in `/src/lib/auth.options.ts`.
// - Use in API routes:
//     import { GET, POST } from "@/lib/auth";
//     export { GET, POST };
// - Or call the helpers directly in server components:
//     const session = await auth(); // retrieves current session
//     await signIn("credentials", { email, password });
// ------------------------------------------------------------------
