// src/lib/auth.middleware.ts

// 1. Import your raw config (which shouldn't import db.ts)
// import authConfig from "./auth.config";

// 2. Import only the NextAuth Edge wrapper
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// 3. Export the Edge-compatible middleware handler
export const { auth: middlewareAuth } = NextAuth(authConfig);

// The `authConfig` file must not contain any imports from `src/lib/db.ts`.
// It should only define providers and callbacks.