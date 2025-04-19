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
  // Use Route to render the component, and within the Route component, use useAuth
  return (
    <Route path={path}>
      {() => {
        try {
          const { user, isLoading } = useAuth();

          if (isLoading) {
            return (
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            );
          }

          if (!user) {
            return <Redirect to="/auth" />;
          }

          return <Component />;
        } catch (error) {
          console.error("Auth error:", error);
          return <Redirect to="/auth" />;
        }
      }}
    </Route>
  );
}
