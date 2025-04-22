import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { CreateTaskDialog } from "@/components/maintenance/create-task-dialog";
import { MaintenanceTask } from "@shared/schema";
import { useMaintenanceTask } from "@/hooks/use-maintenance";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MaintenanceCard } from "@/components/maintenance/maintenance-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Maintenance() {
  const [location, navigate] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  // Parse task ID from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const taskId = searchParams.get('task');
    if (taskId) {
      setSelectedTaskId(parseInt(taskId));
    }
  }, [location]);
  
  // Fetch task details if a task is selected
  const { data: selectedTask, isLoading: taskLoading } = useMaintenanceTask(selectedTaskId || 0);

  const handleTaskClick = (task: MaintenanceTask) => {
    // Update URL with task ID
    navigate(`/maintenance?task=${task.id}`);
    setSelectedTaskId(task.id);
  };

  const handleCloseTaskDetails = () => {
    navigate('/maintenance');
    setSelectedTaskId(null);
  };

  return (
    <MainLayout title="Maintenance">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance Tasks</h1>
          <p className="text-muted-foreground">Manage and track maintenance tasks for your properties</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      <MaintenanceList onTaskClick={handleTaskClick} />
      
      {/* Create Task Dialog */}
      <CreateTaskDialog 
        isOpen={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
      />
      
      {/* Task Details Dialog */}
      <Dialog open={!!selectedTaskId} onOpenChange={(open) => !open && handleCloseTaskDetails()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {taskLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ) : selectedTask ? (
            <MaintenanceCard task={selectedTask} />
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Task not found or has been deleted.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
