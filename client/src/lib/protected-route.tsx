import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, error } = useAuth();
  
  console.log(`ProtectedRoute (${path}) - Auth State:`, { 
    user: user ? `${user.username} (${user.role})` : 'null', 
    isLoading, 
    error: error?.message
  });

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </Route>
    );
  }

  if (!user) {
    console.log(`ProtectedRoute (${path}) - Redirecting to auth page`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  console.log(`ProtectedRoute (${path}) - Rendering protected component for ${user.username}`);
  return <Route path={path} component={Component} />;
}
