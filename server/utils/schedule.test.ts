import { describe, it, expect, beforeEach } from 'vitest';
import { suggestSchedule, parseReservations } from './schedule';
import { Task, TaskUrgency } from '../../shared/schema';
import { format, addDays, setHours, setMinutes, parseISO } from 'date-fns';

const createMockTask = (urgency: string = TaskUrgency.Medium): Task => {
  return {
    id: 1,
    externalId: "test-1",
    listingId: "listing-1",
    listingName: "Test Listing",
    action: "Test Action",
    description: "Test Description",
    sourceType: "test",
    sourceLink: "",
    guestName: "Test Guest",
    guestEmail: "test@example.com",
    guestPhone: "123-456-7890",
    teamTarget: "maintenance",
    urgency: urgency as any,
    status: "new",
    scheduledFor: null,
    createdAt: new Date(),
    rawPayload: {}
  };
};

const createMockReservations = (startDate: Date) => {
  return [
    {
      // Current reservation (checkout in 2 days)
      start: startDate,
      end: addDays(startDate, 2)
    },
    {
      // Next reservation (starts in 3 days, ends in 5 days)
      start: addDays(startDate, 3),
      end: addDays(startDate, 5)
    },
    {
      // Reservation after a gap (starts in 7 days, ends in 10 days)
      start: addDays(startDate, 7),
      end: addDays(startDate, 10)
    }
  ];
};

describe('Schedule Utility', () => {
  let fixedDate: Date;
  let mockTask: Task;
  let mockReservations: { start: Date; end: Date }[];

  beforeEach(() => {
    // Create a fixed date for testing (April 25, 2025 at 10:00 AM)
    fixedDate = new Date(2025, 3, 25, 10, 0);
    mockTask = createMockTask();
    mockReservations = createMockReservations(fixedDate);
  });

  describe('suggestSchedule function', () => {
    it('should suggest current time for URGENT tasks during business hours', () => {
      const urgentTask = createMockTask(TaskUrgency.Urgent);
      const suggestions = suggestSchedule(urgentTask, mockReservations, fixedDate);
      
      expect(suggestions.length).toBe(1);
      expect(new Date(suggestions[0])).toEqual(fixedDate);
    });

    it('should suggest next morning for URGENT tasks after cutoff time', () => {
      const urgentTask = createMockTask(TaskUrgency.Urgent);
      const lateEvening = new Date(fixedDate);
      setHours(lateEvening, 23);
      setMinutes(lateEvening, 0);
      
      const suggestions = suggestSchedule(urgentTask, mockReservations, lateEvening);
      
      expect(suggestions.length).toBe(1);
      const suggestion = new Date(suggestions[0]);
      expect(suggestion.getDate()).toBe(lateEvening.getDate() + 1);
      expect(suggestion.getHours()).toBe(8);
    });

    it('should suggest current time for HIGH tasks before 5 PM', () => {
      const highTask = createMockTask(TaskUrgency.High);
      const morningTime = new Date(fixedDate);
      setHours(morningTime, 10);
      
      const suggestions = suggestSchedule(highTask, mockReservations, morningTime);
      
      expect(suggestions.length).toBe(2);
      expect(new Date(suggestions[0])).toEqual(morningTime);
    });

    it('should suggest next checkout day for MEDIUM tasks', () => {
      const mediumTask = createMockTask(TaskUrgency.Medium);
      const expectedCheckoutDay = addDays(fixedDate, 2);
      
      const suggestions = suggestSchedule(mediumTask, mockReservations, fixedDate);
      
      expect(suggestions.length).toBe(1);
      const suggestion = new Date(suggestions[0]);
      expect(suggestion.getDate()).toBe(expectedCheckoutDay.getDate());
      expect(suggestion.getHours()).toBe(14);
    });

    it('should suggest first vacant day for LOW tasks', () => {
      const lowTask = createMockTask(TaskUrgency.Low);
      
      const suggestions = suggestSchedule(lowTask, mockReservations, fixedDate);
      
      expect(suggestions.length).toBe(1);
      
      // First vacant day should be day 6 (day after reservation 2 ends)
      const expectedVacantDay = addDays(fixedDate, 6);
      const suggestion = new Date(suggestions[0]);
      
      expect(suggestion.getDate()).toBe(expectedVacantDay.getDate());
      expect(suggestion.getHours()).toBe(10);
    });

    it('should handle empty reservation calendar', () => {
      const suggestions = suggestSchedule(mockTask, [], fixedDate);
      expect(suggestions.length).toBe(1);
    });
  });

  describe('parseReservations function', () => {
    it('should parse ISO string dates into Date objects', () => {
      const isoReservations = [
        { start: '2025-04-25T10:00:00.000Z', end: '2025-04-27T10:00:00.000Z' },
        { start: '2025-04-28T10:00:00.000Z', end: '2025-04-30T10:00:00.000Z' }
      ];

      const parsed = parseReservations(isoReservations);
      
      expect(parsed.length).toBe(2);
      expect(parsed[0].start instanceof Date).toBe(true);
      expect(parsed[0].end instanceof Date).toBe(true);
      expect(parsed[0].start.toISOString()).toBe(isoReservations[0].start);
      expect(parsed[0].end.toISOString()).toBe(isoReservations[0].end);
    });
  });
});