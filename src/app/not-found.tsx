// src/app/not-found.tsx

import Link from 'next/link';
import { NavControls } from '@/components/ui/TauriNavControls';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    // 1. Base background/text: Use theme-compatible colors
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      
      {/* 2. Error Code: Use a vibrant color for contrast */}
      <h1 className="text-9xl font-extrabold text-red-600 tracking-widest">
        404
      </h1>
      
      {/* 3. Banner: Use a high-contrast combination that looks good in both themes */}
      <div className="bg-primary px-2 text-sm rounded rotate-12 absolute text-primary-foreground">
        Page Not Found
      </div>
      
      {/* 4. Main Text */}
      <p className="text-2xl font-medium mt-4 text-foreground">
        Oops! The page you are looking for does not exist.
      </p>
      
      {/* 5. Sub Text: Use muted-foreground */}
      <p className="text-lg text-muted-foreground mt-2">
        It might have been moved or deleted.
      </p>

      {/* This is where you place the navigation controls. */}
      <NavControls />

      {/* 6. Button: Use standard Button component with primary styling */}
      <Link href="/" className="mt-8">
        <Button className='py-4 px-5'>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}