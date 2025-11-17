// src/app/(auth)/auth/_components/ResetPasswordForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ResetPasswordFormUI } from "@/components/forms/ForgotPasswordFormUI"; // Correct path to the file containing ResetPasswordFormUI

const ResetPasswordSchema = z.object({
  otp: z.string()
    .length(6, { message: "OTP must be 6 characters." })
    .regex(/^[0-9a-fA-F]+$/, "OTP must be a valid hexadecimal code."),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
  confirmPassword: z.string(), // This is the field that needs to be sent
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const isInitialSetup = searchParams.get("initial") === "true";

  const [isLoading, setIsLoading] = useState(false);
  const [newPasswordTitle, setNewPasswordTitle] = useState("Reset Password");

  useEffect(() => {
    if (isInitialSetup) {
      setNewPasswordTitle("Create Password");
    }
  }, [isInitialSetup]);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ResetPasswordSchema>) {
    setIsLoading(true);
    try {
      // THIS IS THE CRUCIAL PART: The payload being sent to the API
      const payload = {
        email, // From URL search params
        otp: values.otp.trim(),
        newPassword: values.newPassword.trim(),
        confirmPassword: values.confirmPassword.trim(), // Ensure this is explicitly included
        isInitialSetup, // From URL search params
      };

      console.log("Sending payload: (trimmed)", payload); // Log the payload before sending

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data); // Log the full error response from API
        throw new Error(data.message || "Failed to reset password.");
      }

      toast.success(data.message);
      router.push("/auth");
    } catch (error) { // 💡 FIX: Removed ': any'
      // Use a type guard to safely access the error message
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error("Frontend caught error:", error); // Log frontend errors
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ResetPasswordFormUI
      otp={form.watch("otp")}
      newPasswordTitle={newPasswordTitle}
      newPassword={form.watch("newPassword")}
      confirmPassword={form.watch("confirmPassword")}
      onOtpChange={(e) => form.setValue("otp", e.target.value)}
      onNewPasswordChange={(e) => form.setValue("newPassword", e.target.value)}
      onConfirmPasswordChange={(e) => form.setValue("confirmPassword", e.target.value)}
      onSubmit={form.handleSubmit(onSubmit)} // This sends the form's validated values to onSubmit
      isLoading={isLoading}
      otpError={form.formState.errors.otp?.message}
      newPasswordError={form.formState.errors.newPassword?.message}
      confirmPasswordError={form.formState.errors.confirmPassword?.message}
    />
  );
}