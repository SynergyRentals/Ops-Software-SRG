import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { MaintenanceTask } from '@shared/schema';

// Create the hook for fetching a single maintenance task
export function useMaintenanceTask(id: number) {
  return useQuery<MaintenanceTask>({
    queryKey: [`/api/maintenance/${id}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/maintenance/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance task');
      }
      return response.json();
    },
    enabled: id > 0  // Only run this query if we have a valid ID
  });
}

// Create the hook for fetching multiple maintenance tasks
export function useMaintenanceTasks(propertyId?: number, status?: string, urgency?: string) {
  const queryParams = new URLSearchParams();
  
  if (propertyId) queryParams.append('propertyId', propertyId.toString());
  if (status) queryParams.append('status', status);
  if (urgency) queryParams.append('urgency', urgency);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return useQuery<MaintenanceTask[]>({
    queryKey: ['/api/maintenance', propertyId, status, urgency],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/maintenance${queryString}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch maintenance tasks');
      }
      
      return response.json();
    }
  });
}

// Function to create a new maintenance task
export function useCreateMaintenanceTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: Omit<MaintenanceTask, 'id' | 'createdAt'>) => {
      const response = await apiRequest('POST', '/api/maintenance', taskData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create maintenance task');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast({
        title: 'Task Created',
        description: 'The maintenance task has been created successfully',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create maintenance task',
        variant: 'destructive'
      });
    }
  });
}

// Function to update an existing maintenance task
export function useUpdateMaintenanceTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, [key: string]: any }) => {
      const response = await apiRequest('PATCH', `/api/maintenance/${id}`, data);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update maintenance task');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast({
        title: 'Task Updated',
        description: 'The maintenance task has been updated successfully',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update maintenance task',
        variant: 'destructive'
      });
    }
  });
}

// Function to delete a maintenance task
export function useDeleteMaintenanceTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/maintenance/${id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete maintenance task');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast({
        title: 'Task Deleted',
        description: 'The maintenance task has been deleted',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete maintenance task',
        variant: 'destructive'
      });
    }
  });
}

// Hook for AI-generated schedule suggestions
export function useScheduleSuggestions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { propertyId: number }) => {
      const response = await apiRequest('POST', '/api/schedule/ai-suggestions', data);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate schedule suggestions');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast({
        title: 'Suggestions Generated',
        description: 'AI-powered schedule suggestions have been generated',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate schedule suggestions',
        variant: 'destructive'
      });
    }
  });
}