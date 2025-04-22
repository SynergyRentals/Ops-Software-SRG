import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string | number;
    isUp?: boolean;
  };
  iconColor?: string;
  href?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  iconColor = "bg-primary-100 text-primary-700",
  href,
  onClick
}: StatsCardProps) {
  const cardContent = (
    <div className="flex items-center">
      <div className={cn("flex-shrink-0 rounded-md p-3", iconColor)}>
        {icon}
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
          <dd className="flex items-baseline">
            <div className="text-2xl font-semibold text-foreground">{value}</div>
            {trend && (
              <p className={cn(
                "ml-2 flex items-baseline text-sm font-semibold",
                trend.isUp ? "text-green-600" : "text-red-600"
              )}>
                <svg
                  className={cn(
                    "self-center flex-shrink-0 h-5 w-5",
                    trend.isUp ? "text-green-500" : "text-red-500"
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d={
                      trend.isUp
                        ? "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        : "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    }
                    clipRule="evenodd"
                  />
                </svg>
                <span className="sr-only">{trend.isUp ? "Increased by" : "Decreased by"}</span>
                {trend.value}
              </p>
            )}
          </dd>
        </dl>
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-6">
        {cardContent}
      </CardContent>
      {href && (
        <div className="bg-muted px-4 py-4 sm:px-6 rounded-b-lg">
          <div className="text-sm">
            <a
              href={href}
              onClick={onClick}
              className="font-medium text-primary hover:text-primary/80"
            >
              View all
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}
