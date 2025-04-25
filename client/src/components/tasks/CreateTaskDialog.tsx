import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TaskStatus, TaskTeamTarget, TaskUrgency } from "@shared/schema";
import { type Property } from "@shared/schema";

// Create a schema for task creation
const createTaskSchema = z.object({
  listingName: z.string().min(1, { message: "Property is required" }),
  action: z.string().min(3, { message: "Action/title must be at least 3 characters" }),
  description: z.string().optional(),
  teamTarget: z.enum([
    TaskTeamTarget.Internal,
    TaskTeamTarget.Cleaning,
    TaskTeamTarget.Maintenance,
    TaskTeamTarget.Landlord,
  ]),
  urgency: z.enum([
    TaskUrgency.Urgent,
    TaskUrgency.High,
    TaskUrgency.Medium,
    TaskUrgency.Low,
  ]),
  externalId: z.string().optional(),
  status: z.enum([
    TaskStatus.New,
    TaskStatus.Watch,
    TaskStatus.Scheduled,
    TaskStatus.Closed,
  ]).optional()
}).omit({ id: true, status: true, watchCount: true, closedAt: true });

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch properties for the dropdown
  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/property'],
    queryFn: async () => {
      const response = await fetch('/api/property');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json() as Promise<Property[]>;
    },
    enabled: open, // Only fetch when dialog is open
  });

  // Initialize form with default values
  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      listingName: '',
      action: '',
      description: '',
      teamTarget: TaskTeamTarget.Internal,
      urgency: TaskUrgency.Medium,
    },
  });

  async function onSubmit(data: CreateTaskFormValues) {
    setIsSubmitting(true);
    console.log('Form submission data:', data);

    try {
      // Add the status field explicitly
      const taskData = {
        ...data,
        status: TaskStatus.New // Set the initial status to "new"
      };
      
      console.log('Sending task data to API:', taskData);
      const result = await apiRequest('POST', '/api/tasks', taskData);
      console.log('API response:', result);
      
      // Invalidate the tasks query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Show success toast
      toast({
        title: 'Task Created',
        description: 'Your task has been created successfully.',
      });
      
      // Close the dialog and reset form
      setOpen(false);
      form.reset();
      
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button 
        variant="default" 
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="h-4 w-4" />
        Create Task
      </Button>
      
      <Dialog 
        open={open} 
        onOpenChange={setOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task for a property. Fill out the details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="listingName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingProperties}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingProperties ? (
                          <SelectItem value="loading" disabled>Loading properties...</SelectItem>
                        ) : properties && properties.length > 0 ? (
                          properties.map((property) => (
                            <SelectItem 
                              key={property.id} 
                              value={property.nickname || property.title || `Property ${property.id}`}
                            >
                              {property.nickname || property.title || `Property ${property.id}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No properties found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the property this task is for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action/Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Clean bathroom" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short title describing what needs to be done
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Deep clean bathroom, including shower, toilet, and sink" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide additional details about the task (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="teamTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TaskTeamTarget.Internal}>Internal</SelectItem>
                          <SelectItem value={TaskTeamTarget.Cleaning}>Cleaning</SelectItem>
                          <SelectItem value={TaskTeamTarget.Maintenance}>Maintenance</SelectItem>
                          <SelectItem value={TaskTeamTarget.Landlord}>Landlord</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TaskUrgency.Urgent}>Urgent</SelectItem>
                          <SelectItem value={TaskUrgency.High}>High</SelectItem>
                          <SelectItem value={TaskUrgency.Medium}>Medium</SelectItem>
                          <SelectItem value={TaskUrgency.Low}>Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}