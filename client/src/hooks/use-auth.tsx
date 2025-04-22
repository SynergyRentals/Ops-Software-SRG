import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useMutation<SelectUser | null, Error, LoginData>>;
  logoutMutation: ReturnType<typeof useMutation<boolean, Error, void>>;
  registerMutation: ReturnType<typeof useMutation<SelectUser | null, Error, InsertUser>>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation<SelectUser | null, Error, LoginData>({
    mutationFn: async (credentials) => {
      console.log("Login attempt with:", credentials.username);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        
        if (!res.ok) {
          let errorMsg = "Authentication failed";
          try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
          } catch (e) {
            // If we can't parse JSON, use status text
            errorMsg = res.statusText || errorMsg;
          }
          throw new Error(errorMsg);
        }
        
        // If successful, check for JSON content
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await res.json();
        }
        return null; // No content to parse
      } catch (error: any) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser | null) => {
      if (user) {
        queryClient.setQueryData(["/api/user"], user);
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name || user.username}!`,
        });
      } else {
        // Handle edge case where server returns a success but no user
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<SelectUser | null, Error, InsertUser>({
    mutationFn: async (credentials) => {
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        
        // If successful, check for JSON content
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await res.json();
        }
        return null; // No content to parse
      } catch (error: any) {
        console.error("Registration failed:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser | null) => {
      if (user) {
        queryClient.setQueryData(["/api/user"], user);
        toast({
          title: "Registration successful",
          description: "Your account has been created successfully!",
        });
      } else {
        toast({
          title: "Registration successful",
          description: "Your account has been created, please login",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<boolean, Error, void>({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
        return true;
      } catch (error: any) {
        console.error("Logout failed:", error);
        // Convert the error to a proper Error object
        throw new Error(error?.message || "Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
