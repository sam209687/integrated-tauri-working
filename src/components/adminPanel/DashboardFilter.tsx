// src/components/adminPanel/dashboard/DashboardFilter.tsx (Modified for Key Prop)
"use client";

import { useState } from "react"; 
import { format, startOfDay, endOfDay, subDays, subMonths } from "date-fns";
import { ArrowRight } from "lucide-react"; 

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardFilterProps {
  onFilterChange: (filterType: string, fromDate?: Date, toDate?: Date) => void;
  activeFilterType: string;
  currentFromDate?: Date;
  currentToDate?: Date;
}

const formatDatePicker = (date: Date) => format(date, "LLL dd, y");

export function DashboardFilter({
  onFilterChange,
  activeFilterType, 
  currentFromDate, 
  currentToDate,   
}: DashboardFilterProps) {
  
  // Determine if the current active filter is a custom date range
  const isCustomRange = activeFilterType === 'dateRange';

  // FIX: Initialize local state from props, leveraging the key prop in the parent 
  // to reset this state entirely when a preset is chosen.
  const [fromDateState, setFromDateState] = useState<Date | undefined>(
    isCustomRange ? currentFromDate : undefined
  );
  const [toDateState, setToDateState] = useState<Date | undefined>(
    isCustomRange ? currentToDate : undefined
  );



  const handlePresetChange = (value: string) => {
    
    // Local state reset happens automatically when parent re-renders with new key.

    const now = new Date();
    let fromDate: Date | undefined = undefined;
    let toDate: Date | undefined = endOfDay(now); 

    switch (value) {
      case "today":
        fromDate = startOfDay(now);
        break;
      case "last7days":
        fromDate = startOfDay(subDays(now, 7)); 
        break;
      case "last3months":
        fromDate = startOfDay(subMonths(now, 3));
        break;
      default:
        fromDate = undefined;
        toDate = undefined;
        break;
    }
    
    onFilterChange(value, fromDate, toDate); 
  };
  
  const handleCustomDateChange = (date: Date | undefined, type: 'from' | 'to') => {
    
    const newFrom = type === 'from' ? date : fromDateState;
    const newTo = type === 'to' ? date : toDateState;

    // Update local state immediately for calendar display
    if (type === 'from') {
        setFromDateState(date);
    } else {
        setToDateState(date);
    }

    // Only apply filter if both dates are selected
    if (newFrom && newTo) {
      const finalFromDate = startOfDay(newFrom);
      const finalToDate = endOfDay(newTo);

      if (finalFromDate.getTime() > finalToDate.getTime()) {
        onFilterChange("dateRange", finalToDate, finalFromDate);
      } else {
        onFilterChange("dateRange", finalFromDate, finalToDate);
      }
    }
  };


  return (
    <div className="flex items-center gap-2">
      
      {/* 1. Preset Dropdown */}
      <Select value={activeFilterType} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px] dark:bg-gray-800 dark:border-gray-700 dark:text-white">
          <SelectValue placeholder="Select a filter" /> 
        </SelectTrigger>
        <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
          <SelectItem value="today">Today&apos;s Business</SelectItem> {/* 💡 FIX: Escaped the apostrophe */}
          <SelectItem value="last7days">Last 7 Days</SelectItem>
          <SelectItem value="last3months">Last 3 Months</SelectItem>
        </SelectContent>
      </Select>
      
      {/* 2. From Date Input (Small & Centered) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[120px] justify-center font-normal h-9",
              !fromDateState && "text-muted-foreground"
            )}
          >
            {fromDateState ? formatDatePicker(fromDateState) : <span>From Date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white" align="start">
          <Calendar
            mode="single"
            selected={fromDateState} 
            onSelect={(date) => handleCustomDateChange(date, 'from')}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <ArrowRight className="h-4 w-4 text-gray-400" />

      {/* 3. To Date Input (Small & Centered) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[120px] justify-center font-normal h-9",
              !toDateState && "text-muted-foreground"
            )}
          >
            {toDateState ? formatDatePicker(toDateState) : <span>To Date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white" align="start">
          <Calendar
            mode="single"
            selected={toDateState}
            onSelect={(date) => handleCustomDateChange(date, 'to')}
            initialFocus
            disabled={[{ before: fromDateState || new Date(0) }]} 
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}