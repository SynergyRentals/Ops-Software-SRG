import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@shared/schema';
import { Scheduler } from './Scheduler';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(task.teamTarget || null);
  const [selectedUrgency, setSelectedUrgency] = useState<string | null>(task.urgency || null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if both team and urgency are selected
  const isReadyForScheduling = selectedTeam && selectedUrgency;

  // Function to update task field with optimistic UI update
  const updateTaskField = async (field: string, value: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Update local state for immediate UI feedback
    if (field === 'teamTarget') {
      setSelectedTeam(value);
    } else if (field === 'urgency') {
      setSelectedUrgency(value);
    } else if (field === 'status') {
      // For status changes, we might need additional UI changes
    }
    
    // Optimistic update in the cache
    const previousData = queryClient.getQueryData<Task[]>(['/api/tasks']);
    
    if (previousData) {
      queryClient.setQueryData(['/api/tasks'], 
        previousData.map(t => 
          t.id === task.id ? { ...t, [field]: value } : t
        )
      );
    }
    
    try {
      // Send request to API
      await apiRequest(
        'PATCH',
        `/api/tasks/${task.id}`,
        { [field]: value }
      );
      
      // Invalidate the query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Check if both team and urgency are selected after this update
      if (
        (field === 'teamTarget' && selectedUrgency) ||
        (field === 'urgency' && selectedTeam)
      ) {
        // Both are now selected, flip the card automatically after a short delay
        setTimeout(() => setIsFlipped(true), 300);
      }
    } catch (error) {
      // Revert the optimistic update
      if (previousData) {
        queryClient.setQueryData(['/api/tasks'], previousData);
      }
      
      // Reset local state
      if (field === 'teamTarget') {
        setSelectedTeam(task.teamTarget);
      } else if (field === 'urgency') {
        setSelectedUrgency(task.urgency);
      }
      
      // Show error toast
      toast({
        title: "Update failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
      
      console.error('Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get color class based on urgency
  const getUrgencyColorClass = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-500 hover:bg-red-600';
      case 'high': return 'bg-orange-500 hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Get color class based on team
  const getTeamColorClass = (team: string) => {
    switch (team) {
      case 'internal': return 'bg-purple-500 hover:bg-purple-600';
      case 'cleaning': return 'bg-blue-500 hover:bg-blue-600';
      case 'maintenance': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'landlord': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Get badge variant based on selected state
  const getButtonVariant = (value: string, selectedValue: string | null) => {
    return selectedValue === value ? 'default' : 'outline';
  };

  return (
    <motion.div
      className="card-container"
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.5 }}
      style={{ perspective: 1000 }}
    >
      {/* Front of card */}
      <motion.div
        className={`card-side front ${isFlipped ? 'hidden' : 'block'}`}
        initial={false}
        animate={{ opacity: isFlipped ? 0 : 1 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="w-full h-full">
          <CardHeader>
            <CardTitle>{task.listingName || task.action || 'Task'}</CardTitle>
            <CardDescription>
              {task.description ? 
                task.description : 
                (task.action || 'No description available')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Team</h4>
                <div className="flex flex-wrap gap-2">
                  {['internal', 'cleaning', 'maintenance', 'landlord'].map((team) => (
                    <Button
                      key={team}
                      variant={getButtonVariant(team, selectedTeam)}
                      size="sm"
                      className={selectedTeam === team ? getTeamColorClass(team) : ''}
                      onClick={() => updateTaskField('teamTarget', team)}
                      disabled={isLoading}
                    >
                      {team.charAt(0).toUpperCase() + team.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Urgency</h4>
                <div className="flex flex-wrap gap-2">
                  {['urgent', 'high', 'medium', 'low'].map((urgency) => (
                    <Button
                      key={urgency}
                      variant={getButtonVariant(urgency, selectedUrgency)}
                      size="sm"
                      className={selectedUrgency === urgency ? getUrgencyColorClass(urgency) : ''}
                      onClick={() => updateTaskField('urgency', urgency)}
                      disabled={isLoading}
                    >
                      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateTaskField('status', 'watch')}
              disabled={isLoading}
            >
              Watch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateTaskField('status', 'closed')}
              disabled={isLoading}
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Back of card - For scheduling */}
      <motion.div
        className={`card-side back ${isFlipped ? 'block' : 'hidden'}`}
        initial={false}
        animate={{ 
          opacity: isFlipped ? 1 : 0,
          rotateY: isFlipped ? 180 : 0 
        }}
        transition={{ duration: 0.25 }}
        style={{ transform: 'rotateY(180deg)' }}
      >
        <Card className="w-full h-full">
          <CardHeader>
            <CardTitle>Schedule Task</CardTitle>
            <CardDescription>
              {task.listingName || task.action || 'Task'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap mb-4">
                <Badge variant="outline" className={getTeamColorClass(selectedTeam || '')}>
                  {selectedTeam ? (selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)) : 'Team'}
                </Badge>
                <Badge variant="outline" className={getUrgencyColorClass(selectedUrgency || '')}>
                  {selectedUrgency ? (selectedUrgency.charAt(0).toUpperCase() + selectedUrgency.slice(1)) : 'Urgency'}
                </Badge>
              </div>
              
              <Scheduler 
                task={task} 
                onSchedule={() => {
                  // After scheduling, go back to main task list
                  setIsFlipped(false);
                  // Invalidate tasks to refresh the list
                  queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
                }}
                onCancel={() => setIsFlipped(false)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFlipped(false)}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => updateTaskField('status', 'scheduled')}
              disabled={isLoading}
            >
              Schedule
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}