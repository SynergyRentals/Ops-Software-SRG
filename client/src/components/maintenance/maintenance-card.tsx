import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle,
  Clock,
  HelpCircle,
  MapPin,
  User,
} from "lucide-react";
import { MaintenanceTask } from "@shared/schema";
import { getUrgencyClass, formatRelativeDate, truncateText } from "@/lib/utils";
import { useState } from "react";
import { useUpdateMaintenanceTask } from "@/hooks/use-maintenance";

interface MaintenanceCardProps {
  task: MaintenanceTask & {
    property?: {
      id: number;
      nickname: string;
      type: string;
      address: string;
      imageUrl?: string;
    };
    assignedUser?: {
      id: number;
      username: string;
      name: string;
      role: string;
    };
  };
  onClick?: () => void;
}

export function MaintenanceCard({ task, onClick }: MaintenanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const updateTask = useUpdateMaintenanceTask();

  const handleStatusChange = (newStatus: string) => {
    updateTask.mutate({
      id: task.id,
      task: { status: newStatus }
    });
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">{task.title}</h3>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              {task.property?.nickname || `Property #${task.propertyId}`}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge className={getUrgencyClass(task.urgency)}>
              {task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1)}
            </Badge>
            <div className="mt-1">{getStatusBadge(task.status)}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{task.dueDate ? formatRelativeDate(task.dueDate) : 'No due date'}</span>
          </div>
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{task.assignedUser?.name || 'Unassigned'}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Created: {formatRelativeDate(task.createdAt)}</span>
          </div>
          <div className="flex items-center">
            <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Source: {task.source}</span>
          </div>
        </div>
        
        {task.description && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {isExpanded ? task.description : truncateText(task.description, 100)}
            </p>
            {task.description.length > 100 && (
              <Button
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-primary"
                onClick={toggleExpanded}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
      
      {task.status !== 'completed' && task.status !== 'cancelled' && (
        <CardFooter className="border-t pt-4 flex justify-end space-x-2">
          {task.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange('in_progress');
              }}
              disabled={updateTask.isPending}
            >
              Start Task
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              size="sm"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange('completed');
              }}
              disabled={updateTask.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
