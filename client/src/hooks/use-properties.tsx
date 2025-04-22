import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Property, InsertProperty } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useProperties() {
  return useQuery<Property[], Error>({
    queryKey: ["/api/property"],
    select: (data) => {
      // Ensure we always return an array even if the API returns null or undefined
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useProperty(id: number) {
  return useQuery<Property, Error>({
    queryKey: [`/api/property/${id}`],
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (property: InsertProperty) => {
      const res = await apiRequest("POST", "/api/property", property);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Property created",
        description: "Property has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating property",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      property,
    }: {
      id: number;
      property: Partial<InsertProperty>;
    }) => {
      console.log("Making PATCH request to /api/property/" + id, property);
      const res = await apiRequest("PATCH", `/api/property/${id}`, property);
      const updatedProperty = await res.json();
      console.log("Update response:", updatedProperty);
      return updatedProperty;
    },
    onSuccess: (data, variables) => {
      console.log("Property update successful:", data);
      
      // Invalidate all queries that might be affected by this update
      queryClient.invalidateQueries({ queryKey: ["/api/property"] });
      queryClient.invalidateQueries({ queryKey: [`/api/property/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      
      // Show success message
      toast({
        title: "Property updated",
        description: "Property has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Property update error:", error);
      toast({
        title: "Error updating property",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/property/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Property deleted",
        description: "Property has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting property",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useImportPropertiesFromCsv() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (csvData: string) => {
      try {
        console.log("Sending CSV import request");
        const res = await apiRequest("POST", "/api/property/import-csv", { csvData });
        const data = await res.json();
        console.log("CSV import response:", data);
        return data;
      } catch (error: any) {
        console.error("CSV import error in hook:", error);
        // Extract the detailed error message from the response if available
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          throw new Error(
            errorData.message || 
            (errorData.error ? `${errorData.message}: ${errorData.error}` : 'Failed to import CSV')
          );
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("CSV import successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/property"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Properties imported",
        description: `Successfully imported ${data.properties.length} properties.`,
      });
    },
    onError: (error: Error) => {
      console.error("CSV import error toast:", error);
      toast({
        title: "Error importing properties",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSyncPropertyIcal(id: number) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/property/${id}/ical-sync`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property"] });
      queryClient.invalidateQueries({ queryKey: [`/api/property/${id}`] });
      toast({
        title: "iCal synced",
        description: "Property calendar has been synchronized successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error syncing iCal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}