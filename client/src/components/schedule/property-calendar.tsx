import { useState, useEffect, useMemo } from "react";
import { useProperties } from "@/hooks/use-properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import { enUS } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Property } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Import custom CSS to override react-big-calendar styles
import "./property-calendar.css";

// Date localizer setup for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: string;
  propertyId: number;
  propertyName: string;
  resourceId?: number;
}

// Define custom resource type
interface PropertyResource {
  id: number;
  title: string;
  propertyId: number;
}

interface PropertyCalendarProps {
  view?: "day" | "week" | "month";
  defaultDate?: Date;
}

export function PropertyCalendar({ view = "week", defaultDate = new Date() }: PropertyCalendarProps) {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [viewDate, setViewDate] = useState<Date>(defaultDate);
  
  // Function to fetch events for a property
  const fetchPropertyEvents = async (property: Property) => {
    if (!property.icalUrl) return [];
    
    try {
      const response = await apiRequest("GET", `/api/property/${property.id}/ical-events`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch calendar events");
      }
      
      const data = await response.json();
      return data.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        resourceId: property.id // This property corresponds to the resource ID
      }));
    } catch (error) {
      console.error(`Error fetching events for property ${property.id}:`, error);
      return [];
    }
  };
  
  // Fetch events for all properties
  const fetchAllPropertyEvents = async () => {
    if (!properties?.length) return;
    
    setIsLoadingEvents(true);
    
    try {
      const allEvents: CalendarEvent[] = [];
      
      for (const property of properties) {
        if (property.icalUrl) {
          const propertyEvents = await fetchPropertyEvents(property);
          allEvents.push(...propertyEvents);
        }
      }
      
      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching property events:", error);
      toast({
        title: "Error loading calendar data",
        description: "There was a problem loading property calendars. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };
  
  // Fetch events on component mount and when properties change
  useEffect(() => {
    if (properties?.length) {
      fetchAllPropertyEvents();
    }
  }, [properties]);
  
  // Custom styling for property events
  const eventStyleGetter = (event: CalendarEvent) => {
    const style = {
      backgroundColor: event.status === "CANCELLED" ? "#CBD5E1" : "#0F766E",
      color: "#FFF",
      borderRadius: "4px",
      border: "none",
      opacity: 0.8,
      display: "block",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap" as const
    };
    
    return {
      style
    };
  };
  
  // Generate resources for each property
  const resources: PropertyResource[] = useMemo(() => {
    return properties?.map(property => ({
      id: property.id,
      title: property.nickname,
      propertyId: property.id
    })) || [];
  }, [properties]);
  
  // Handle date navigation
  const handleNavigate = (newDate: Date) => {
    setViewDate(newDate);
  };
  
  // Components for customizing the calendar layout
  const components = {
    // This helps the calendar display dates on top with properties on the left
    resourceHeader: ({ resource }: { resource: PropertyResource }) => (
      <span className="resource-header">{resource.title}</span>
    )
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Property Calendars</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchAllPropertyEvents}
          disabled={isLoadingEvents || propertiesLoading}
        >
          {isLoadingEvents ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {(isLoadingEvents || propertiesLoading) ? (
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !properties?.length ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            No properties found. Add properties with iCal URLs to see their calendars.
          </div>
        ) : (
          <div className="h-[600px] calendar-container">
            <Calendar
              localizer={localizer}
              events={events}
              defaultView="week"
              defaultDate={defaultDate}
              startAccessor="start"
              endAccessor="end"
              resourceIdAccessor="id"
              resourceTitleAccessor="title"
              resources={resources}
              date={viewDate}
              onNavigate={handleNavigate}
              views={{
                day: true,
                week: true,
                month: true,
              }}
              components={components}
              eventPropGetter={eventStyleGetter}
              tooltipAccessor={(event) => `${event.title} - ${event.description || "No description"}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}