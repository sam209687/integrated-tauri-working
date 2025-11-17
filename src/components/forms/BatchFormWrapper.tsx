"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { BatchFormProps } from "@/components/forms/batch-form";

// ✅ Dynamically import the BatchForm client component
const BatchForm = dynamic(() => import("@/components/forms/batch-form").then((mod) => mod.BatchForm), {
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

// ✅ Safe wrapper that isolates client logic
export default function BatchFormWrapper(props: BatchFormProps) {
  return <BatchForm {...props} />;
}
