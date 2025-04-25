import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Task } from '@shared/schema';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';

export default function TaskInboxPage() {
  // WebSocket connection
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for tasks with status=new
  const { 
    data: tasks, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: ['/api/tasks', { status: 'new' }],
    queryFn: async () => {
      const response = await fetch('/api/tasks?status=new');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    }
  });

  // Setup WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle 'task:new' messages
        if (message.type === 'task:new') {
          console.log('New task received:', message.data);
          
          // Show toast notification
          toast({
            title: 'New Task Arrived',
            description: message.data.action || 'A new task has been assigned',
          });
          
          // Add to our list of tasks
          queryClient.setQueryData<Task[]>(
            ['/api/tasks', { status: 'new' }],
            (oldData) => {
              if (!oldData) return [message.data];
              
              // Check if the task is already in the list
              const exists = oldData.some(task => task.id === message.data.id);
              if (exists) return oldData;
              
              // Add the new task to the beginning of the list
              return [message.data, ...oldData];
            }
          );
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time task updates',
        variant: 'destructive',
      });
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setSocket(null);
    };
    
    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [queryClient, toast]);

  // Render loading state
  if (isLoading) {
    return (
      <MainLayout title="Task Inbox">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-2">Loading tasks...</p>
        </div>
      </MainLayout>
    );
  }

  // Render error state
  if (isError) {
    return (
      <MainLayout title="Task Inbox">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <h3 className="text-lg font-medium">Error Loading Tasks</h3>
          <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })}
          >
            Try Again
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Task Inbox">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Task Inbox</h1>
            <p className="text-muted-foreground">
              Review and assign incoming tasks
            </p>
          </div>
          
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${socket ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {socket ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {(!tasks || tasks.length === 0) ? (
          <div className="bg-muted p-8 text-center rounded-lg">
            <h3 className="text-lg font-medium">No new tasks</h3>
            <p className="text-muted-foreground mt-1">
              All incoming tasks will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task: Task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}