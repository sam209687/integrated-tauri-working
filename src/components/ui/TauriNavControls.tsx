// Example: src/components/ui/TauriNavControls.tsx or directly in your 404 page
"use client"
import { Button } from "@/components/ui/button"; // Assuming you use shadcn/ui buttons
import { ArrowLeft, RotateCw } from "lucide-react";
// Import the Tauri API only if you need full window control, otherwise use browser APIs

// We'll use window.location and window.history for simplicity and universal web view compatibility
// If you are using Tauri, you must ensure the 'webview' feature is enabled in tauri.conf.json 

const goBack = () => {
  // Uses the browser's history stack to go back one entry
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // If no history, maybe navigate to the root route
    window.location.href = "/";
  }
};

const refreshPage = () => {
  // Standard web API to force a page reload
  window.location.reload();
};


export const NavControls = () => {
  return (
    <div className="flex space-x-4 mt-8">
      {/* Go Back Button */}
      <Button onClick={goBack} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
      </Button>
      
      {/* Refresh Button */}
      <Button onClick={refreshPage}>
        <RotateCw className="mr-2 h-4 w-4" /> Refresh
      </Button>
    </div>
  );
};