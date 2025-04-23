import { Switch, Route, Router as WouterRouter } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { GlobalCreateHabitDialog } from "@/components/global-create-habit-dialog";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import TasksPage from "@/pages/tasks-page";
import CalendarPage from "@/pages/calendar-page";
import HabitsPage from "@/pages/habits-page";
import StatsPage from "@/pages/stats-page";
import { ProtectedRoute } from "./lib/protected-route";

function Routes() {
  return (
    <Switch>
      <Route path='/auth' component={AuthPage} />
      <ProtectedRoute path='/' component={HomePage} />
      <ProtectedRoute path='/profile' component={ProfilePage} />
      <ProtectedRoute path='/tasks' component={TasksPage} />
      <ProtectedRoute path='/habits' component={HabitsPage} />
      <ProtectedRoute path='/calendar' component={CalendarPage} />
      <ProtectedRoute path='/stats' component={StatsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter>
            <Routes />
          </WouterRouter>
          <Toaster />
          <GlobalCreateHabitDialog />
        </AuthProvider>
      </TooltipProvider>
      {/* Add React Query DevTools - only in development */}
      {/* {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )} */}
    </QueryClientProvider>
  );
}

export default App;
