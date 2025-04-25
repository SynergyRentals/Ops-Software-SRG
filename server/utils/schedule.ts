import { Task, TaskUrgency } from '@shared/schema';
import { format, addDays, setHours, setMinutes, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';

// Type for a calendar reservation slot
type Reservation = {
  start: Date;
  end: Date;
};

/**
 * Suggests schedule date/time according to business rules:
 * - Urgent → today (before 22:00)
 * - High → today, else next-day before 12:00
 * - Medium → reservation checkout day
 * - Low → first fully vacant day
 * 
 * @param task - The task to schedule
 * @param unitCalendar - Array of reservations with start and end dates
 * @param now - Current date/time (defaults to current time)
 * @returns Array of ISO date strings representing suggested time slots
 */
export function suggestSchedule(
  task: Task, 
  unitCalendar: Reservation[] = [], 
  now = new Date()
): string[] {
  const urgency = task.urgency || TaskUrgency.Medium;
  const suggestions: Date[] = [];
  
  // Sort reservations chronologically
  const sortedReservations = [...unitCalendar].sort((a, b) => 
    a.start.getTime() - b.start.getTime()
  );
  
  // For URGENT tasks - today before 22:00
  if (urgency === TaskUrgency.Urgent) {
    const cutoffTime = new Date(now);
    setHours(cutoffTime, 22);
    setMinutes(cutoffTime, 0);
    
    // If it's before 22:00, suggest current time
    if (isBefore(now, cutoffTime)) {
      suggestions.push(now);
    } else {
      // If after 22:00, suggest early next day (8:00 AM)
      const nextDay = addDays(now, 1);
      const nextDayMorning = new Date(nextDay);
      setHours(nextDayMorning, 8);
      setMinutes(nextDayMorning, 0);
      suggestions.push(nextDayMorning);
    }
  }
  
  // For HIGH priority tasks - today or next day before noon
  else if (urgency === TaskUrgency.High) {
    const currentHour = now.getHours();
    
    // If it's before 5 PM, suggest current time
    if (currentHour < 17) {
      suggestions.push(now);
    } 
    
    // Suggest next day at 10:00 AM
    const nextDay = addDays(now, 1);
    const nextDay10AM = new Date(nextDay);
    setHours(nextDay10AM, 10);
    setMinutes(nextDay10AM, 0);
    suggestions.push(nextDay10AM);
  }
  
  // For MEDIUM priority tasks - find next checkout day
  else if (urgency === TaskUrgency.Medium) {
    // Look for checkout days (end dates of reservations)
    const checkoutDays: Date[] = [];
    
    for (const reservation of sortedReservations) {
      // Only consider future checkout days
      if (isAfter(reservation.end, now)) {
        const checkoutDay = new Date(reservation.end);
        setHours(checkoutDay, 14); // Default checkout time is usually after noon
        setMinutes(checkoutDay, 0);
        checkoutDays.push(checkoutDay);
      }
    }
    
    // If we found checkout days, suggest the next one
    if (checkoutDays.length > 0) {
      suggestions.push(checkoutDays[0]);
    } else {
      // If no checkout days found, suggest next day at noon
      const nextDay = addDays(now, 1);
      const nextDayNoon = new Date(nextDay);
      setHours(nextDayNoon, 12);
      setMinutes(nextDayNoon, 0);
      suggestions.push(nextDayNoon);
    }
  }
  
  // For LOW priority tasks - find first fully vacant day
  else if (urgency === TaskUrgency.Low) {
    let currentDay = new Date(now);
    let daysToCheck = 30; // Limit search to next 30 days
    
    while (daysToCheck > 0) {
      currentDay = addDays(currentDay, 1);
      let isDayVacant = true;
      
      // Check if currentDay overlaps with any reservation
      for (const reservation of sortedReservations) {
        if (
          (isSameDay(currentDay, reservation.start) || isAfter(currentDay, reservation.start)) &&
          (isSameDay(currentDay, reservation.end) || isBefore(currentDay, reservation.end))
        ) {
          isDayVacant = false;
          break;
        }
      }
      
      if (isDayVacant) {
        const vacantDay = new Date(currentDay);
        setHours(vacantDay, 10);
        setMinutes(vacantDay, 0);
        suggestions.push(vacantDay);
        break;
      }
      
      daysToCheck--;
    }
    
    // If no vacant day found within 30 days, suggest a day 7 days from now
    if (suggestions.length === 0) {
      const fallbackDay = addDays(now, 7);
      setHours(fallbackDay, 10);
      setMinutes(fallbackDay, 0);
      suggestions.push(fallbackDay);
    }
  }
  
  // Convert all dates to ISO strings
  return suggestions.map(date => date.toISOString());
}

/**
 * Parses ISO string dates into Reservation objects for calendar processing
 * @param reservationData - Array of objects with ISO string dates
 * @returns Array of Reservation objects with Date objects
 */
export function parseReservations(reservationData: { start: string; end: string }[]): Reservation[] {
  return reservationData.map(reservation => ({
    start: parseISO(reservation.start),
    end: parseISO(reservation.end)
  }));
}