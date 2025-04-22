import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  Calendar,
  Home,
  Package,
  Settings,
  Timer,
  Info,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out.",
        variant: "destructive"
      });
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: <Home className="mr-3 h-5 w-5" />,
      href: "/"
    },
    {
      label: "Schedule",
      icon: <Calendar className="mr-3 h-5 w-5" />,
      href: "/schedule"
    },
    {
      label: "Maintenance",
      icon: <Timer className="mr-3 h-5 w-5" />,
      href: "/maintenance"
    },
    {
      label: "Inventory",
      icon: <Package className="mr-3 h-5 w-5" />,
      href: "/inventory"
    },
    {
      label: "Properties",
      icon: <Info className="mr-3 h-5 w-5" />,
      href: "/properties"
    },
    {
      label: "Reports",
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
      href: "/reports"
    },
    {
      label: "Settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
      href: "/settings"
    }
  ];

  return (
    <aside className={cn("flex flex-col w-64 bg-sidebar border-r border-sidebar-border", className)}>
      <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <span className="text-xl font-semibold text-sidebar-primary">STR Platform</span>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location === item.href
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
                )}
              >
                {item.icon}
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://avatar.vercel.sh/${user?.username}.png`} alt={user?.name || user?.username} />
              <AvatarFallback>{user?.name?.[0] || user?.username?.[0]}</AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user?.name || user?.username}
              </p>
              <p className="text-xs font-medium text-sidebar-foreground/60 capitalize">
                {user?.role}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
