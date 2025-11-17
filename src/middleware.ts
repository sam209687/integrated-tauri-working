// ./middleware.ts

// ❌ OLD: import { auth as middleware } from "./lib/auth"; // Imports Mongoose
// ✅ NEW: Import the Edge-safe handler
import { middlewareAuth } from "./lib/auth.middleware";

export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*"],
};

// Use the renamed export here
export { middlewareAuth as middleware };