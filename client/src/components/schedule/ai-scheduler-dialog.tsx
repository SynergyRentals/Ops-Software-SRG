import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProperties } from "@/hooks/use-properties";
import { useScheduleSuggestions, useCreateScheduledTask } from "@/hooks/use-maintenance";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import {
  Form,
  FormControl,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  propertyId: z.number().int().positive("Please select a property"),
  taskTitle: z.string().min(3, "Title must be at least 3 characters"),
  taskDescription: z.string().optional(),
  urgency: z.enum(["high", "medium", "low"]),
  availabilityStart: z.date(),
  availabilityEnd: z.date(),
});

interface AiSchedulerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSchedulerDialog({ isOpen, onClose }: AiSchedulerDialogProps) {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const scheduleSuggestions = useScheduleSuggestions();
  const createScheduledTask = useCreateScheduledTask();
  const [suggestedSlots, setSuggestedSlots] = useState<Array<{ start: string; end: string; confidence: number }>>([]);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [showResults, setShowResults] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: undefined as unknown as number,
      taskTitle: "",
      taskDescription: "",
      urgency: "medium",
      availabilityStart: startOfDay(new Date()),
      availabilityEnd: endOfDay(addDays(new Date(), 7)),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await scheduleSuggestions.mutateAsync({
        propertyId: values.propertyId,
        taskTitle: values.taskTitle,
        taskDescription: values.taskDescription || "",
        urgency: values.urgency,
        availabilityWindows: [
          { 
            start: values.availabilityStart.toISOString(), 
            end: values.availabilityEnd.toISOString() 
          }
        ]
      });
      
      setSuggestedSlots(response.suggestedSlots);
      setAiExplanation(response.explanation);
      setShowResults(true);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    }
  };

  const handleSelectSlot = async (slot: { start: string; end: string }) => {
    try {
      const values = form.getValues();
      await createScheduledTask.mutateAsync({
        title: values.taskTitle,
        description: values.taskDescription || "",
        propertyId: values.propertyId,
        urgency: values.urgency,
        suggestedSlot: slot
      });
      
      onClose();
      form.reset();
      setShowResults(false);
    } catch (error) {
      console.error("Error creating scheduled task:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        if (!createScheduledTask.isPending) {
          form.reset();
          setShowResults(false);
        }
      }
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>AI-Assisted Scheduling</DialogTitle>
          <DialogDescription>
            Let AI suggest the optimal time for your maintenance task
          </DialogDescription>
        </DialogHeader>
        
        {showResults ? (
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
                <p className="text-sm text-muted-foreground">No suitable slots found. Try adjusting your availability window or task details.</p>
              ) : (
                <div className="space-y-2">
                  {suggestedSlots.map((slot, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleSelectSlot(slot)}
                      disabled={createScheduledTask.isPending}
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
            
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowResults(false)}
                disabled={createScheduledTask.isPending}
              >
                Back
              </Button>
              <Button type="button" onClick={onClose} disabled={createScheduledTask.isPending}>
                {createScheduledTask.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating task...
                  </>
                ) : "Cancel"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="taskTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="taskDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter task description (optional)" 
                        className="resize-none h-20" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="availabilityStart"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Available From</FormLabel>
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
                            selected={field.value}
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
                
                <FormField
                  control={form.control}
                  name="availabilityEnd"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Available To</FormLabel>
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
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              date < form.getValues().availabilityStart ||
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
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
                      Get AI Suggestions
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
