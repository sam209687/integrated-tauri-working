// src/app/(auth)/auth/_components/ForgotPasswordForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ForgotPasswordFormUI } from "@/components/forms/ForgotPasswordFormUI";

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ForgotPasswordSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process request.");
      }

      toast.success(data.message);
      // Pass email to reset-password page for context, if needed
      router.push(`/auth/reset-password?email=${encodeURIComponent(values.email)}`);

    } catch (error) { // 💡 FIX: Removed ': any'
      // Use a type guard to safely access the error message
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ForgotPasswordFormUI
      email={form.watch("email")}
      onEmailChange={(e) => form.setValue("email", e.target.value)}
      onSubmit={form.handleSubmit(onSubmit)}
      isLoading={isLoading}
      emailError={form.formState.errors.email?.message}
    />
  );
}