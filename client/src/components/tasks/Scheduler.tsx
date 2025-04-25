import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Task } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SchedulerProps {
  task: Task;
  onSchedule: () => void;
  onCancel: () => void;
}

export function Scheduler({ task, onSchedule, onCancel }: SchedulerProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch scheduling suggestions when component mounts
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest('GET', `/api/tasks/${task.id}/suggestions`);
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch scheduling suggestions',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching scheduling suggestions:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch scheduling suggestions',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [task.id, toast]);
  
  // Function to handle scheduling the task
  const handleScheduleTask = async (dateIsoString: string) => {
    setIsLoading(true);
    try {
      // Convert ISO string to Date
      const scheduledDate = parseISO(dateIsoString);
      
      // Call API to update task
      const response = await apiRequest(
        'PATCH',
        `/api/tasks/${task.id}`, 
        { 
          scheduledFor: scheduledDate.toISOString(),
          status: 'scheduled'
        }
      );
      
      if (response.ok) {
        // Invalidate tasks query to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        
        toast({
          title: 'Success',
          description: `Task scheduled for ${format(scheduledDate, 'PPP')} at ${format(scheduledDate, 'p')}`,
        });
        
        // Call the onSchedule callback
        onSchedule();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to schedule task',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error scheduling task:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule task',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle manual date selection
  const handleSelectManualDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setCalendarOpen(false);
  };
  
  const handleScheduleManualDate = () => {
    if (selectedDate) {
      // Set time to business hours (10 AM)
      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(10, 0, 0, 0);
      
      handleScheduleTask(dateWithTime.toISOString());
    } else {
      toast({
        title: 'Warning',
        description: 'Please select a date first',
        variant: 'default',
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Schedule Task</CardTitle>
        <CardDescription>
          Choose a suggested time slot or pick a custom date
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Suggested time slots */}
            {suggestions.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium mb-2">Suggested time slots</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((suggestion, index) => {
                    const date = parseISO(suggestion);
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-between"
                        onClick={() => handleScheduleTask(suggestion)}
                        disabled={isLoading}
                      >
                        <span>{format(date, 'PPP')}</span>
                        <Badge variant="outline" className="ml-2">
                          {format(date, 'p')}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-muted-foreground">
                <p>No suggestions available based on task urgency</p>
              </div>
            )}
            
            {/* Manual date selection */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Or choose a custom date</h3>
              <div className="flex flex-row items-center gap-2">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleSelectManualDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  onClick={handleScheduleManualDate}
                  disabled={!selectedDate || isLoading}
                >
                  Schedule
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <div className="text-xs text-muted-foreground">
          {task.urgency === 'urgent' ? (
            <span className="text-red-500 font-semibold">URGENT: Schedule ASAP</span>
          ) : task.urgency === 'high' ? (
            <span className="text-orange-500 font-semibold">HIGH: Today or tomorrow morning</span>
          ) : task.urgency === 'medium' ? (
            <span className="text-blue-500">MEDIUM: Next checkout day</span>
          ) : (
            <span className="text-green-500">LOW: First vacant day</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}