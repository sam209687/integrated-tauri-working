"use client";

import * as React from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  subDays,
  subMonths,
  addMonths,
  isWithinInterval,
  startOfDay,
  differenceInCalendarDays,
} from "date-fns";
import { RefreshCcw, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getIndianHolidays } from "@/actions/calendar.Actions";
import { MemoEventDialog } from "./memoEvent";

type Holiday = { name: string; date: string };
type CustomEvent = { date: string; name: string; fileUrl?: string };

const CALENDAR_EVENTS_STORAGE_KEY = "calendarCustomEvents_v3";

export function CalendarComponent() {
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [customEvents, setCustomEvents] = React.useState<CustomEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogDate, setDialogDate] = React.useState<Date | null>(null);
  const [eventName, setEventName] = React.useState("");
  const [isLoaded, setIsLoaded] = React.useState(false);

  const fetchHolidays = React.useCallback(async () => {
    setIsLoading(true);
    const holidayData = await getIndianHolidays();
    setHolidays(holidayData);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchHolidays();
    try {
      const savedEvents = localStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY);
      if (savedEvents) setCustomEvents(JSON.parse(savedEvents));
    } catch (err) {
      console.error("Failed to load events:", err);
    }
    setIsLoaded(true);
  }, [fetchHolidays]);

  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        CALENDAR_EVENTS_STORAGE_KEY,
        JSON.stringify(customEvents)
      );
    }
  }, [customEvents, isLoaded]);

  const holidayMap = React.useMemo(() => {
    const map = new Map<string, string>();
    holidays.forEach((h) => map.set(h.date, h.name));
    return map;
  }, [holidays]);

  const customEventMap = React.useMemo(() => {
    const map = new Map<string, string>();
    customEvents.forEach((e) => map.set(e.date, e.name));
    return map;
  }, [customEvents]);

  const displayHolidays = React.useMemo(() => {
    if (holidays.length === 0) return [];
    const today = startOfDay(new Date());
    const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.filter((holiday) => {
      const holidayDate = parseISO(holiday.date);
      if (differenceInCalendarDays(holidayDate, today) < 0) return false;
      const displayStartDate = subDays(holidayDate, 5);
      return isWithinInterval(today, {
        start: displayStartDate,
        end: holidayDate,
      });
    });
  }, [holidays]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDialogDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const existingEvent = customEventMap.get(dateStr);
    setEventName(existingEvent || "");
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    dateStr: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const existingIndex = customEvents.findIndex((e) => e.date === dateStr);

    if (existingIndex > -1) {
      const updated = [...customEvents];
      updated[existingIndex].fileUrl = fileUrl;
      setCustomEvents(updated);
    } else {
      setCustomEvents([
        ...customEvents,
        { date: dateStr, name: "Uploaded File", fileUrl },
      ]);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card text-card-foreground border rounded-xl p-6 w-full max-w-4xl mx-auto shadow-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">
              Calendar {format(currentMonth, "yyyy")}
            </h2>
            {displayHolidays.length > 0 && (
              <p className="text-xs text-yellow-500 animate-pulse">
                Upcoming: {displayHolidays.map((h) => h.name).join(", ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchHolidays}
              disabled={isLoading}
            >
              <RefreshCcw
                className={cn(
                  "h-4 w-4 text-muted-foreground",
                  isLoading && "animate-spin"
                )}
              />
            </Button>
          </div>
        </div>

        <p className="text-center text-sm font-medium mb-3">
          {format(currentMonth, "MMMM yyyy")}
        </p>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center text-[13px] font-semibold text-muted-foreground mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-sm">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const holidayName = holidayMap.get(dateStr);
            const customEvent = customEvents.find((e) => e.date === dateStr);

            return (
              <div
                key={dateStr}
                className="relative flex flex-col items-center"
              >
                <button
                  title={[customEvent?.name, holidayName]
                    .filter(Boolean)
                    .join(" | ")}
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    "relative flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-150",
                    isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground opacity-50",
                    isSelected
                      ? "bg-primary text-primary-foreground scale-105"
                      : isToday
                        ? "border border-primary text-primary"
                        : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {format(day, "d")}
                  {holidayName && (
                    <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  )}
                  {customEvent && (
                    <span className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
                  )}
                </button>

                {/* File upload button */}
                {isSameDay(day, selectedDate) && (
                  <label className="absolute -bottom-5 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, dateStr)}
                    />
                    <Upload className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Event dialog */}
      <MemoEventDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        date={dialogDate}
        eventName={eventName}
        hasEvent={customEventMap.has(
          dialogDate ? format(dialogDate, "yyyy-MM-dd") : ""
        )}
        onSave={(newEventName) => {
          if (!dialogDate || !newEventName.trim()) return;
          const dateStr = format(dialogDate, "yyyy-MM-dd");
          const existingEventIndex = customEvents.findIndex(
            (e) => e.date === dateStr
          );
          if (existingEventIndex > -1) {
            const updated = [...customEvents];
            updated[existingEventIndex].name = newEventName.trim();
            setCustomEvents(updated);
          } else {
            setCustomEvents([
              ...customEvents,
              { date: dateStr, name: newEventName.trim() },
            ]);
          }
          setIsDialogOpen(false);
        }}
        onDelete={() => {
          if (!dialogDate) return;
          const dateStr = format(dialogDate, "yyyy-MM-dd");
          setCustomEvents(customEvents.filter((e) => e.date !== dateStr));
          setIsDialogOpen(false);
        }}
      />
    </>
  );
}
