import { useState } from "react";
import { useProperties } from "@/hooks/use-properties";
import { useMaintenanceTasks } from "@/hooks/use-maintenance";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceTask } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiSchedulerDialog } from "./ai-scheduler-dialog";
import { PropertyCalendar } from "./property-calendar";

export function Scheduler() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeView, setActiveView] = useState<string>("property-calendar");
  const [showAiDialog, setShowAiDialog] = useState<boolean>(false);
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: tasks, isLoading: tasksLoading } = useMaintenanceTasks();

  const isLoading = propertiesLoading || tasksLoading;
  
  // Filter tasks for the selected date, making sure tasks is an array before filtering
  const filteredTasks = Array.isArray(tasks) ? tasks.filter(task => {
    if (!selectedDate || !task.dueDate) return false;
    
    const taskDate = new Date(task.dueDate);
    return (
      taskDate.getDate() === selectedDate.getDate() &&
      taskDate.getMonth() === selectedDate.getMonth() &&
      taskDate.getFullYear() === selectedDate.getFullYear()
    );
  }) : [];

  // Get all dates with tasks for highlighting in the calendar
  const datesWithTasks = Array.isArray(tasks) ? tasks.reduce((dates: Date[], task) => {
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      dates.push(date);
    }
    return dates;
  }, []) : [];
  
  // Group tasks by property for list view
  const tasksByProperty = Array.isArray(tasks) ? tasks.reduce((grouped: Record<number, MaintenanceTask[]>, task) => {
    if (!grouped[task.propertyId]) {
      grouped[task.propertyId] = [];
    }
    grouped[task.propertyId].push(task);
    return grouped;
  }, {}) : {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Schedule</h2>
          <p className="text-muted-foreground">Manage and schedule maintenance tasks</p>
        </div>
        <Button onClick={() => setShowAiDialog(true)}>
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Schedule
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="property-calendar">Property Calendars</TabsTrigger>
          <TabsTrigger value="maintenance-calendar">Maintenance Calendar</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        {/* Property Calendar View - NEW */}
        <TabsContent value="property-calendar" className="mt-4">
          <PropertyCalendar view="week" />
        </TabsContent>
        
        {/* Original Calendar View - Renamed to Maintenance Calendar */}
        <TabsContent value="maintenance-calendar" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    booked: datesWithTasks
                  }}
                  modifiersStyles={{
                    booked: { 
                      backgroundColor: 'rgba(15, 118, 110, 0.1)',
                      fontWeight: 'bold' 
                    }
                  }}
                />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedDate ? formatDate(selectedDate, 'MMMM dd, yyyy') : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks scheduled for this date
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {filteredTasks.map((task) => {
                        const property = properties?.find(p => p.id === task.propertyId);
                        return (
                          <div key={task.id} className="border rounded-md p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{task.title}</h3>
                                <p className="text-sm text-muted-foreground">{property?.nickname || `Property #${task.propertyId}`}</p>
                              </div>
                              <Badge className={
                                task.urgency === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                task.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }>
                                {task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1)}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="mt-2 text-sm">{task.description}</p>
                            )}
                            {task.dueDate && (
                              <div className="mt-2 text-xs flex items-center">
                                <svg className="mr-1 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {formatDate(task.dueDate, 'h:mm a')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Scheduled Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !properties?.length || !tasks?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No properties or tasks found
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6">
                    {properties.map((property) => {
                      const propertyTasks = tasksByProperty[property.id] || [];
                      if (propertyTasks.length === 0) return null;
                      
                      return (
                        <div key={property.id} className="space-y-2">
                          <h3 className="font-medium text-lg">{property.nickname}</h3>
                          <Separator />
                          <div className="ml-4 space-y-3">
                            {propertyTasks.map((task) => (
                              <div key={task.id} className="border rounded-md p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">{task.title}</h4>
                                    {task.description && (
                                      <p className="text-sm text-muted-foreground">{task.description}</p>
                                    )}
                                  </div>
                                  <Badge className={
                                    task.urgency === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                    task.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  }>
                                    {task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1)}
                                  </Badge>
                                </div>
                                {task.dueDate && (
                                  <div className="mt-2 text-xs">
                                    <span className="text-muted-foreground">Scheduled:</span> {formatDate(task.dueDate, 'MMM dd, yyyy')} at {formatDate(task.dueDate, 'h:mm a')}
                                  </div>
                                )}
                                <div className="mt-2 text-xs">
                                  <span className="text-muted-foreground">Status:</span> {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AiSchedulerDialog 
        isOpen={showAiDialog} 
        onClose={() => setShowAiDialog(false)} 
      />
    </div>
  );
}
