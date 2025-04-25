import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertTaskSchema, TaskTeamTarget, TaskUrgency, TaskStatus } from '@shared/schema';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';

// Extend the insert schema with form validation rules
const createTaskSchema = insertTaskSchema.extend({
  listingName: z.string().min(2, 'Property name must be at least 2 characters'),
  action: z.string().min(2, 'Action must be at least 2 characters'),
  description: z.string().optional(),
  teamTarget: z.enum([
    TaskTeamTarget.Internal,
    TaskTeamTarget.Cleaning,
    TaskTeamTarget.Maintenance,
    TaskTeamTarget.Landlord
  ]),
  urgency: z.enum([
    TaskUrgency.Urgent,
    TaskUrgency.High,
    TaskUrgency.Medium,
    TaskUrgency.Low
  ]),
}).omit({ id: true, status: true, watchCount: true, closedAt: true });

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      // Add the status field explicitly
      const taskData = {
        ...data,
        status: TaskStatus.New // Set the initial status to "new"
      };
      
      const result = await apiRequest('POST', '/api/tasks', taskData);
      
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
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
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2111 S 9th Bottom" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the property this task is for
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
  );
}