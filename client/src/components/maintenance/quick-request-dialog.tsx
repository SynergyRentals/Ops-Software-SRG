import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useProperties } from "@/hooks/use-properties";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  propertyId: z.string().min(1, "Property selection is required"),
  urgency: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Dialog props
interface QuickRequestDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultPropertyId?: number;
  onSuccess?: () => void;
}

export function QuickRequestDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  defaultPropertyId,
  onSuccess,
}: QuickRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && setControlledOpen !== undefined;
  const { toast } = useToast();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const queryClient = useQueryClient();

  // Handle controlled vs uncontrolled state
  const isOpen = isControlled ? controlledOpen : open;
  const setIsOpen = isControlled ? setControlledOpen : setOpen;

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      propertyId: defaultPropertyId?.toString() || "",
      urgency: "low",
      dueDate: "",
      assignedTo: "",
    },
  });

  // Update form when defaultPropertyId changes
  useEffect(() => {
    if (defaultPropertyId) {
      form.setValue("propertyId", defaultPropertyId.toString());
    }
  }, [defaultPropertyId, form]);

  // Create mutation for submitting the form
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/maintenance", {
        title: data.title,
        description: data.description,
        propertyId: parseInt(data.propertyId),
        urgency: data.urgency,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assignedTo: data.assignedTo || undefined,
        status: "open",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create maintenance request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maintenance request submitted successfully!",
      });
      form.reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit request: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Maintenance Request</DialogTitle>
          <DialogDescription>
            Submit a new maintenance request for a property.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={propertiesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Leaking Faucet" {...field} />
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
                      placeholder="Provide details about the maintenance issue..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
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
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of person assigned" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}