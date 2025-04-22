import { useState } from 'react';
import { useMaintenanceTasks } from '@/hooks/use-maintenance';
import { PropertyWeekView } from './property-week-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AISchedulerDialog as AIDialog } from './ai-scheduler-dialog';

export function Scheduler() {
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  
  return (
    <div className="scheduler-container flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAIDialogOpen(true)}>
            AI Suggestions
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="week" className="w-full">
        <TabsList>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="week" className="mt-4">
          <PropertyWeekView />
        </TabsContent>
        
        <TabsContent value="month" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Month View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon: Month view will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>List View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon: List view will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AIDialog 
        open={isAIDialogOpen} 
        onOpenChange={setIsAIDialogOpen} 
      />
    </div>
  );
}