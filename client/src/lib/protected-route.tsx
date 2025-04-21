import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return (
    <Route path={path}>
      {(params) => {
        const { user, isLoading } = useAuth();
        const [location] = useLocation();

        // Add debugging logs
        console.log(`Protected route at ${path}:`, {
          user: !!user,
          isLoading,
          location,
          params,
        });

        if (isLoading) {
          console.log("Auth is loading, showing loader");
          return (
            <div className='flex items-center justify-center min-h-screen'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          );
        }

        if (!user) {
          console.log("No user found, redirecting to auth page");
          // Only redirect if we're not already on the auth page
          // This prevents redirect loops
          if (location !== "/auth") {
            return <Redirect to='/auth' />;
          }
          // If we're already on auth page but no user, just return null
          return null;
        }

        // User is authenticated, render the protected component
        console.log("User is authenticated, rendering protected component");
        return <Component />;
      }}
    </Route>
  );
}
