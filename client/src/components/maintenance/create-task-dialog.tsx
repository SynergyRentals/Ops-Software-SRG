import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProperties } from "@/hooks/use-properties";
import { useAuth } from "@/hooks/use-auth";
import { useCreateMaintenanceTask, useScheduleSuggestions } from "@/hooks/use-maintenance";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { InsertMaintenanceTask } from "@shared/schema";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  propertyId: z.number().int().positive("Please select a property"),
  assignedTo: z.number().int().optional().nullable(),
  urgency: z.enum(["high", "medium", "low"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  dueDate: z.date().optional().nullable(),
});

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskDialog({ isOpen, onClose }: CreateTaskDialogProps) {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { user } = useAuth();
  const [aiSuggestionMode, setAiSuggestionMode] = useState(false);
  const createTask = useCreateMaintenanceTask();
  const scheduleSuggestions = useScheduleSuggestions();
  const [suggestedSlots, setSuggestedSlots] = useState<Array<{ start: string; end: string; confidence: number }>>([]);
  const [aiExplanation, setAiExplanation] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      propertyId: undefined as unknown as number,
      assignedTo: null,
      urgency: "medium",
      status: "pending",
      dueDate: null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const taskData: InsertMaintenanceTask = {
      ...values,
      dueDate: values.dueDate || undefined,
    };
    
    await createTask.mutateAsync(taskData);
    form.reset();
    onClose();
  };

  const requestAiSuggestions = async () => {
    const values = form.getValues();
    if (!values.title || !values.propertyId) {
      form.setError("title", { message: "Title is required for AI scheduling" });
      form.setError("propertyId", { message: "Please select a property for AI scheduling" });
      return;
    }
    
    try {
      // Create availability windows (next 7 days)
      const now = new Date();
      const oneWeekLater = new Date();
      oneWeekLater.setDate(now.getDate() + 7);
      
      const response = await scheduleSuggestions.mutateAsync({
        propertyId: values.propertyId,
        taskTitle: values.title,
        taskDescription: values.description || "",
        urgency: values.urgency,
        availabilityWindows: [
          { start: now.toISOString(), end: oneWeekLater.toISOString() }
        ]
      });
      
      setSuggestedSlots(response.suggestedSlots);
      setAiExplanation(response.explanation);
      setAiSuggestionMode(true);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    }
  };

  const selectSuggestedSlot = (slot: { start: string; end: string }) => {
    form.setValue("dueDate", new Date(slot.start));
    setAiSuggestionMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Maintenance Task</DialogTitle>
          <DialogDescription>
            Fill in the details for the new maintenance task
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {aiSuggestionMode ? (
              <div className="space-y-4">
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-800 dark:text-blue-300">AI Scheduling Suggestions</AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    {aiExplanation}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Suggested time slots:</h3>
                  {suggestedSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No suitable slots found</p>
                  ) : (
                    <div className="space-y-2">
                      {suggestedSlots.map((slot, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => selectSuggestedSlot(slot)}
                        >
                          <span>{format(new Date(slot.start), "PPP p")}</span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                            {Math.round(slot.confidence * 100)}% confidence
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAiSuggestionMode(false)}
                  className="w-full"
                >
                  Back to form
                </Button>
              </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
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
                          placeholder="Enter task description" 
                          className="resize-none h-24" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={propertiesLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a property" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties?.map((property) => (
                              <SelectItem 
                                key={property.id} 
                                value={property.id.toString()}
                              >
                                {property.nickname}
                              </SelectItem>
                            ))}
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
                              <SelectValue placeholder="Select urgency level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              {!aiSuggestionMode && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={requestAiSuggestions}
                  disabled={scheduleSuggestions.isPending}
                >
                  {scheduleSuggestions.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting suggestions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Schedule
                    </>
                  )}
                </Button>
              )}
              <Button 
                type="submit" 
                className="flex-1 sm:flex-none"
                disabled={createTask.isPending || (!aiSuggestionMode && scheduleSuggestions.isPending)}
              >
                {createTask.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
