// src/lib/calendar/calendar.action.ts

"use server";

// --- Type Definitions for API Response and Application ---

/** Defines the structure of a single event item from the Google Calendar API. */
interface CalendarEvent {
  summary: string;
  start: {
    date: string; // Used for all-day events (holidays)
    dateTime?: string; // Used for time-specific events
  };
}

/** Defines the structure of the overall Google Calendar API response. */
interface GoogleCalendarResponse {
    items?: CalendarEvent[];
}

/** * ✅ FIX: New interface to type the Google Calendar API error response,
 * which typically returns the message nested under 'error'.
 */
interface GoogleCalendarError {
  error: {
    message: string;
  };
}

/** Defines the clean structure used by the application */
export type Holiday = {
  name: string;
  date: string;
};

// ----------------------------------------------------------

/**
 * Fetches Indian holidays for the current year from the Google Calendar API.
 * * @returns A promise that resolves to an array of Holiday objects.
 */
export async function getIndianHolidays(): Promise<Holiday[]> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.PUBLIC_INDIAN_HOLIDAYS_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    console.error("Google Calendar API Key or Calendar ID is not configured.");
    return [];
  }

  const year = new Date().getFullYear();
  const timeMin = new Date(year, 0, 1).toISOString();
  const timeMax = new Date(year, 11, 31).toISOString();

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.append('key', apiKey);
  url.searchParams.append('timeMin', timeMin);
  url.searchParams.append('timeMax', timeMax);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      // 🚀 FIX APPLIED: Cast the error response to the new interface `GoogleCalendarError`
      const error = await response.json() as GoogleCalendarError;
      throw new Error(`Google Calendar API error: ${error.error.message}`);
    }

    const data = await response.json() as GoogleCalendarResponse;

    const holidays: Holiday[] = data.items?.map((event: CalendarEvent) => ({
      name: event.summary,
      date: event.start.date,
    })) || [];

    return holidays;

  } catch (error) {
    console.error("Failed to fetch Indian holidays:", error);
    return [];
  }
}