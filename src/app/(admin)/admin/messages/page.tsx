// src/app/(admin)/admin/messages/page.tsx
import { auth } from "@/lib/auth";
import { MessageInterface } from "@/components/messages/MessageInterface";
import { redirect } from "next/navigation";
import { Session } from "next-auth";

// ✅ Prevent static build serialization issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminMessagesPage() {
  const session = await auth();

  // ✅ Secure route for admins only
  if (!session || session.user.role !== "admin") {
    redirect("/auth");
  }

  return <MessageInterface session={session as Session} />;
}
