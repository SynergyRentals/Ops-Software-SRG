import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatus } from '@shared/schema';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Using the actual status values from the backend
type TaskTab = 'new' | 'watch' | 'scheduled' | 'closed';

export default function TaskInboxPage() {
  // Active tab state
  const [activeTab, setActiveTab] = useState<TaskTab>('new');
  
  // WebSocket connection
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for tasks based on active tab/status
  const { 
    data: tasks, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: ['/api/tasks', { status: activeTab }],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?status=${activeTab}`);
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
        
        // Handle 'task:updated' messages
        else if (message.type === 'task:updated') {
          console.log('Task updated:', message.data);
          
          const updatedTask = message.data as Task;
          const status = updatedTask.status;
          
          // Handle different status updates with appropriate notifications
          switch (status) {
            case TaskStatus.Watch:
              toast({
                title: 'Task Watched',
                description: `Task #${updatedTask.id} is now being watched`,
                variant: 'default'
              });
              break;
            case TaskStatus.Closed:
              toast({
                title: 'Task Closed',
                description: `Task #${updatedTask.id} has been closed`,
                variant: 'default'
              });
              break;
            case TaskStatus.Scheduled:
              toast({
                title: 'Task Scheduled',
                description: `Task #${updatedTask.id} has been scheduled`,
                variant: 'default'
              });
              break;
          }
          
          // Update all task lists in the cache to reflect the new status
          // 1. Remove from previous status list (each possible status)
          const statuses: TaskTab[] = ['new', 'watch', 'scheduled', 'closed'];
          statuses.forEach(statusTab => {
            queryClient.setQueryData<Task[]>(
              ['/api/tasks', { status: statusTab }],
              (oldData) => {
                if (!oldData) return [];
                return oldData.filter(task => task.id !== updatedTask.id);
              }
            );
          });
          
          // 2. Add to new status list 
          // Direct 1:1 mapping between backend values and UI tabs
          // Map backend enum values to our UI tabs
          const statusMapping = {
            [TaskStatus.New]: 'new' as TaskTab,
            [TaskStatus.Watch]: 'watch' as TaskTab, 
            [TaskStatus.Scheduled]: 'scheduled' as TaskTab,
            [TaskStatus.Closed]: 'closed' as TaskTab
          };
          
          const targetTab = statusMapping[status];
          if (targetTab) {
            queryClient.setQueryData<Task[]>(
              ['/api/tasks', { status: targetTab }],
              (oldData) => {
                if (!oldData) return [updatedTask];
                
                // Check if already exists
                const exists = oldData.some(task => task.id === updatedTask.id);
                if (exists) {
                  // Update existing task
                  return oldData.map(task => 
                    task.id === updatedTask.id ? updatedTask : task
                  );
                }
                
                // Add task to beginning of list
                return [updatedTask, ...oldData];
              }
            );
          }
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

  // Get counts for tab badges (using the query client cache)
  const getTabCount = (status: TaskTab): number => {
    try {
      const cachedData = queryClient.getQueryData<Task[]>(['/api/tasks', { status }]);
      return cachedData?.length || 0;
    } catch (e) {
      return 0;
    }
  };

  return (
    <MainLayout title="Task Inbox">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Task Inbox</h1>
            <p className="text-muted-foreground">
              Review and manage all tasks
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <CreateTaskDialog />
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${socket ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-muted-foreground">
                {socket ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="new" className="w-full" onValueChange={(value) => setActiveTab(value as TaskTab)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="new">
              New
              {getTabCount('new') > 0 && (
                <Badge variant="outline" className="ml-2 bg-blue-50">
                  {getTabCount('new')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="watch">
              Watching
              {getTabCount('watch') > 0 && (
                <Badge variant="outline" className="ml-2 bg-amber-50">
                  {getTabCount('watch')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Scheduled
              {getTabCount('scheduled') > 0 && (
                <Badge variant="outline" className="ml-2 bg-green-50">
                  {getTabCount('scheduled')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed
              {getTabCount('closed') > 0 && (
                <Badge variant="outline" className="ml-2 bg-gray-50">
                  {getTabCount('closed')}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {(!tasks || tasks.length === 0) ? (
              <div className="bg-muted p-8 text-center rounded-lg mt-4">
                <h3 className="text-lg font-medium">No {activeTab === 'watch' ? 'watched' : activeTab} tasks</h3>
                <p className="text-muted-foreground mt-1">
                  {activeTab === 'new' && 'New incoming tasks will appear here'}
                  {activeTab === 'watch' && 'Tasks you\'re keeping an eye on will appear here'}
                  {activeTab === 'scheduled' && 'Tasks that have been scheduled will appear here'}
                  {activeTab === 'closed' && 'Completed tasks will appear here'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {tasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}