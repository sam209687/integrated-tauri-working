// src/components/adminPanel/PermanentCalendarCard.tsx

"use client";

import { CalendarComponent } from "./Calendar";

interface PermanentCalendarCardProps {
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
}

export function PermanentCalendarCard({
  
}: PermanentCalendarCardProps) {
  return (
    <div className="col-span-2">
      {/* You can later wire these props into CalendarComponent if needed */}
      <CalendarComponent />
    </div>
  );
}
