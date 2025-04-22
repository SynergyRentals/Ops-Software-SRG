import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MaintenanceTask, InsertMaintenanceTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useMaintenanceTasks(filters?: {
  propertyId?: number;
  status?: string;
  urgency?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.propertyId) queryParams.append("propertyId", filters.propertyId.toString());
  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.urgency) queryParams.append("urgency", filters.urgency);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<MaintenanceTask[], Error>({
    queryKey: ["/api/maintenance", queryString],
    select: (data) => {
      // Ensure we always return an array even if the API returns null or undefined
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useMaintenanceTask(id: number) {
  return useQuery<MaintenanceTask, Error>({
    queryKey: [`/api/maintenance/${id}`],
    enabled: !!id,
  });
}

export function useCreateMaintenanceTask() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (task: InsertMaintenanceTask) => {
      const res = await apiRequest("POST", "/api/maintenance", task);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Task created",
        description: "Maintenance task has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMaintenanceTask() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      task,
    }: {
      id: number;
      task: Partial<InsertMaintenanceTask>;
    }) => {
      const res = await apiRequest("PATCH", `/api/maintenance/${id}`, task);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: [`/api/maintenance/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Task updated",
        description: "Maintenance task has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMaintenanceTask() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Task deleted",
        description: "Maintenance task has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useScheduleSuggestions() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      propertyId: number;
      taskTitle: string;
      taskDescription: string;
      urgency: string;
      availabilityWindows: Array<{ start: string; end: string }>;
    }) => {
      const res = await apiRequest("POST", "/api/schedule", params);
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error getting schedule suggestions",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateScheduledTask() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      propertyId: number;
      assignedTo?: number;
      urgency: string;
      suggestedSlot: { start: string; end: string };
    }) => {
      const res = await apiRequest("POST", "/api/schedule/task", params);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      toast({
        title: "Task scheduled",
        description: "Maintenance task has been scheduled successfully using AI suggestions.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error scheduling task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
