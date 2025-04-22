import { useState, useMemo } from "react";
import { useProperties } from "@/hooks/use-properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, isToday, isSameDay } from "date-fns";
import { Property, MaintenanceTask } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, User, Clock, Check, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import "./property-week-view.css";
import { useQuery } from "@tanstack/react-query";

interface EventCard {
  id: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  propertyId: number;
  assignedTo?: string | number;
  status: string;
  dueTime?: string;
  priority?: string;
}

interface PropertyWeekViewProps {
  defaultDate?: Date;
}

export function PropertyWeekView({ defaultDate = new Date() }: PropertyWeekViewProps) {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: maintenanceTasks, isLoading: tasksLoading } = useQuery<MaintenanceTask[]>({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/maintenance');
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance tasks');
      }
      return response.json();
    }
  });
  const [events, setEvents] = useState<EventCard[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(defaultDate, { weekStartsOn: 1 }));

  // Generate days of the week for the header
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(currentWeekStart, i);
      days.push({
        date: day,
        dayName: format(day, 'EEEE'),
        dayMonth: format(day, 'MMMM d')
      });
    }
    return days;
  }, [currentWeekStart]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, -7));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, 7));
  };

  // Combine maintenance tasks with calendar events
  const allEvents = useMemo(() => {
    if (!maintenanceTasks) return [];
    
    // Convert maintenance tasks to event cards
    return maintenanceTasks.map((task: MaintenanceTask) => ({
      id: task.id.toString(),
      title: task.title,
      description: task.description,
      start: new Date(task.createdAt || Date.now()),
      end: new Date(task.dueDate || Date.now()),
      propertyId: task.propertyId,
      assignedTo: task.assignedTo || 'Unassigned',
      status: task.status === 'completed' ? 'done' : 
              task.status === 'in_progress' ? 'in-progress' : 'open',
      dueTime: task.dueDate ? format(new Date(task.dueDate), 'h:mm a') : undefined,
      priority: task.urgency === 'high' ? 'high' : 
               task.urgency === 'medium' ? 'medium' : 'low'
    }));
  }, [maintenanceTasks]);

  // Filter events for a specific property and day
  const getEventsForPropertyAndDay = (propertyId: number, date: Date) => {
    return allEvents.filter((event: EventCard) => (
      event.propertyId === propertyId && 
      isSameDay(event.start, date)
    ));
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'done':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'open':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'done':
        return <Check className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'open':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Find property name by ID
  const getPropertyNameById = (id: number) => {
    const property = properties?.find(p => p.id === id);
    return property ? property.nickname : `Property ${id}`;
  };

  // Get the current week range for display
  const weekRangeText = useMemo(() => {
    const startText = format(currentWeekStart, 'MMM d');
    const endText = format(addDays(currentWeekStart, 6), 'MMM d');
    return `${startText} - ${endText}`;
  }, [currentWeekStart]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Property Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{weekRangeText}</span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isLoadingEvents || propertiesLoading || tasksLoading}
          >
            {(isLoadingEvents || propertiesLoading || tasksLoading) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(propertiesLoading || tasksLoading) ? (
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !properties?.length ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            No properties found. Add properties to view the calendar.
          </div>
        ) : (
          <div className="property-calendar">
            {/* Calendar Header - Days of Week */}
            <div className="calendar-grid">
              <div className="property-column header-cell">
                Properties
              </div>
              {weekDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`day-column header-cell ${isToday(day.date) ? 'today' : ''}`}
                >
                  <div className="day-name">{day.dayName}</div>
                  <div className="day-date">{format(day.date, 'MMMM d')}</div>
                </div>
              ))}
            </div>
            
            {/* Calendar Body - Properties and Events */}
            <div className="calendar-body">
              {properties?.map(property => (
                <div key={property.id} className="property-row">
                  <div className="property-column cell">
                    <div className="property-info">
                      <div className="property-name">{property.nickname}</div>
                      <div className="property-address text-xs text-muted-foreground">{property.address}</div>
                    </div>
                  </div>
                  
                  {weekDays.map((day, dayIndex) => {
                    const dayEvents = getEventsForPropertyAndDay(property.id, day.date);
                    
                    return (
                      <div 
                        key={`${property.id}-${dayIndex}`} 
                        className={`day-column cell ${isToday(day.date) ? 'today-cell' : ''}`}
                      >
                        {dayEvents.length === 0 ? (
                          <div className="empty-cell"></div>
                        ) : (
                          <div className="event-cards">
                            {dayEvents.map((event: EventCard) => (
                              <div 
                                key={event.id} 
                                className={`event-card ${getStatusColor(event.status)}`}
                              >
                                <div className="event-header">
                                  <span className="event-status">
                                    {getStatusIcon(event.status)}
                                    <span className="capitalize text-xs mr-1">{event.status}</span>
                                  </span>
                                  {event.priority === 'high' && (
                                    <Badge variant="destructive" className="ml-auto">Urgent</Badge>
                                  )}
                                </div>
                                <h4 className="event-title">{event.title}</h4>
                                <div className="event-details">
                                  <div className="flex items-center text-xs">
                                    <User className="h-3 w-3 mr-1" />
                                    <span>{event.assignedTo}</span>
                                  </div>
                                  {event.dueTime && (
                                    <div className="flex items-center text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      <span>Due: {event.dueTime}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}