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
import { RefreshCcw, ChevronLeft, ChevronRight, Upload, CalendarDays, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative group"
      >
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'rgba(59, 130, 246, 0.3)' }}
        />

        <div className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden p-6">
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 bg-linear-to-br dark:from-blue-500/10 dark:to-cyan-500/10 from-blue-100 to-cyan-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold dark:text-white text-gray-900">
                    Calendar {format(currentMonth, "yyyy")}
                  </h2>
                </div>
                <AnimatePresence>
                  {displayHolidays.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 mt-2"
                    >
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <p className="text-xs text-yellow-500 animate-pulse">
                        Upcoming: {displayHolidays.map((h) => h.name).join(", ")}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 transition-all duration-300"
                    onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                  >
                    <ChevronLeft className="h-4 w-4 dark:text-white text-gray-900" />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 transition-all duration-300"
                    onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                  >
                    <ChevronRight className="h-4 w-4 dark:text-white text-gray-900" />
                  </Button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 180 }} 
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 transition-all duration-300"
                    onClick={fetchHolidays}
                    disabled={isLoading}
                  >
                    <RefreshCcw
                      className={cn(
                        "h-4 w-4 dark:text-white text-gray-900",
                        isLoading && "animate-spin"
                      )}
                    />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Month Display */}
            <motion.p
              key={currentMonth.toString()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-lg font-semibold mb-4 dark:text-white text-gray-900"
            >
              {format(currentMonth, "MMMM yyyy")}
            </motion.p>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center text-sm font-semibold dark:text-gray-400 text-gray-600 mb-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="py-2"
                >
                  {day}
                </motion.div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const holidayName = holidayMap.get(dateStr);
                const customEvent = customEvents.find((e) => e.date === dateStr);

                return (
                  <motion.div
                    key={dateStr}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className="relative flex flex-col items-center"
                  >
                    <motion.button
                      title={[customEvent?.name, holidayName]
                        .filter(Boolean)
                        .join(" | ")}
                      onClick={() => handleDateSelect(day)}
                      onMouseEnter={() => setHoveredDate(dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300 font-medium",
                        isCurrentMonth
                          ? "dark:text-white text-gray-900"
                          : "dark:text-gray-600 text-gray-400 opacity-50",
                        isSelected
                          ? "bg-linear-to-br from-blue-500 to-cyan-500 text-white shadow-lg scale-110"
                          : isToday
                            ? "dark:bg-white/10 bg-blue-100 dark:text-blue-400 text-blue-600 border-2 border-blue-500"
                            : "dark:bg-white/5 bg-gray-50 dark:hover:bg-white/10 hover:bg-gray-100"
                      )}
                    >
                      {/* Glow for selected date */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 rounded-xl blur-md"
                          style={{ background: 'rgba(59, 130, 246, 0.5)' }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      <span className="relative z-10">{format(day, "d")}</span>
                      
                      {/* Event indicators */}
                      <div className="absolute bottom-1 flex gap-1">
                        {holidayName && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-lg"
                          />
                        )}
                        {customEvent && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-lg"
                          />
                        )}
                      </div>
                    </motion.button>

                    {/* File upload button */}
                    <AnimatePresence>
                      {isSameDay(day, selectedDate) && (
                        <motion.label
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute -bottom-6 cursor-pointer"
                        >
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, dateStr)}
                          />
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 rounded-lg dark:bg-white/10 bg-gray-200 dark:hover:bg-white/20 hover:bg-gray-300 transition-all duration-300"
                          >
                            <Upload className="h-3.5 w-3.5 dark:text-white text-gray-900" />
                          </motion.div>
                        </motion.label>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex flex-wrap justify-center gap-4"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-xs dark:text-gray-300 text-gray-600">Holiday</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs dark:text-gray-300 text-gray-600">Event</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs dark:text-gray-300 text-gray-600">Today</span>
              </div>
            </motion.div>
          </div>
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