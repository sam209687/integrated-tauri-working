"use client";

import React, { useEffect, Suspense } from "react";
import { LoginForm } from "./_components/LoginForm";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";

// 👇 Move useSearchParams() into a separate component
function AuthPageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage: string | undefined;

  if (error) {
    switch (error) {
      case "OAuthAccountNotLinked":
        errorMessage =
          "This email is already associated with another login method. Please sign in with your original method.";
        break;
      case "CredentialsSignin":
        errorMessage =
          "Invalid credentials. Please check your username/email and password.";
        break;
      case "Configuration":
        errorMessage =
          "Login service configuration error. Please try again later.";
        break;
      default:
        errorMessage =
          "An unknown error occurred during login. Please try again.";
        break;
    }
  }

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-[380px] sm:w-[450px]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ Wrap the content in a Suspense boundary
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
