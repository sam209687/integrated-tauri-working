// src/lib/auth.options.ts
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { getUserModel, IUser } from "@/lib/models/user";
import bcrypt from "bcryptjs";

// ------------------------------------------------------------------
// ✅ Types
// ------------------------------------------------------------------

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "cashier";
  personalEmail?: string;
  isAdminInitialSetupComplete?: boolean;
}

// Strongly typed credentials interface
interface CredentialsInput {
  email: string;
  password: string;
}

// ------------------------------------------------------------------
// ✅ Main NextAuth Configuration
// ------------------------------------------------------------------

export const authOptions = {
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: { label: "Password", type: "password" },
      },

      async authorize(rawCredentials) {
        try {
          // ✅ Safely cast credentials to typed object
          const credentials = rawCredentials as CredentialsInput;
          const email = credentials?.email?.trim();
          const password = credentials?.password?.trim();

          if (!email || !password) {
            console.warn("⚠️ Missing credentials");
            throw new Error("Please provide both email and password.");
          }

          // ✅ Connect to database
          await connectToDatabase();
          const User = getUserModel();

          // ✅ Fetch full Mongoose document (no .lean())
          const user = (await User.findOne({ email })) as IUser | null;
          if (!user) {
            console.warn(`❌ No user found for email: ${email}`);
            throw new Error("Invalid email or password.");
          }

          if (!user.password) {
            console.warn(`⚠️ User has no password set: ${email}`);
            throw new Error("Account password not set.");
          }

          // ✅ Compare hashed passwords correctly
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            console.warn(`❌ Invalid password for user: ${email}`);
            throw new Error("Invalid email or password.");
          }

          // ✅ Return minimal user object for JWT/session
          const authUser: AuthUser = {
            id: user._id.toString(),
            email: user.email,
            name: user.name ?? null,
            role: user.role,
            personalEmail: user.personalEmail,
            isAdminInitialSetupComplete: user.isAdminInitialSetupComplete,
          };

          console.log(`✅ Login successful for ${email}`);
          return authUser;
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Unknown login error";
          console.error("❌ Authorize Error:", msg);
          throw new Error(msg);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.personalEmail = authUser.personalEmail;
        token.isAdminInitialSetupComplete =
          authUser.isAdminInitialSetupComplete;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "cashier";
        session.user.personalEmail = token.personalEmail as
          | string
          | undefined;
        session.user.isAdminInitialSetupComplete =
          token.isAdminInitialSetupComplete as boolean | undefined;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
