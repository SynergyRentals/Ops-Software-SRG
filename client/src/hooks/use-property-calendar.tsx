import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: string;
  propertyId: number;
  propertyName: string;
  type?: 'reservation';
}

export function usePropertyCalendarEvents(propertyId: number) {
  return useQuery<CalendarEvent[]>({
    queryKey: [`/api/property/${propertyId}/ical-events`],
    queryFn: async () => {
      try {
        console.log(`Making GET request to /api/property/${propertyId}/ical-events`);
        const response = await apiRequest('GET', `/api/property/${propertyId}/ical-events`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API request failed:', errorData);
          throw new Error(errorData.message || 'Failed to fetch property calendar events');
        }
        
        // Convert string dates to Date objects
        const events = await response.json();
        return events.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          type: 'reservation'
        }));
      } catch (error) {
        console.error(`Error fetching events for property ${propertyId}:`, error);
        return [];
      }
    },
    enabled: !!propertyId && propertyId > 0,
  });
}