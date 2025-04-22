import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Property, InsertProperty } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useProperties() {
  return useQuery<Property[], Error>({
    queryKey: ["/api/property"],
    queryFn: getQueryFn => getQueryFn,
    select: (data) => {
      // Ensure we always return an array even if the API returns null or undefined
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useProperty(id: number) {
  return useQuery<Property, Error>({
    queryKey: [`/api/property/${id}`],
    queryFn: getQueryFn => getQueryFn,
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
      const res = await apiRequest("PATCH", `/api/property/${id}`, property);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/property"] });
      queryClient.invalidateQueries({ queryKey: [`/api/property/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Property updated",
        description: "Property has been updated successfully.",
      });
    },
    onError: (error: Error) => {
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
      const res = await apiRequest("POST", "/api/property/import-csv", { csvData });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/property"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Properties imported",
        description: `Successfully imported ${data.properties.length} properties.`,
      });
    },
    onError: (error: Error) => {
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
