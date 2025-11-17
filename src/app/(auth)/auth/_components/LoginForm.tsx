// src/app/(auth)/auth/_components/LoginForm.tsx
"use client"; 

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// CHANGE THIS IMPORT LINE:
import { signIn } from "next-auth/react"; 

const LoginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof LoginFormSchema>) {
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        console.error("Login error:", result.error);
        toast.error("Login failed: " + result.error);
      } else {
        toast.success("Login successful!");
        router.push("/admin/dashboard");
      }
    } catch (error) { // 💡 FIX: Removed ': any'
      // Use a type guard to safely handle and display the error message
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login.";
      console.error("Unexpected login error:", error);
      toast.error(errorMessage);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black dark:text-white">Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Sign In
        </Button>
        <div className="text-center space-y-2">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:underline block"
          >
            Forgot Password?
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm text-blue-600 hover:underline block"
          >
            Not an user? Signup
          </Link>
        </div>
      </form>
    </Form>
  );
}