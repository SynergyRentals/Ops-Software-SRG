import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InventoryItem, InsertInventoryItem, InsertSupplyRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useInventoryItems(propertyId?: number) {
  const queryParams = propertyId ? `?propertyId=${propertyId}` : "";
  
  return useQuery<InventoryItem[], Error>({
    queryKey: [`/api/inventory${queryParams}`],
    select: (data) => {
      // Ensure we always return an array even if the API returns null or undefined
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useInventoryItem(id: number) {
  return useQuery<InventoryItem, Error>({
    queryKey: [`/api/inventory/${id}`],
    enabled: !!id,
  });
}

export function useLowStockItems() {
  return useQuery<InventoryItem[], Error>({
    queryKey: ["/api/inventory/alerts/low-stock"],
    select: (data) => {
      // Ensure we always return an array even if the API returns null or undefined
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useCreateInventoryItem() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: InsertInventoryItem) => {
      const res = await apiRequest("POST", "/api/inventory", item);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/alerts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Item created",
        description: "Inventory item has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInventoryItem() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      item,
    }: {
      id: number;
      item: Partial<InsertInventoryItem>;
    }) => {
      const res = await apiRequest("PATCH", `/api/inventory/${id}`, item);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: [`/api/inventory/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/alerts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteInventoryItem() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/alerts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Item deleted",
        description: "Inventory item has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateSupplyRequest() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: {
      propertyId: number;
      requestedBy: number;
      items: Array<{ itemId: number; quantity: number }>;
    }) => {
      const res = await apiRequest("POST", "/api/inventory/supply-request", request);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Supply request created",
        description: "Supply request has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating supply request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAutoPurchase() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/inventory/auto-purchase");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/alerts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Auto-purchase completed",
        description: `Successfully purchased ${data.itemsPurchased} items.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error triggering auto-purchase",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
