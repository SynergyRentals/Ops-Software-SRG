import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
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
import { Property, insertPropertySchema } from "@shared/schema";
import { useUpdateProperty } from "@/hooks/use-properties";

// Define an explicit schema for the form that matches what we need
const formSchema = z.object({
  nickname: z.string(),
  title: z.string(),
  type: z.string(),
  address: z.string(),
  icalUrl: z.string().nullable().optional(),
  tags: z.string().optional().transform((val) => 
    val ? val.split(',').map(tag => tag.trim()) : []
  ),
  beds: z.number().nullable().optional(),
  baths: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

type PropertyFormValues = z.infer<typeof formSchema>;

interface EditPropertyDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditPropertyDialog({ 
  property, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditPropertyDialogProps) {
  const updateProperty = useUpdateProperty();
  
  const propertyTypes = [
    "Beach House",
    "Cabin",
    "Apartment",
    "Villa",
    "Condo",
    "Cottage",
    "House",
    "Loft",
    "Townhouse",
    "SINGLE",
    "Other"
  ];

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: property?.nickname || "",
      title: property?.title || "",
      type: property?.type || "",
      address: property?.address || "",
      icalUrl: property?.icalUrl || "",
      tags: property?.tags ? property.tags.join(", ") : "",
      beds: property?.beds || 0,
      baths: property?.baths || 0,
      imageUrl: property?.imageUrl || "",
    } as PropertyFormValues,
  });

  // Reset form when property changes
  useEffect(() => {
    if (property) {
      form.reset({
        nickname: property.nickname || "",
        title: property.title || "",
        type: property.type || "",
        address: property.address || "",
        icalUrl: property.icalUrl || "",
        tags: property.tags ? property.tags.join(", ") : "",
        beds: property.beds || 0,
        baths: property.baths || 0,
        imageUrl: property.imageUrl || "",
      } as PropertyFormValues);
    }
  }, [property, form]);

  const onSubmit = async (values: PropertyFormValues) => {
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        property: values,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating property:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property: {property.nickname}</DialogTitle>
          <DialogDescription>
            Make changes to the property information below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter property nickname" {...field} />
                      </FormControl>
                      <FormDescription>
                        A short name to identify this property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter property title" {...field} />
                      </FormControl>
                      <FormDescription>
                        Full title of the property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter property address" 
                        className="resize-none h-20" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="beds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beds</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Number of beds" 
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="baths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baths</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.5"
                          placeholder="Number of bathrooms" 
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="icalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>iCal URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter iCal URL for availability sync" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      URL to an iCal feed for property availability
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter tags separated by commas (e.g. beach, luxury, family)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of tags for this property
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter URL for property image" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      URL to an image for this property
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateProperty.isPending}
              >
                {updateProperty.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}