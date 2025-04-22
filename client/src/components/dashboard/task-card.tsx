import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaintenanceTask } from "@shared/schema";
import { getUrgencyClass, formatRelativeDate } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";

interface TaskCardProps {
  task: MaintenanceTask & { property?: { nickname: string } };
  onClick?: () => void;
}

const getTaskIcon = (task: MaintenanceTask) => {
  switch (task.urgency) {
    case 'high':
      return (
        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'medium':
      return (
        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'low':
      return (
        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
  }
};

const getUrgencyColorClass = (urgency: string) => {
  switch (urgency) {
    case 'high':
      return 'bg-red-100 text-red-600';
    case 'medium':
      return 'bg-yellow-100 text-yellow-600';
    case 'low':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="min-w-0 flex-1 flex items-center">
              <span className={`flex-shrink-0 h-10 w-10 rounded-full ${getUrgencyColorClass(task.urgency)} flex items-center justify-center`}>
                {getTaskIcon(task)}
              </span>
              <div className="min-w-0 flex-1 px-4">
                <div>
                  <p className="text-sm font-medium text-primary truncate">{task.title}</p>
                  <p className="mt-1 flex items-center text-sm text-muted-foreground">
                    <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" />
                    {task.property?.nickname || `Property #${task.propertyId}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge className={getUrgencyClass(task.urgency)} variant="outline">
              {task.urgency}
            </Badge>
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" />
              {task.dueDate ? formatRelativeDate(task.dueDate) : 'No due date'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
