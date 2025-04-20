import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  insertUserSchema,
  User as SelectUser,
  InsertUser,
} from "@shared/schema";
import {
  getQueryFn,
  apiRequest,
  queryClient,
  useMutationWithInvalidation,
} from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutationWithInvalidation<SelectUser, LoginData>(
    async (credentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    [],
    {
      // Directly update the user data in cache
      updateCache: (user) => {
        queryClient.setQueryData(["/api/user"], user);
      },
      onSuccess: (user: SelectUser) => {
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name || user.username}!`,
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Login failed",
          description: error.message || "Invalid username or password",
          variant: "destructive",
        });
      },
    }
  );

  const registerMutation = useMutationWithInvalidation<SelectUser, InsertUser>(
    async (credentials) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    [],
    {
      // Directly update the user data in cache
      updateCache: (user) => {
        queryClient.setQueryData(["/api/user"], user);
      },
      onSuccess: (user: SelectUser) => {
        toast({
          title: "Registration successful",
          description: `Welcome to HabitHero, ${user.name || user.username}!`,
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Registration failed",
          description: error.message || "Could not create account",
          variant: "destructive",
        });
      },
    }
  );

  const logoutMutation = useMutationWithInvalidation<void, void>(
    async () => {
      await apiRequest("POST", "/api/logout");
    },
    ["/api/habits", "/api/completions"],
    {
      // Directly update the user data in cache
      updateCache: () => {
        queryClient.setQueryData(["/api/user"], null);
      },
      onSuccess: () => {
        // Clear all cache data
        queryClient.clear();
        toast({
          title: "Logged out",
          description: "You have been logged out successfully.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

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
