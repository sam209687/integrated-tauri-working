"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/themes/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// AuthGuard component to handle redirection
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    // ✅ FIX: Add the signup page to the list of public paths
    const publicPaths = [
      "/auth",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/signup",
    ];
    const isPublicPath = publicPaths.includes(pathname);

    if (session) {
      if (isPublicPath) {
        if (session.user.role === "admin") {
          router.push("/admin/dashboard");
        } else if (session.user.role === "cashier") {
          router.push("/cashier/dashboard");
        }
      }
    } else {
      if (!isPublicPath) {
        router.push("/auth");
      }
    }
  }, [session, status, router, pathname]);

  if (status === "loading" && !pathname.startsWith("/auth")) {
    return <div className="flex flex-col items-center justify-center min-h-screen p-4">
      </div>
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider >
            {" "}
            <AuthGuard>{children}</AuthGuard>
            <Toaster position="bottom-right" richColors />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}