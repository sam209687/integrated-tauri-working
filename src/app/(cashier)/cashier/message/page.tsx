// src/app/(cashier)/cashier/message/page.tsx
import { auth } from "@/lib/auth";
import { MessageInterface } from "@/components/messages/MessageInterface";
import { redirect } from "next/navigation";
import { Session } from "next-auth";

// ✅ Prevent Next.js from statically serializing `session`
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CashierMessagePage() {
  const session = await auth();

  // ✅ Server-side role protection
  if (!session || session.user.role !== "cashier") {
    redirect("/auth");
  }

  // ✅ Session safely passed to client component
  return <MessageInterface session={session as Session} />;
}
