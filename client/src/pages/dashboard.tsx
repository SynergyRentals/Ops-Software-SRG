import { useQuery } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-properties";
import { useMaintenanceTasks } from "@/hooks/use-maintenance";
import { useLowStockItems } from "@/hooks/use-inventory";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TaskCard } from "@/components/dashboard/task-card";
import { InventoryOverview } from "@/components/dashboard/inventory-overview";
import { PropertyList } from "@/components/dashboard/property-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Plus, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { CreateTaskDialog } from "@/components/maintenance/create-task-dialog";

export default function Dashboard() {
  const [_, navigate] = useLocation();
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<{
    propertiesCount: number;
    pendingTasks: number;
    completedTasks: number;
    inventoryAlerts: number;
  }>({
    queryKey: ["/api/dashboard/overview"],
    queryFn: getQueryFn => getQueryFn,
  });
  
  const { data: properties } = useProperties();
  const { data: tasks } = useMaintenanceTasks();
  const { data: lowStockItems } = useLowStockItems();
  
  // Get most recent/urgent tasks
  const pendingTasks = tasks
    ?.filter(task => task.status === 'pending')
    .sort((a, b) => {
      // Sort by urgency first, then by due date
      const urgencyOrder = { high: 1, medium: 2, low: 3 };
      const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 99;
      const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 99;
      
      if (aUrgency !== bUrgency) return aUrgency - bUrgency;
      
      // If same urgency, sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // If no due date, put it at the end
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      return 0;
    })
    .slice(0, 3);

  return (
    <MainLayout title="Dashboard">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateTaskDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
          <Button 
            onClick={() => navigate("/schedule")}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            AI Schedule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatsCard 
              title="Properties" 
              value={dashboardStats?.propertiesCount ?? 0}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              iconColor="bg-primary-100 text-primary"
              href="/properties"
              onClick={() => navigate("/properties")}
            />
            
            <StatsCard 
              title="Pending Tasks" 
              value={dashboardStats?.pendingTasks ?? 0}
              trend={tasks?.length ? { value: tasks.length < 10 ? tasks.length : Math.floor(tasks.length / 5), isUp: true } : undefined}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="bg-yellow-100 text-yellow-600"
              href="/maintenance"
              onClick={() => navigate("/maintenance")}
            />
            
            <StatsCard 
              title="Inventory Alerts" 
              value={dashboardStats?.inventoryAlerts ?? 0}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              iconColor="bg-red-100 text-red-600"
              href="/inventory"
              onClick={() => navigate("/inventory")}
            />
            
            <StatsCard 
              title="Completed Tasks" 
              value={dashboardStats?.completedTasks ?? 0}
              trend={dashboardStats?.completedTasks ? { value: "12%", isUp: true } : undefined}
              icon={
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="bg-green-100 text-green-600"
              href="/maintenance?status=completed"
              onClick={() => navigate("/maintenance?status=completed")}
            />
          </>
        )}
      </div>

      {/* Tasks & Inventory Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Maintenance Tasks */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Maintenance Tasks</h2>
          
          {pendingTasks?.length ? (
            <div className="space-y-4">
              {pendingTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => navigate(`/maintenance?task=${task.id}`)}
                />
              ))}
              
              <div className="text-sm">
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => navigate("/maintenance")}
                >
                  View all maintenance tasks
                  <span aria-hidden="true"> &rarr;</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center">
              <p className="text-muted-foreground">No pending tasks at the moment</p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => setShowCreateTaskDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Task
              </Button>
            </div>
          )}
        </div>

        {/* Inventory Overview */}
        <InventoryOverview />
      </div>

      {/* Properties Section */}
      <PropertyList />

      {/* Create Task Dialog */}
      <CreateTaskDialog 
        isOpen={showCreateTaskDialog} 
        onClose={() => setShowCreateTaskDialog(false)}
      />
    </MainLayout>
  );
}
